using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Cosmos DB implementation of <see cref="IPublicHolidayService"/>.
/// </summary>
public class CosmosDbPublicHolidayService(
    ApplicationDbContext db,
    ITravelConstraintsService constraintsService,
    ICurrentUserService currentUserService) : IPublicHolidayService
{
    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    public async Task<List<PublicHoliday>> GetForCurrentUserAsync()
    {
        var userId = GetCurrentUserId();
        var constraints = await constraintsService.GetAsync();
        var regions = constraints?.PublicHolidayRegions ?? [];

        // Fetch user-specific (ICS-imported) holidays — single partition query.
        var userHolidays = await db.PublicHolidays
            .Where(h => h.UserId == userId)
            .OrderBy(h => h.Date)
            .ToListAsync();

        if (regions.Count == 0)
            return userHolidays;

        // Fetch system holidays for the user's selected regions.
        // This is a cross-partition query on the system partition.
        var systemHolidays = await db.PublicHolidays
            .Where(h => h.UserId == PublicHoliday.SystemUserId && regions.Contains(h.Region))
            .OrderBy(h => h.Date)
            .ToListAsync();

        return [.. systemHolidays, .. userHolidays];
    }

    public async Task ImportIcsAsync(Stream icsContent)
    {
        var userId = GetCurrentUserId();

        var holidays = ParseIcs(icsContent);

        // Remove all existing user-imported holidays for this user.
        var existing = await db.PublicHolidays
            .Where(h => h.UserId == userId)
            .ToListAsync();

        db.PublicHolidays.RemoveRange(existing);

        foreach (var holiday in holidays)
        {
            holiday.UserId = userId;
            db.PublicHolidays.Add(holiday);
        }

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Minimal ICS parser that extracts VEVENT entries with a date-only DTSTART and a SUMMARY.
    /// Sufficient for public holiday ICS files (e.g. from calendrier.api.gouv.fr).
    /// </summary>
    internal static List<PublicHoliday> ParseIcs(Stream stream)
    {
        var holidays = new List<PublicHoliday>();
        using var reader = new StreamReader(stream, leaveOpen: true);

        string? dtStart = null;
        string? summary = null;
        bool inEvent = false;

        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            line = line.TrimEnd();
            if (line == "BEGIN:VEVENT")
            {
                inEvent = true;
                dtStart = null;
                summary = null;
                continue;
            }

            if (line == "END:VEVENT")
            {
                inEvent = false;
                if (dtStart != null && summary != null && TryParseIcsDate(dtStart, out var date))
                {
                    holidays.Add(new PublicHoliday
                    {
                        Id = Guid.NewGuid().ToString(),
                        Date = date,
                        Name = UnescapeIcsText(summary),
                        Region = string.Empty,
                    });
                }
                continue;
            }

            if (!inEvent) continue;

            if (line.StartsWith("DTSTART", StringComparison.OrdinalIgnoreCase))
            {
                var colonIdx = line.IndexOf(':');
                if (colonIdx >= 0)
                    dtStart = line[(colonIdx + 1)..].Trim();
            }
            else if (line.StartsWith("SUMMARY:", StringComparison.OrdinalIgnoreCase))
            {
                summary = line["SUMMARY:".Length..];
            }
        }

        return holidays;
    }

    /// <summary>
    /// Parses an ICS date value (YYYYMMDD or YYYY-MM-DD) into a <see cref="DateOnly"/>.
    /// </summary>
    private static bool TryParseIcsDate(string value, out DateOnly result)
    {
        result = default;
        // Strip time zone suffix if present
        var dateStr = value.Split('T', 'Z')[0].Replace("-", "");
        if (dateStr.Length == 8
            && int.TryParse(dateStr[..4], out var y)
            && int.TryParse(dateStr[4..6], out var m)
            && int.TryParse(dateStr[6..8], out var d))
        {
            try
            {
                result = new DateOnly(y, m, d);
                return true;
            }
            catch (ArgumentOutOfRangeException)
            {
                return false;
            }
        }
        return false;
    }

    /// <summary>Unescape ICS text escapes (\\, \n, \,).</summary>
    private static string UnescapeIcsText(string text) =>
        text.Replace("\\n", "\n").Replace("\\,", ",").Replace("\\\\", "\\");
}
