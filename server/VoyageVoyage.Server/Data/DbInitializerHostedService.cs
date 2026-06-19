using Microsoft.EntityFrameworkCore;

namespace VoyageVoyage.Server.Data;

/// <summary>
/// Background service that applies pending EF Core migrations and verifies database connectivity on startup.
/// Runs once when the host starts and stops gracefully.
/// If initialisation fails, the error is logged and the application continues; the
/// <c>/api/health</c> endpoint (backed by <see cref="Infrastructure.DatabaseHealthCheck"/>) will
/// report the degraded state.
/// </summary>
public class DbInitializerHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<DbInitializerHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Yield(); // Ensure this runs asynchronously after the host has started.

            await InitAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            // Swallow the exception so the host continues to start.
            // The /api/health endpoint will surface the degraded database state.
            logger.LogError(ex, "Database initialisation failed. The application will start but data access may not work.");
        }
    }

    private async Task WaitForDatabaseAsync(ApplicationDbContext db, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            if (await db.Database.CanConnectAsync(cancellationToken))
                return;
            logger.LogInformation("Database not ready, retrying in 2 seconds...");
            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }
    }

    private async Task InitAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        logger.LogInformation("Checking database connectivity...");
        await WaitForDatabaseAsync(db, cancellationToken);

        logger.LogInformation("Applying pending migrations...");
        await db.Database.MigrateAsync(cancellationToken);

        logger.LogInformation("Database initialisation completed successfully.");
    }
}
