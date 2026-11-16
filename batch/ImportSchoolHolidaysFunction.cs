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
/// HTTP-triggered Azure Function that imports school holidays for all users.
/// Performs a full replace (delete + re-insert) of system-imported school holidays for all zones.
/// </summary>
public class ImportSchoolHolidaysFunction(
    FranceSchoolHolidayApiService franceApiService,
    IDbContextFactory<BatchDbContext> dbContextFactory,
    ILogger<ImportSchoolHolidaysFunction> logger)
{
    [Function("ImportSchoolHolidays")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("ImportSchoolHolidays triggered.");

        foreach (var zone in FranceSchoolHolidayApiService.Zones)
        {
            await ImportZoneAsync(zone, cancellationToken);
        }

        logger.LogInformation("ImportSchoolHolidays completed.");
        return new OkResult();
    }

    private async Task ImportZoneAsync(string zone, CancellationToken cancellationToken)
    {
        logger.LogInformation("Importing school holidays for zone '{Zone}'.", zone);

        List<SchoolHoliday> holidays;
        try
        {
            holidays = await franceApiService.FetchZoneAsync(zone, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch school holidays for zone '{Zone}'.", zone);
            throw;
        }

        await using var db = await dbContextFactory.CreateDbContextAsync(cancellationToken);

        // Delete all existing system school holidays for this zone.
        var existing = await db.SchoolHolidays
            .Where(h => h.UserId == SchoolHoliday.SystemUserId && h.Zone == zone)
            .ToListAsync(cancellationToken);

        db.SchoolHolidays.RemoveRange(existing);

        // Insert the freshly fetched holidays.
        db.SchoolHolidays.AddRange(holidays);

        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Replaced {Removed} existing entries with {Added} new entries for zone '{Zone}'.",
            existing.Count, holidays.Count, zone);
    }
}
