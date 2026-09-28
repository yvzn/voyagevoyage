using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Tests.Services;

public class AnomalyDetectionServiceTests
{
    private static (AnomalyDetectionService service, ApplicationDbContext db) CreateService(string userId = "test-user")
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim("sub", userId) }, "TestScheme"));

        var httpContext = Substitute.For<HttpContext>();
        httpContext.User.Returns(principal);

        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns(httpContext);

        var logger = Substitute.For<ILogger<AppServiceCurrentUserService>>();
        var currentUserService = new AppServiceCurrentUserService(accessor, logger);

        var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new ApplicationDbContext(dbOptions);
        return (new AnomalyDetectionService(db, currentUserService), db);
    }

    [Fact]
    public async Task AnalyzeTripAsync_CreatesExpectedAlertsForPastTrip()
    {
        var (service, db) = CreateService();

        var trip = new Trip
        {
            Id = "trip-1",
            UserId = "test-user",
            StartDate = new DateOnly(2025, 1, 10),
            EndDate = new DateOnly(2025, 1, 15),
            Destination = "Paris",
            Status = TripStatus.Planned,
        };
        db.Trips.Add(trip);
        await db.SaveChangesAsync();

        var alerts = await service.AnalyzeTripAsync(trip.Id, DateTime.UtcNow);

        Assert.Contains(alerts, a => a.Type == AlertType.TripStillPlanned);
        Assert.Contains(alerts, a => a.Type == AlertType.MissingBooking);
        Assert.Contains(alerts, a => a.Type == AlertType.MissingReceipt);
    }

    [Fact]
    public async Task AnalyzeTripAsync_TriggersAtypicalReceiptAlertWhenAboveCategoryAverage()
    {
        var (service, db) = CreateService();

        var trip = new Trip
        {
            Id = "trip-atypical",
            UserId = "test-user",
            StartDate = new DateOnly(2025, 1, 10),
            EndDate = new DateOnly(2025, 1, 15),
            Destination = "Bordeaux",
            Status = TripStatus.Confirmed,
        };
        db.Trips.Add(trip);

        var normalTrip = new Trip
        {
            Id = "trip-normal",
            UserId = "test-user",
            StartDate = new DateOnly(2024, 2, 1),
            EndDate = new DateOnly(2024, 2, 5),
            Destination = "Lille",
            Status = TripStatus.Confirmed,
        };
        db.Trips.Add(normalTrip);

        db.Expenses.AddRange(
            new Expense { Id = "exp-1", UserId = "test-user", TripId = normalTrip.Id, Date = new DateOnly(2025, 2, 1), Category = ExpenseCategory.Hotel, Amount = 80m, Description = "Normal" },
            new Expense { Id = "exp-2", UserId = "test-user", TripId = normalTrip.Id, Date = new DateOnly(2025, 2, 2), Category = ExpenseCategory.Hotel, Amount = 90m, Description = "Normal" },
            new Expense { Id = "exp-3", UserId = "test-user", TripId = normalTrip.Id, Date = new DateOnly(2025, 2, 3), Category = ExpenseCategory.Hotel, Amount = 100m, Description = "Normal" });

        var currentExpense = new Expense
        {
            Id = "exp-current",
            UserId = "test-user",
            TripId = trip.Id,
            Date = new DateOnly(2025, 1, 12),
            Category = ExpenseCategory.Hotel,
            Amount = 300m,
            Description = "Atypical",
        };
        db.Expenses.Add(currentExpense);

        db.Receipts.AddRange(
            new Receipt { Id = "r1", UserId = "test-user", LinkedEntityType = ReceiptLinkedEntityType.Expense, LinkedEntityId = "exp-1", FileName = "1.pdf", ContentType = "application/pdf", BlobName = "blob1", UploadedAt = DateTimeOffset.UtcNow },
            new Receipt { Id = "r2", UserId = "test-user", LinkedEntityType = ReceiptLinkedEntityType.Expense, LinkedEntityId = "exp-2", FileName = "2.pdf", ContentType = "application/pdf", BlobName = "blob2", UploadedAt = DateTimeOffset.UtcNow },
            new Receipt { Id = "r3", UserId = "test-user", LinkedEntityType = ReceiptLinkedEntityType.Expense, LinkedEntityId = "exp-3", FileName = "3.pdf", ContentType = "application/pdf", BlobName = "blob3", UploadedAt = DateTimeOffset.UtcNow },
            new Receipt { Id = "rcurrent", UserId = "test-user", LinkedEntityType = ReceiptLinkedEntityType.Expense, LinkedEntityId = currentExpense.Id, FileName = "current.pdf", ContentType = "application/pdf", BlobName = "blob4", UploadedAt = DateTimeOffset.UtcNow });

        await db.SaveChangesAsync();

        var alerts = await service.AnalyzeTripAsync(trip.Id, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));

        Assert.Contains(alerts, a => a.Type == AlertType.AtypicalReceipt && a.ExpenseId == currentExpense.Id);
    }

    [Fact]
    public async Task AnalyzeTripAsync_DoesNotCreateDuplicateAlerts()
    {
        var (service, db) = CreateService();

        var trip = new Trip
        {
            Id = "trip-2",
            UserId = "test-user",
            StartDate = new DateOnly(2025, 1, 10),
            EndDate = new DateOnly(2025, 1, 15),
            Destination = "Lyon",
            Status = TripStatus.Planned,
        };
        db.Trips.Add(trip);
        await db.SaveChangesAsync();

        var firstPass = await service.AnalyzeTripAsync(trip.Id, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        var secondPass = await service.AnalyzeTripAsync(trip.Id, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));

        var persistedAlerts = await db.AnomalyAlerts.Where(a => a.TripId == trip.Id).ToListAsync();
        Assert.Equal(firstPass.Select(a => a.Id).Distinct().Count(), persistedAlerts.Count);
        Assert.Equal(persistedAlerts.Count, secondPass.Count);
    }

    [Fact]
    public async Task UpdateAlertStatusAsync_UpdatesStatus()
    {
        var (service, db) = CreateService();

        var trip = new Trip
        {
            Id = "trip-3",
            UserId = "test-user",
            StartDate = new DateOnly(2025, 1, 10),
            EndDate = new DateOnly(2025, 1, 15),
            Destination = "Nice",
            Status = TripStatus.Planned,
        };
        db.Trips.Add(trip);
        await db.SaveChangesAsync();

        var alerts = await service.AnalyzeTripAsync(trip.Id, new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        var alert = alerts.First();

        var updated = await service.UpdateAlertStatusAsync(alert.Id, AlertStatus.Ignored);

        Assert.NotNull(updated);
        Assert.Equal(AlertStatus.Ignored, updated!.Status);
        var persisted = await db.AnomalyAlerts.SingleAsync(a => a.Id == alert.Id);
        Assert.Equal(AlertStatus.Ignored, persisted.Status);
    }
}
