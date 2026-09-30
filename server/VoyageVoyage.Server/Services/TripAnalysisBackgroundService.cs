using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace VoyageVoyage.Server.Services;

public sealed class TripAnalysisBackgroundService(
    ITripAnalysisQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<TripAnalysisBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var job in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var anomalyDetectionService = scope.ServiceProvider.GetRequiredService<IAnomalyDetectionService>();
                await anomalyDetectionService.ReconcileTripAsync(job.UserId, job.TripId, cancellationToken: stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Trip analysis failed for user {UserId} and trip {TripId}.", job.UserId, job.TripId);

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                    queue.Enqueue(job.UserId, job.TripId);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
            }
        }
    }
}