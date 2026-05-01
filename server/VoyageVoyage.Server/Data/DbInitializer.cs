using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Data;

/// <summary>
/// Ensures the Cosmos DB database and containers are created on startup,
/// and seeds example data in development environments.
/// </summary>
public class DbInitializer(
    ApplicationDbContext db,
    IHostEnvironment env,
    ILogger<DbInitializer> logger)
{
    /// <summary>
    /// User ID used by <see cref="Authentication.MockCurrentUserService"/> in development.
    /// Seed data is assigned to this user so it is visible when running locally.
    /// </summary>
    private const string DevUserId = "dev-user-id";

    // Day offsets from today used to spread seed trips across the calendar.
    private const int PastConfirmedStartOffset   = -24;
    private const int PastConfirmedEndOffset     = -22;
    private const int PastPlannedStartOffset     = -16;
    private const int PastPlannedEndOffset       = -14;
    private const int PastCancelledStartOffset   = -8;
    private const int PastCancelledEndOffset     = -7;
    private const int FuturePlannedStartOffset   = 4;
    private const int FuturePlannedEndOffset     = 6;
    private const int FutureConfirmedStartOffset = 18;
    private const int FutureConfirmedEndOffset   = 20;

    /// <summary>
    /// Initializes the database: creates it if it does not exist,
    /// and populates it with example data if running in development and the trips container is empty.
    /// </summary>
    public async Task InitAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Ensuring database and containers exist...");
        await db.Database.EnsureCreatedAsync(cancellationToken);

        if (!env.IsDevelopment())
            return;

        if (await db.Trips.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Trips container already contains data. Skipping seed.");
            return;
        }

        logger.LogInformation("Seeding example trips for development...");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var trips = new List<Trip>
        {
            new() { Id = Guid.NewGuid().ToString(), UserId = DevUserId, StartDate = today.AddDays(PastConfirmedStartOffset),   EndDate = today.AddDays(PastConfirmedEndOffset),   Destination = "Lyon",      Status = TripStatus.Confirmed },
            new() { Id = Guid.NewGuid().ToString(), UserId = DevUserId, StartDate = today.AddDays(PastPlannedStartOffset),     EndDate = today.AddDays(PastPlannedEndOffset),     Destination = "Bordeaux",  Status = TripStatus.Planned   },
            new() { Id = Guid.NewGuid().ToString(), UserId = DevUserId, StartDate = today.AddDays(PastCancelledStartOffset),   EndDate = today.AddDays(PastCancelledEndOffset),   Destination = "Lille",     Status = TripStatus.Cancelled },
            new() { Id = Guid.NewGuid().ToString(), UserId = DevUserId, StartDate = today.AddDays(FuturePlannedStartOffset),   EndDate = today.AddDays(FuturePlannedEndOffset),   Destination = "Nantes",    Status = TripStatus.Planned   },
            new() { Id = Guid.NewGuid().ToString(), UserId = DevUserId, StartDate = today.AddDays(FutureConfirmedStartOffset), EndDate = today.AddDays(FutureConfirmedEndOffset), Destination = "Marseille", Status = TripStatus.Confirmed },
        };

        await db.Trips.AddRangeAsync(trips, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Seeded {Count} example trips.", trips.Count);
    }
}
