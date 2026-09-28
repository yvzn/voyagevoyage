using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public class AnomalyDetectionService(
    ApplicationDbContext db,
    ICurrentUserService currentUserService) : IAnomalyDetectionService
{
    private const int DefaultMinimumReceiptsForCategory = 3;

    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    public async Task<IReadOnlyList<AnomalyAlert>> AnalyzePastTripsAsync(DateTime? evaluationDate = null, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var today = (evaluationDate ?? DateTime.UtcNow).Date;
        var constraints = await db.TravelConstraints
            .Where(c => c.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);

        var windows = constraints is null
            ? new TravelConstraints()
            : constraints;

        var cutoffA1 = today.AddDays(-windows.A1MaxPastTripAgeDays);
        var cutoffA2 = today.AddDays(-windows.A2MinCompletionDelayDays);

        var candidateTrips = await db.Trips
            .Where(t => t.UserId == userId)
            .Where(t => t.EndDate <= DateOnly.FromDateTime(today))
            .Where(t => t.EndDate >= DateOnly.FromDateTime(cutoffA1))
            .Where(t => t.EndDate <= DateOnly.FromDateTime(cutoffA2))
            .ToListAsync(cancellationToken);

        var results = new List<AnomalyAlert>();
        foreach (var trip in candidateTrips)
        {
            results.AddRange(await DetectForTripAsync(trip, windows, today, cancellationToken));
        }

        return results;
    }

    public async Task<IReadOnlyList<AnomalyAlert>> AnalyzeTripAsync(string tripId, DateTime? evaluationDate = null, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var trip = await db.Trips
            .Where(t => t.UserId == userId && t.Id == tripId)
            .FirstOrDefaultAsync(cancellationToken);

        if (trip is null)
            return [];

        var constraints = await db.TravelConstraints
            .Where(c => c.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken) ?? new TravelConstraints();

        return await DetectForTripAsync(trip, constraints, (evaluationDate ?? DateTime.UtcNow).Date, cancellationToken);
    }

    public async Task<IReadOnlyList<AnomalyAlert>> GetAlertsAsync(AlertStatus? status = null, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        IQueryable<AnomalyAlert> query = db.AnomalyAlerts
            .Where(a => a.UserId == userId);

        if (status is not null)
            query = query.Where(a => a.Status == status.Value);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<AnomalyAlert?> UpdateAlertStatusAsync(string alertId, AlertStatus status, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var alert = await db.AnomalyAlerts
            .Where(a => a.Id == alertId && a.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);

        if (alert is null)
            return null;

        alert.Status = status;
        await db.SaveChangesAsync(cancellationToken);
        return alert;
    }

    private async Task<List<AnomalyAlert>> DetectForTripAsync(Trip trip, TravelConstraints constraints, DateTime evaluationDate, CancellationToken cancellationToken)
    {
        var alerts = new List<AnomalyAlert>();
        var userId = GetCurrentUserId();

        if (trip.Status == TripStatus.Planned && IsPastTrip(trip, evaluationDate))
        {
            alerts.Add(await UpsertAlertAsync(
                userId,
                trip,
                null,
                AlertType.TripStillPlanned,
                "Le voyage est resté au statut planifié après sa date de fin.",
                cancellationToken));
        }

        var hasTrainOrHotelBooking = HasBooking(trip);
        if (!hasTrainOrHotelBooking && IsPastTrip(trip, evaluationDate))
        {
            alerts.Add(await UpsertAlertAsync(
                userId,
                trip,
                null,
                AlertType.MissingBooking,
                "Aucune réservation de train ou d'hôtel n'a été enregistrée pour ce voyage.",
                cancellationToken));
        }

        var expenses = await db.Expenses
            .Where(e => e.UserId == userId && e.TripId == trip.Id)
            .ToListAsync(cancellationToken);

        var totalReceiptsCount = await db.Receipts
            .CountAsync(r => r.UserId == userId && r.LinkedEntityType == ReceiptLinkedEntityType.Expense && expenses.Select(e => e.Id).Contains(r.LinkedEntityId), cancellationToken);

        if (IsPastTrip(trip, evaluationDate) && totalReceiptsCount == 0)
        {
            alerts.Add(await UpsertAlertAsync(
                userId,
                trip,
                null,
                AlertType.MissingReceipt,
                "Aucun reçu n'a été associé à ce voyage.",
                cancellationToken));
        }

        foreach (var expense in expenses)
        {
            var expenseReceipts = await db.Receipts
                .Where(r => r.UserId == userId && r.LinkedEntityType == ReceiptLinkedEntityType.Expense && r.LinkedEntityId == expense.Id)
                .ToListAsync(cancellationToken);

            if (expenseReceipts.Count == 0)
                continue;

            var threshold = constraints.XAtypicalExpenseThresholdPercent;
            var average = await GetCategoryAverageAsync(userId, expense.Category, trip.EndDate, cancellationToken);
            var categoryReceiptCount = await GetCategoryReceiptCount(userId, expense.Category, trip.EndDate, cancellationToken);
            if (average > 0m && expense.Amount > average * (1m + threshold / 100m) && categoryReceiptCount >= DefaultMinimumReceiptsForCategory)
            {
                alerts.Add(await UpsertAlertAsync(
                    userId,
                    trip,
                    expense.Id,
                    AlertType.AtypicalReceipt,
                    $"Le montant du reçu est supérieur à la moyenne de la catégorie ({average:C}).",
                    cancellationToken));
            }
        }

        if (!hasTrainOrHotelBooking)
        {
            return alerts;
        }

        if (trip.TrainBooking is not null && trip.TrainBooking.DepartureDateTime is not null && trip.TrainBooking.ReturnDateTime is not null)
        {
            var departure = trip.TrainBooking.DepartureDateTime.Value.Date;
            var returnDate = trip.TrainBooking.ReturnDateTime.Value.Date;
            if (departure < trip.StartDate.ToDateTime(TimeOnly.MinValue) || returnDate > trip.EndDate.ToDateTime(TimeOnly.MaxValue))
            {
                alerts.Add(await UpsertAlertAsync(
                    userId,
                    trip,
                    null,
                    AlertType.BookingDatesInconsistent,
                    "Les dates de réservation de train sont incohérentes avec celles du voyage.",
                    cancellationToken));
            }
        }

        if (trip.HotelBooking is not null)
        {
            var hotelBookingDate = trip.HotelBooking.BookingDate;
            if (hotelBookingDate < trip.StartDate || hotelBookingDate > trip.EndDate)
            {
                alerts.Add(await UpsertAlertAsync(
                    userId,
                    trip,
                    null,
                    AlertType.BookingDatesInconsistent,
                    "Les dates de réservation d'hôtel sont incohérentes avec celles du voyage.",
                    cancellationToken));
            }
        }

        return alerts;
    }

    private async Task<AnomalyAlert> UpsertAlertAsync(
        string userId,
        Trip trip,
        string? expenseId,
        AlertType type,
        string description,
        CancellationToken cancellationToken)
    {
        var existing = await db.AnomalyAlerts
            .Where(a => a.UserId == userId && a.TripId == trip.Id && a.Type == type && a.ExpenseId == expenseId)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is not null)
        {
            return existing;
        }

        var alert = new AnomalyAlert
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            TripId = trip.Id,
            TripStartDate = trip.StartDate,
            TripEndDate = trip.EndDate,
            ExpenseId = expenseId,
            ReceiptId = expenseId is null ? null : (await db.Receipts
                .Where(r => r.UserId == userId && r.LinkedEntityType == ReceiptLinkedEntityType.Expense && r.LinkedEntityId == expenseId)
                .Select(r => r.Id)
                .FirstOrDefaultAsync(cancellationToken)),
            Type = type,
            Description = description,
            Status = AlertStatus.New,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.AnomalyAlerts.Add(alert);
        await db.SaveChangesAsync(cancellationToken);
        return alert;
    }

    private static bool IsPastTrip(Trip trip, DateTime evaluationDate)
    {
        var tripEnd = trip.EndDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        return tripEnd < evaluationDate.Date;
    }

    private static bool HasBooking(Trip trip)
    {
        return trip.TrainBooking is not null || trip.HotelBooking is not null;
    }

    private async Task<decimal> GetCategoryAverageAsync(string userId, ExpenseCategory category, DateOnly? tripEndDate, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var startDate = now.AddYears(-1).Date;

        return await db.Expenses
            .Where(e => e.UserId == userId && e.Category == category && e.Date >= DateOnly.FromDateTime(startDate))
            .AverageAsync(e => (decimal?)e.Amount, cancellationToken) ?? 0m;
    }

    private async Task<int> GetCategoryReceiptCount(string userId, ExpenseCategory category, DateOnly? tripEndDate, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var startDate = now.AddYears(-1).Date;

        return await db.Expenses
            .Where(e => e.UserId == userId && e.Category == category && e.Date >= DateOnly.FromDateTime(startDate))
            .CountAsync(cancellationToken);
    }
}
