using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using VoyageVoyage.Server.Data;

namespace VoyageVoyage.Server.Infrastructure;

/// <summary>
/// Health check that verifies connectivity to the Cosmos DB database.
/// </summary>
public class DatabaseHealthCheck(IServiceScopeFactory scopeFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cosmosClient = db.Database.GetCosmosClient();
            await cosmosClient.ReadAccountAsync();
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Cosmos DB is not reachable.", ex);
        }
    }
}
