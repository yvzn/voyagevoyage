using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
    [Function("DetectTripAnomalies")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("DetectTripAnomalies triggered.");

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
        return new OkResult();
    }

    private sealed class BatchCurrentUserService(string userId) : ICurrentUserService
    {
        public CurrentUser? GetCurrentUser() => new(userId, "Batch Job", string.Empty);
    }
}
