using batch.Data;
using batch.Models;
using batch.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace batch;

/// <summary>
/// HTTP-triggered Azure Function that imports public holidays for all users.
/// Performs a full replace (delete + re-insert) of system-imported holidays.
/// </summary>
public class ImportPublicHolidaysFunction(
    FrancePublicHolidayApiService franceApiService,
    IDbContextFactory<BatchDbContext> dbContextFactory,
    ILogger<ImportPublicHolidaysFunction> logger)
{
    [Function("ImportPublicHolidays")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("ImportPublicHolidays triggered.");

        await ImportRegionAsync(
            FrancePublicHolidayApiService.Region,
            () => franceApiService.FetchAsync(cancellationToken),
            cancellationToken);

        logger.LogInformation("ImportPublicHolidays completed.");
        return new OkResult();
    }

    private async Task ImportRegionAsync(
        string region,
        Func<Task<List<PublicHoliday>>> fetchHolidays,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Importing public holidays for region '{Region}'.", region);

        List<PublicHoliday> holidays;
        try
        {
            holidays = await fetchHolidays();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch public holidays for region '{Region}'.", region);
            throw;
        }

        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);

        // Delete all existing system holidays for this region.
        var existing = await db.PublicHolidays
            .Where(h => h.UserId == PublicHoliday.SystemUserId && h.Region == region)
            .ToListAsync(cancellationToken);

        db.PublicHolidays.RemoveRange(existing);

        // Insert the freshly fetched holidays.
        db.PublicHolidays.AddRange(holidays);

        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Replaced {Removed} existing entries with {Added} new entries for region '{Region}'.",
            existing.Count, holidays.Count, region);
    }
}
