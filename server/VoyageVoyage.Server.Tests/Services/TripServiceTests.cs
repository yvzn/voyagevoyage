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

public class TripServiceTests
{
    private static (TripService service, ApplicationDbContext db) CreateTripService(string userId = "test-user")
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

        var service = new TripService(db, currentUserService);
        return (service, db);
    }

    [Fact]
    public async Task PatchAsync_WithNullTrainBooking_PreservesExistingTrainBooking()
    {
        // Arrange
        var (service, db) = CreateTripService();
        var existingTrainBooking = new TrainBooking
        {
            Departure = "Paris",
            Arrival = "Lyon",
            DepartureDateTime = new DateTimeOffset(2026, 4, 6, 10, 0, 0, TimeSpan.Zero),
            ReturnDateTime = new DateTimeOffset(2026, 4, 9, 18, 0, 0, TimeSpan.Zero)
        };
        var newHotelBooking = new HotelBooking
        {
            BookingDate = new DateOnly(2026, 4, 6),
            HotelName = "Hotel Test",
            HotelAddress = "123 Test St"
        };

        var trip = new Trip
        {
            Id = "trip-1",
            UserId = "test-user",
            StartDate = new DateOnly(2026, 4, 6),
            EndDate = new DateOnly(2026, 4, 9),
            Destination = "Lyon",
            Status = TripStatus.Confirmed,
            TrainBooking = existingTrainBooking,
            HotelBooking = null
        };
        db.Trips.Add(trip);
        await db.SaveChangesAsync();

        // Act
        var result = await service.PatchAsync("trip-1", new PatchTripRequest(
            TrainBooking: null,
            HotelBooking: newHotelBooking));

        // Assert
        Assert.NotNull(result);
        Assert.Equal("trip-1", result.Id);
        Assert.NotNull(result.TrainBooking);
        Assert.Equal("Paris", result.TrainBooking.Departure);
        Assert.Equal("Lyon", result.TrainBooking.Arrival);
        Assert.NotNull(result.HotelBooking);
        Assert.Equal("Hotel Test", result.HotelBooking.HotelName);
        Assert.Equal(TripStatus.Confirmed, result.Status);
    }

    [Fact]
    public async Task PatchAsync_WithNullHotelBooking_PreservesExistingHotelBooking()
    {
        // Arrange
        var (service, db) = CreateTripService();
        var newTrainBooking = new TrainBooking
        {
            Departure = "Paris",
            Arrival = "Lyon",
            DepartureDateTime = new DateTimeOffset(2026, 4, 6, 10, 0, 0, TimeSpan.Zero),
            ReturnDateTime = null
        };
        var existingHotelBooking = new HotelBooking
        {
            BookingDate = new DateOnly(2026, 4, 6),
            HotelName = "Hotel Old",
            HotelAddress = "456 Old St"
        };

        var trip = new Trip
        {
            Id = "trip-2",
            UserId = "test-user",
            StartDate = new DateOnly(2026, 4, 6),
            EndDate = new DateOnly(2026, 4, 9),
            Destination = "Lyon",
            Status = TripStatus.Planned,
            TrainBooking = null,
            HotelBooking = existingHotelBooking
        };
        db.Trips.Add(trip);
        await db.SaveChangesAsync();

        // Act
        var result = await service.PatchAsync("trip-2", new PatchTripRequest(
            TrainBooking: newTrainBooking,
            HotelBooking: null));

        // Assert
        Assert.NotNull(result);
        Assert.Equal("trip-2", result.Id);
        Assert.NotNull(result.TrainBooking);
        Assert.Equal("Paris", result.TrainBooking.Departure);
        Assert.NotNull(result.HotelBooking);
        Assert.Equal("Hotel Old", result.HotelBooking.HotelName);
        Assert.Equal("456 Old St", result.HotelBooking.HotelAddress);
        Assert.Equal(TripStatus.Planned, result.Status);
    }

    [Fact]
    public async Task PatchAsync_NeverModifiesStatus()
    {
        // Arrange
        var (service, db) = CreateTripService();
        var trip = new Trip
        {
            Id = "trip-3",
            UserId = "test-user",
            StartDate = new DateOnly(2026, 4, 6),
            EndDate = new DateOnly(2026, 4, 9),
            Destination = "Lyon",
            Status = TripStatus.Confirmed,
            TrainBooking = null,
            HotelBooking = null
        };
        db.Trips.Add(trip);
        await db.SaveChangesAsync();

        // Act — patch with a train booking
        var result = await service.PatchAsync("trip-3", new PatchTripRequest(
            TrainBooking: new TrainBooking
            {
                Departure = "Paris",
                Arrival = "Lyon",
                DepartureDateTime = new DateTimeOffset(2026, 4, 6, 10, 0, 0, TimeSpan.Zero),
                ReturnDateTime = null
            },
            HotelBooking: null));

        // Assert — Status must remain Confirmed, not reset to Planned
        Assert.NotNull(result);
        Assert.Equal(TripStatus.Confirmed, result.Status);
    }

    [Fact]
    public async Task PatchAsync_ReturnsNullForMissingTrip()
    {
        // Arrange
        var (service, _) = CreateTripService();

        // Act
        var result = await service.PatchAsync("nonexistent", new PatchTripRequest(
            TrainBooking: new TrainBooking { Departure = "A", Arrival = "B", DepartureDateTime = null, ReturnDateTime = null },
            HotelBooking: null));

        // Assert
        Assert.Null(result);
    }
}
