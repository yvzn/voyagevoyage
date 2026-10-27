using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public sealed class ExpectedExpenseService(
    ApplicationDbContext db,
    ICurrentUserService currentUserService) : IExpectedExpenseService
{
    private static readonly Regex WhitespaceRegex = new(@"\s+", RegexOptions.Compiled);

    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    public async Task<ExpectedExpensesResponse?> GetForTripAsync(string tripId)
    {
        var userId = GetCurrentUserId();
        var trip = await db.Trips
            .Where(candidate => candidate.Id == tripId && candidate.UserId == userId)
            .FirstOrDefaultAsync();
        if (trip is null)
            return null;

        var constraints = await db.TravelConstraints
            .Where(candidate => candidate.UserId == userId)
            .FirstOrDefaultAsync() ?? new TravelConstraints();

        var historyTrips = await (
            from historicalTrip in db.Trips
                .Where(candidate =>
                    candidate.UserId == userId &&
                    candidate.Id != trip.Id &&
                    candidate.Status != TripStatus.Cancelled &&
                    candidate.EndDate < trip.StartDate &&
                    db.Expenses.Any(expense =>
                        expense.TripId == candidate.Id &&
                        expense.UserId == userId))
                .OrderByDescending(candidate => candidate.EndDate)
                .ThenByDescending(candidate => candidate.StartDate)
                .Take(constraints.ExpectedExpenseHistoryTripCount)
            join expense in db.Expenses.Where(candidate => candidate.UserId == userId)
                on historicalTrip.Id equals expense.TripId
            select new HistoricalExpenseRow(
                historicalTrip.Id,
                historicalTrip.StartDate,
                historicalTrip.EndDate,
                historicalTrip.Destination,
                expense.Date,
                expense.Category,
                expense.Description))
            .ToListAsync();

        var history = historyTrips
            .GroupBy(row => row.TripId)
            .Select(group => new HistoricalTrip(
                group.Key,
                group.First().StartDate,
                group.First().EndDate,
                group.First().Destination,
                group.Select(row => new HistoricalExpense(row.Date, row.Category, row.Description)).ToList()))
            .ToList();

        var matchingDestinationTrips = history
            .Where(historicalTrip =>
                Normalize(historicalTrip.Destination) == Normalize(trip.Destination))
            .ToList();
        if (matchingDestinationTrips.Count >= constraints.ExpectedExpenseDestinationMinimumCount)
            history = matchingDestinationTrips;

        if (history.Count < constraints.ExpectedExpenseMinimumSampleSize)
            history = [];

        var currentExpenses = await db.Expenses
            .Where(expense => expense.TripId == tripId && expense.UserId == userId)
            .ToListAsync();

        var tripDays = GetTripDays(trip.StartDate, trip.EndDate);
        var patternsByRole = history.Count == 0
            ? new Dictionary<ExpectedExpenseDayRole, IReadOnlyList<ExpensePattern>>()
            : Enum.GetValues<ExpectedExpenseDayRole>()
                .ToDictionary(
                    role => role,
                    role => GetPatternsForRole(
                        history,
                        role,
                        constraints.ExpectedExpenseHabitThresholdPercent));
        var expectedByDate = new Dictionary<DateOnly, List<ExpectedExpenseSlot>>();

        foreach (var day in tripDays)
        {
            var slots = new List<ExpectedExpenseSlot>();
            if (trip.TrainBooking is not null)
            {
                var bookingDate = trip.TrainBooking.DepartureDateTime is { } departureDateTime
                    ? DateOnly.FromDateTime(departureDateTime.DateTime)
                    : trip.StartDate;
                if (day.Date == bookingDate)
                {
                    slots.Add(CreateMissingSlot(
                        day.Date,
                        ExpenseCategory.Train,
                        $"{trip.TrainBooking.Departure} → {trip.TrainBooking.Arrival}",
                        0));
                }
            }

            if (trip.HotelBooking is not null && day.Date == trip.HotelBooking.BookingDate)
            {
                slots.Add(CreateMissingSlot(
                    day.Date,
                    ExpenseCategory.Hotel,
                    trip.HotelBooking.HotelName,
                    0));
            }

            if (patternsByRole.TryGetValue(day.Role, out var patterns))
            {
                foreach (var pattern in patterns)
                {
                    if ((pattern.Category == ExpenseCategory.Train && trip.TrainBooking is not null) ||
                        (pattern.Category == ExpenseCategory.Hotel && trip.HotelBooking is not null))
                        continue;

                    for (var occurrence = 0; occurrence < pattern.Count; occurrence++)
                    {
                        slots.Add(CreateMissingSlot(day.Date, pattern.Category, pattern.Detail, occurrence));
                    }
                }
            }

            expectedByDate[day.Date] = slots;
        }

        var unconsumedExpenses = currentExpenses
            .Where(expense => expense.Date >= trip.StartDate && expense.Date <= trip.EndDate)
            .OrderBy(expense => expense.Id, StringComparer.Ordinal)
            .ToList();
        var days = new List<ExpectedExpenseDay>(tripDays.Count);
        var total = 0;
        var covered = 0;

        foreach (var day in tripDays)
        {
            var slots = expectedByDate[day.Date];
            var matchesBySlotId = new Dictionary<string, Expense>();

            var matchOrder = slots
                .OrderByDescending(slot => unconsumedExpenses.Any(expense =>
                    expense.Date == day.Date &&
                    expense.Category == slot.Category &&
                    Normalize(expense.Description) == Normalize(slot.Detail)))
                .ThenBy(slot => slot.SlotId, StringComparer.Ordinal);
            foreach (var slot in matchOrder)
            {
                var matchingExpense = FindMatchingExpense(unconsumedExpenses, slot, day.Date);
                if (matchingExpense is null)
                    continue;

                unconsumedExpenses.Remove(matchingExpense);
                matchesBySlotId.Add(slot.SlotId, matchingExpense);
            }

            var reconciled = slots.Select(slot =>
            {
                if (!matchesBySlotId.TryGetValue(slot.SlotId, out var matchingExpense))
                    return slot;

                covered++;
                return slot with
                {
                    State = ExpectedExpenseState.Done,
                    ExpenseId = matchingExpense.Id,
                };
            }).ToList();
            total += reconciled.Count;
            days.Add(new ExpectedExpenseDay(day.Date, day.Role, reconciled));
        }

        return new ExpectedExpensesResponse(
            new ExpectedExpensesSummary(total, covered, total - covered),
            days);
    }

    private static List<TripDay> GetTripDays(DateOnly startDate, DateOnly endDate)
    {
        var count = endDate.DayNumber - startDate.DayNumber + 1;
        var days = new List<TripDay>(count);
        for (var offset = 0; offset < count; offset++)
        {
            var role = count == 1
                ? ExpectedExpenseDayRole.Single
                : offset == 0
                    ? ExpectedExpenseDayRole.First
                    : offset == count - 1
                        ? ExpectedExpenseDayRole.Last
                        : ExpectedExpenseDayRole.Intermediate;
            days.Add(new TripDay(startDate.AddDays(offset), role));
        }
        return days;
    }

    private static IReadOnlyList<ExpensePattern> GetPatternsForRole(
        IReadOnlyList<HistoricalTrip> history,
        ExpectedExpenseDayRole role,
        decimal thresholdPercent)
    {
        var tripExpenses = history
            .Select(trip => new
            {
                trip.Id,
                Expenses = trip.Expenses
                    .Where(expense =>
                        expense.Date >= trip.StartDate &&
                        expense.Date <= trip.EndDate &&
                        GetRole(expense.Date, trip.StartDate, trip.EndDate) == role)
                    .ToList(),
            })
            .ToList();

        var patterns = new List<ExpensePattern>();
        var categories = tripExpenses
            .SelectMany(trip => trip.Expenses)
            .Select(expense => expense.Category)
            .Distinct()
            .Order();

        foreach (var category in categories)
        {
            var entries = tripExpenses
                .SelectMany(trip => trip.Expenses
                    .Where(expense => expense.Category == category)
                    .Select(expense => new { trip.Id, Expense = expense }))
                .ToList();
            var hasQualifyingDetail = false;

            foreach (var detailGroup in entries
                .Where(entry => !string.IsNullOrWhiteSpace(entry.Expense.Description))
                .GroupBy(entry => Normalize(entry.Expense.Description))
                .OrderBy(group => group.Key, StringComparer.Ordinal))
            {
                var countsByTrip = detailGroup
                    .GroupBy(entry => entry.Id)
                    .ToDictionary(group => group.Key, group => group.Count());
                if (!MeetsThreshold(countsByTrip.Count, history.Count, thresholdPercent))
                    continue;

                hasQualifyingDetail = true;
                var displayDetail = detailGroup
                    .GroupBy(entry => entry.Expense.Description.Trim())
                    .OrderByDescending(group => group.Count())
                    .ThenBy(group => group.Key, StringComparer.Ordinal)
                    .First()
                    .Key;
                patterns.Add(new ExpensePattern(
                    category,
                    displayDetail,
                    GetMedianCount(countsByTrip.Values)));
            }

            if (hasQualifyingDetail)
                continue;

            var countsByCategoryTrip = entries
                .GroupBy(entry => entry.Id)
                .ToDictionary(group => group.Key, group => group.Count());
            if (MeetsThreshold(countsByCategoryTrip.Count, history.Count, thresholdPercent))
            {
                patterns.Add(new ExpensePattern(
                    category,
                    string.Empty,
                    GetMedianCount(countsByCategoryTrip.Values)));
            }
        }

        return patterns;
    }

    private static ExpectedExpenseDayRole GetRole(DateOnly date, DateOnly startDate, DateOnly endDate)
    {
        if (startDate == endDate)
            return ExpectedExpenseDayRole.Single;
        if (date == startDate)
            return ExpectedExpenseDayRole.First;
        if (date == endDate)
            return ExpectedExpenseDayRole.Last;
        return ExpectedExpenseDayRole.Intermediate;
    }

    private static bool MeetsThreshold(int occurrenceTrips, int corpusSize, decimal thresholdPercent) =>
        corpusSize > 0 && occurrenceTrips * 100m / corpusSize >= thresholdPercent;

    private static int GetMedianCount(IEnumerable<int> counts)
    {
        var ordered = counts.Order().ToArray();
        if (ordered.Length == 0)
            return 1;

        var middle = ordered.Length / 2;
        var median = ordered.Length % 2 == 0
            ? (ordered[middle - 1] + ordered[middle]) / 2m
            : ordered[middle];
        return Math.Max(1, (int)Math.Round(median, MidpointRounding.AwayFromZero));
    }

    private static ExpectedExpenseSlot CreateMissingSlot(
        DateOnly date,
        ExpenseCategory category,
        string detail,
        int occurrence)
    {
        var key = $"{date:yyyy-MM-dd}|{category}|{Normalize(detail)}|{occurrence}";
        var slotId = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(key))).ToLowerInvariant();
        return new ExpectedExpenseSlot(slotId, category, detail, ExpectedExpenseState.Missing, null);
    }

    private static Expense? FindMatchingExpense(
        IReadOnlyList<Expense> expenses,
        ExpectedExpenseSlot slot,
        DateOnly date)
    {
        var sameCategoryAndDate = expenses
            .Where(expense => expense.Date == date && expense.Category == slot.Category)
            .ToList();
        if (sameCategoryAndDate.Count == 0)
            return null;

        var normalizedDetail = Normalize(slot.Detail);
        return sameCategoryAndDate
            .Where(expense => Normalize(expense.Description) == normalizedDetail)
            .OrderBy(expense => expense.Id, StringComparer.Ordinal)
            .FirstOrDefault()
            ?? sameCategoryAndDate.OrderBy(expense => expense.Id, StringComparer.Ordinal).FirstOrDefault();
    }

    private static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var decomposed = value
            .Trim()
            .ToLowerInvariant()
            .Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                builder.Append(character);
        }

        return WhitespaceRegex.Replace(builder.ToString().Normalize(NormalizationForm.FormC), " ").Trim();
    }

    private sealed record TripDay(DateOnly Date, ExpectedExpenseDayRole Role);
    private sealed record ExpensePattern(ExpenseCategory Category, string Detail, int Count);
    private sealed record HistoricalExpenseRow(
        string TripId,
        DateOnly StartDate,
        DateOnly EndDate,
        string Destination,
        DateOnly Date,
        ExpenseCategory Category,
        string Description);
    private sealed record HistoricalTrip(
        string Id,
        DateOnly StartDate,
        DateOnly EndDate,
        string Destination,
        IReadOnlyList<HistoricalExpense> Expenses);
    private sealed record HistoricalExpense(DateOnly Date, ExpenseCategory Category, string Description);
}
