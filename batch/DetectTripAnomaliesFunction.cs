using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace batch;

public class DetectTripAnomaliesFunction(
    ApplicationDbContext db,
    ILogger<DetectTripAnomaliesFunction> logger)
{
    private const string CronSchedule = "0 0 0 1,15 * *";

    [Function("DetectTripAnomalies")]
    public async Task Run(
#if DEBUG
        [TimerTrigger(CronSchedule, RunOnStartup = true)]
#else
        [TimerTrigger(CronSchedule, RunOnStartup = false)]
#endif
        TimerInfo timer,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("DetectTripAnomalies triggered. IsPastDue: {IsPastDue}", timer.IsPastDue);

        var userIds = await db.Trips
            .AsNoTracking()
            .Select(t => t.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var analysisTasks = userIds
            .Select(userId =>
            {
                var detection = new AnomalyDetectionService(db, new BatchCurrentUserService(userId));
                return detection.AnalyzePastTripsForUserAsync(userId, cancellationToken: cancellationToken);
            })
            .ToList();

        await Task.WhenAll(analysisTasks);

        logger.LogInformation("DetectTripAnomalies completed for {UserCount} users.", userIds.Count);
    }

    private sealed class BatchCurrentUserService(string userId) : ICurrentUserService
    {
        public CurrentUser? GetCurrentUser() => new(userId, "Batch Job", string.Empty);
    }
}
