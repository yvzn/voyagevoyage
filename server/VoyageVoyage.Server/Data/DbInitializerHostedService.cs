using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Data;

/// <summary>
/// Background service that initialises the Cosmos DB database on application startup.
/// Runs once when the host starts and stops gracefully.
/// If initialisation fails, the error is logged and the application continues; the
/// <c>/api/health</c> endpoint (backed by <see cref="Infrastructure.DatabaseHealthCheck"/>) will
/// report the degraded state.
/// </summary>
public class DbInitializerHostedService(
    IServiceScopeFactory scopeFactory,
    IHostEnvironment env,
    ILogger<DbInitializerHostedService> logger) : BackgroundService
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

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await InitAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            // Swallow the exception so the host continues to start.
            // The /api/health endpoint will surface the degraded database state.
            logger.LogError(ex, "Database initialisation failed. The application will start but data access may not work.");
        }
    }

    private async Task InitAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        logger.LogInformation("Ensuring database and containers exist...");
        await db.Database.EnsureCreatedAsync(cancellationToken);

        if (!env.IsDevelopment())
            return;

        if (await db.Trips.FirstOrDefaultAsync(cancellationToken) != null)
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
