using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;
using Xunit;

namespace VoyageVoyage.Server.Tests.Services;

public class ExpectedExpenseServiceTests
{
    private static (ExpectedExpenseService service, ApplicationDbContext db) CreateService(
        string userId = "test-user")
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim("sub", userId)], "TestScheme"));
        var httpContext = Substitute.For<HttpContext>();
        httpContext.User.Returns(principal);
        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns(httpContext);
        var logger = Substitute.For<ILogger<AppServiceCurrentUserService>>();
        var currentUserService = new AppServiceCurrentUserService(accessor, logger);

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new ApplicationDbContext(options);
        return (new ExpectedExpenseService(db, currentUserService), db);
    }

    [Fact]
    public async Task GetForTripAsync_UsesMedianCountsForHabitualCategoryWithoutDetail()
    {
        var (service, db) = CreateService();
        db.Trips.Add(CurrentTrip());
        AddHistoryTrip(db, "past-1", "Nantes", new DateOnly(2026, 5, 1), 2, ExpenseCategory.Meal, "");
        AddHistoryTrip(db, "past-2", "Nantes", new DateOnly(2026, 6, 1), 2, ExpenseCategory.Meal, "");
        AddHistoryTrip(db, "past-3", "Nantes", new DateOnly(2026, 7, 1), 1, ExpenseCategory.Meal, "");
        AddHistoryTrip(db, "cancelled", "Nantes", new DateOnly(2026, 7, 15), 1, ExpenseCategory.Meal, "", TripStatus.Cancelled);
        await db.SaveChangesAsync();

        var result = await service.GetForTripAsync("current");

        Assert.NotNull(result);
        Assert.Equal(2, result.Summary.Total);
        Assert.Equal(2, result.Summary.Missing);
        var lastDay = Assert.Single(result.Days, day => day.Date == new DateOnly(2026, 8, 26));
        Assert.Equal(ExpectedExpenseDayRole.Last, lastDay.Role);
        Assert.Equal(2, lastDay.Slots.Count);
        Assert.All(lastDay.Slots, slot =>
        {
            Assert.Equal(ExpenseCategory.Meal, slot.Category);
            Assert.Equal(string.Empty, slot.Detail);
            Assert.Equal(ExpectedExpenseState.Missing, slot.State);
        });
        Assert.Equal(3, result.Days.Count);
    }

    [Fact]
    public async Task GetForTripAsync_ExcludesCancelledTripsFromMinimumHistorySample()
    {
        var (service, db) = CreateService();
        db.Trips.Add(CurrentTrip());
        AddHistoryTrip(db, "past-1", "Nantes", new DateOnly(2026, 5, 1), 1, ExpenseCategory.Meal, "");
        AddHistoryTrip(db, "past-2", "Nantes", new DateOnly(2026, 6, 1), 1, ExpenseCategory.Meal, "");
        AddHistoryTrip(db, "cancelled", "Nantes", new DateOnly(2026, 7, 1), 1, ExpenseCategory.Meal, "", TripStatus.Cancelled);
        await db.SaveChangesAsync();

        var result = await service.GetForTripAsync("current");

        Assert.NotNull(result);
        Assert.Equal(0, result.Summary.Total);
        Assert.All(result.Days, day => Assert.Empty(day.Slots));
    }

    [Fact]
    public async Task GetForTripAsync_PrefersNormalizedDetailAndDestinationSpecificHistory()
    {
        var (service, db) = CreateService();
        db.Trips.Add(CurrentTrip());
        AddHistoryTrip(db, "nantes-1", "Nantes", new DateOnly(2026, 5, 1), 1, ExpenseCategory.MetroBus, "Métro Nantes");
        AddHistoryTrip(db, "nantes-2", "Nantes", new DateOnly(2026, 6, 1), 1, ExpenseCategory.MetroBus, "Métro Nantes");
        AddHistoryTrip(db, "nantes-3", "Nantes", new DateOnly(2026, 7, 1), 1, ExpenseCategory.MetroBus, "Métro Nantes");
        AddHistoryTrip(db, "paris-1", "Paris", new DateOnly(2026, 7, 15), 1, ExpenseCategory.Train, "Train retour");
        AddHistoryTrip(db, "paris-2", "Paris", new DateOnly(2026, 7, 20), 1, ExpenseCategory.Train, "Train retour");
        db.Expenses.Add(new Expense
        {
            Id = "current-expense",
            UserId = "test-user",
            TripId = "current",
            Date = new DateOnly(2026, 8, 26),
            Category = ExpenseCategory.MetroBus,
            Amount = 0.01m,
            Description = "metro nantes",
        });
        await db.SaveChangesAsync();

        var result = await service.GetForTripAsync("current");

        Assert.NotNull(result);
        Assert.Equal(1, result.Summary.Total);
        Assert.Equal(1, result.Summary.Covered);
        var slot = Assert.Single(result.Days.Single(day => day.Date == new DateOnly(2026, 8, 26)).Slots);
        Assert.Equal("Métro Nantes", slot.Detail);
        Assert.Equal("current-expense", slot.ExpenseId);
        Assert.Equal(ExpectedExpenseState.Done, slot.State);
    }

    [Fact]
    public async Task GetForTripAsync_MatchesExactDetailsBeforeCategoryFallback()
    {
        var (service, db) = CreateService();
        db.Trips.Add(CurrentTrip());
        AddHistoryTrip(db, "past-1", "Nantes", new DateOnly(2026, 5, 1), 1, ExpenseCategory.Meal, "Breakfast");
        AddHistoryTrip(db, "past-2", "Nantes", new DateOnly(2026, 6, 1), 1, ExpenseCategory.Meal, "Breakfast");
        AddHistoryTrip(db, "past-3", "Nantes", new DateOnly(2026, 7, 1), 1, ExpenseCategory.Meal, "Breakfast");
        db.Expenses.AddRange(
            new Expense
            {
                Id = "past-1-dinner",
                UserId = "test-user",
                TripId = "past-1",
                Date = new DateOnly(2026, 5, 3),
                Category = ExpenseCategory.Meal,
                Amount = 20m,
                Description = "Dinner",
            },
            new Expense
            {
                Id = "past-2-dinner",
                UserId = "test-user",
                TripId = "past-2",
                Date = new DateOnly(2026, 6, 3),
                Category = ExpenseCategory.Meal,
                Amount = 22m,
                Description = "Dinner",
            },
            new Expense
            {
                Id = "current-dinner",
                UserId = "test-user",
                TripId = "current",
                Date = new DateOnly(2026, 8, 26),
                Category = ExpenseCategory.Meal,
                Amount = 25m,
                Description = "Dinner",
            });
        await db.SaveChangesAsync();

        var result = await service.GetForTripAsync("current");

        Assert.NotNull(result);
        Assert.Equal(2, result.Summary.Total);
        Assert.Equal(1, result.Summary.Covered);
        var lastDay = result.Days.Single(day => day.Date == new DateOnly(2026, 8, 26));
        var dinnerSlot = Assert.Single(lastDay.Slots, slot => slot.Detail == "Dinner");
        var breakfastSlot = Assert.Single(lastDay.Slots, slot => slot.Detail == "Breakfast");
        Assert.Equal(ExpectedExpenseState.Done, dinnerSlot.State);
        Assert.Equal("current-dinner", dinnerSlot.ExpenseId);
        Assert.Equal(ExpectedExpenseState.Missing, breakfastSlot.State);
    }

    [Fact]
    public async Task GetForTripAsync_UsesReservationsWithoutHistoryAndOneTrainSlot()
    {
        var (service, db) = CreateService();
        var trip = CurrentTrip();
        trip.TrainBooking = new TrainBooking
        {
            Departure = "Paris",
            Arrival = "Nantes",
            DepartureDateTime = new DateTimeOffset(2026, 8, 24, 8, 30, 0, TimeSpan.FromHours(2)),
            ReturnDateTime = new DateTimeOffset(2026, 8, 26, 18, 0, 0, TimeSpan.FromHours(2)),
        };
        trip.HotelBooking = new HotelBooking
        {
            BookingDate = new DateOnly(2026, 8, 25),
            HotelName = "Hôtel de la Gare",
            HotelAddress = "Nantes",
        };
        db.Trips.Add(trip);
        await db.SaveChangesAsync();

        var result = await service.GetForTripAsync("current");

        Assert.NotNull(result);
        Assert.Equal(2, result.Summary.Total);
        var trainSlot = Assert.Single(result.Days
            .Single(day => day.Date == new DateOnly(2026, 8, 24))
            .Slots);
        Assert.Equal(ExpenseCategory.Train, trainSlot.Category);
        Assert.Equal("Paris → Nantes", trainSlot.Detail);
        var hotelSlot = Assert.Single(result.Days
            .Single(day => day.Date == new DateOnly(2026, 8, 25))
            .Slots);
        Assert.Equal(ExpenseCategory.Hotel, hotelSlot.Category);
        Assert.Equal("Hôtel de la Gare", hotelSlot.Detail);
    }

    [Fact]
    public async Task GetForTripAsync_ReturnsNullForTripOwnedByAnotherUser()
    {
        var (service, db) = CreateService();
        db.Trips.Add(new Trip
        {
            Id = "other",
            UserId = "another-user",
            Destination = "Nantes",
            StartDate = new DateOnly(2026, 8, 24),
            EndDate = new DateOnly(2026, 8, 26),
        });
        await db.SaveChangesAsync();

        var result = await service.GetForTripAsync("other");

        Assert.Null(result);
    }

    private static Trip CurrentTrip() => new()
    {
        Id = "current",
        UserId = "test-user",
        Destination = "Nantes",
        StartDate = new DateOnly(2026, 8, 24),
        EndDate = new DateOnly(2026, 8, 26),
        Status = TripStatus.Confirmed,
    };

    private static void AddHistoryTrip(
        ApplicationDbContext db,
        string id,
        string destination,
        DateOnly startDate,
        int endDayMealCount,
        ExpenseCategory category,
        string description,
        TripStatus status = TripStatus.Confirmed)
    {
        var trip = new Trip
        {
            Id = id,
            UserId = "test-user",
            Destination = destination,
            StartDate = startDate,
            EndDate = startDate.AddDays(2),
            Status = status,
        };
        db.Trips.Add(trip);
        for (var index = 0; index < endDayMealCount; index++)
        {
            db.Expenses.Add(new Expense
            {
                Id = $"{id}-expense-{index}",
                UserId = "test-user",
                TripId = id,
                Date = trip.EndDate,
                Category = category,
                Amount = index + 1,
                Description = description,
            });
        }
    }
}
