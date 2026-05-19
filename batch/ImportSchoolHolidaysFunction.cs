using batch.Data;
using batch.Models;
using batch.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace batch;

/// <summary>
/// Timer-triggered Azure Function that imports school holidays for all users.
/// Runs on the 1st of every month at midnight UTC.
/// Performs a full replace (delete + re-insert) of system-imported school holidays for all zones.
/// </summary>
public class ImportSchoolHolidaysFunction(
    FranceSchoolHolidayApiService franceApiService,
    IDbContextFactory<BatchDbContext> dbContextFactory,
    ILogger<ImportSchoolHolidaysFunction> logger)
{
    /// <summary>CRON expression: run at 00:00:00 on the 1st of every month.</summary>
    private const string CronSchedule = "0 0 0 1 * *";

    [Function("ImportSchoolHolidays")]
    public async Task Run(
#if DEBUG
        [TimerTrigger(CronSchedule, RunOnStartup = true)]
#else
        [TimerTrigger(CronSchedule)]
#endif
        TimerInfo timer,
        CancellationToken cancellationToken)
    {
#if DEBUG
        await Task.Delay(20_000, cancellationToken); // Simulate some startup delay in debug mode.
#endif

        logger.LogInformation(
            "ImportSchoolHolidays triggered. IsPastDue: {IsPastDue}",
            timer.IsPastDue);

        foreach (var zone in FranceSchoolHolidayApiService.Zones)
        {
            await ImportZoneAsync(zone, cancellationToken);
        }

        logger.LogInformation("ImportSchoolHolidays completed.");
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
            return;
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
