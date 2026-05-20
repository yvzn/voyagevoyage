using batch.Data;
using batch.Models;
using batch.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace batch;

/// <summary>
/// Timer-triggered Azure Function that imports public holidays for all users.
/// Runs on the 1st of every month at midnight UTC.
/// Performs a full replace (delete + re-insert) of system-imported holidays.
/// </summary>
public class ImportPublicHolidaysFunction(
    FrancePublicHolidayApiService franceApiService,
    IDbContextFactory<BatchDbContext> dbContextFactory,
    ILogger<ImportPublicHolidaysFunction> logger)
{
    /// <summary>CRON expression: run at 00:00:00 on the 1st of every month.</summary>
    private const string CronSchedule = "0 0 0 1 * *";

    [Function("ImportPublicHolidays")]
    public async Task Run(
#if DEBUG
        [TimerTrigger(CronSchedule, RunOnStartup = true)]
#else
        [TimerTrigger(CronSchedule, RunOnStartup = false)]
#endif
        TimerInfo timer,
        CancellationToken cancellationToken)
    {
#if DEBUG
        await Task.Delay(10_000, cancellationToken); // Simulate some startup delay in debug mode.
#endif

        logger.LogInformation(
            "ImportPublicHolidays triggered. IsPastDue: {IsPastDue}",
            timer.IsPastDue);

        await ImportRegionAsync(
            FrancePublicHolidayApiService.Region,
            () => franceApiService.FetchAsync(cancellationToken),
            cancellationToken);

        logger.LogInformation("ImportPublicHolidays completed.");
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
            return;
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
