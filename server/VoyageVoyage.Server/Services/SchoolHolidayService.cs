using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// PostgreSQL implementation of <see cref="ISchoolHolidayService"/>.
/// </summary>
public class SchoolHolidayService(
    ApplicationDbContext db,
    ITravelConstraintsService constraintsService,
    ICurrentUserService currentUserService) : ISchoolHolidayService
{
    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    public async Task<List<SchoolHoliday>> GetForCurrentUserAsync()
    {
        var userId = GetCurrentUserId();
        var constraints = await constraintsService.GetAsync();
        var zones = constraints?.SchoolHolidayZones ?? [];

        // Fetch user-specific (ICS-imported) school holidays — single partition query.
        var userHolidays = await db.SchoolHolidays
            .Where(h => h.UserId == userId)
            .OrderBy(h => h.StartDate)
            .ToListAsync();

        if (zones.Count == 0)
            return userHolidays;

        // Fetch system school holidays for the user's selected zones.
        // This is a cross-partition query on the system partition.
        var systemHolidays = await db.SchoolHolidays
            .Where(h => h.UserId == SchoolHoliday.SystemUserId && zones.Contains(h.Zone))
            .OrderBy(h => h.StartDate)
            .ToListAsync();

        return [.. systemHolidays, .. userHolidays];
    }

    public async Task ImportIcsAsync(Stream icsContent)
    {
        var userId = GetCurrentUserId();

        var holidays = ParseIcs(icsContent);

        // Remove all existing user-imported school holidays for this user.
        var existing = await db.SchoolHolidays
            .Where(h => h.UserId == userId)
            .ToListAsync();

        db.SchoolHolidays.RemoveRange(existing);

        foreach (var holiday in holidays)
        {
            holiday.UserId = userId;
            db.SchoolHolidays.Add(holiday);
        }

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Minimal ICS parser that extracts VEVENT entries with DTSTART, DTEND and a SUMMARY.
    /// Handles RFC 5545 line folding (continuation lines starting with a space or tab).
    /// </summary>
    internal static List<SchoolHoliday> ParseIcs(Stream stream)
    {
        var holidays = new List<SchoolHoliday>();
        using var reader = new StreamReader(stream, leaveOpen: true);

        string? dtStart = null;
        string? dtEnd = null;
        string? summary = null;
        bool inEvent = false;

        // Buffer for the current logical line (handles RFC 5545 line folding).
        string? currentLogicalLine = null;

        string? rawLine;
        while ((rawLine = reader.ReadLine()) != null)
        {
            if (rawLine.Length > 0 && (rawLine[0] == ' ' || rawLine[0] == '\t'))
            {
                // Continuation of previous logical line (RFC 5545 line folding).
                currentLogicalLine = (currentLogicalLine ?? "") + rawLine[1..];
                continue;
            }

            // Process the previous complete logical line before starting a new one.
            if (currentLogicalLine != null)
            {
                ProcessIcsLine(currentLogicalLine, ref inEvent, ref dtStart, ref dtEnd, ref summary, holidays);
            }

            currentLogicalLine = rawLine.TrimEnd();
        }

        // Process the final logical line.
        if (currentLogicalLine != null)
        {
            ProcessIcsLine(currentLogicalLine, ref inEvent, ref dtStart, ref dtEnd, ref summary, holidays);
        }

        return holidays;
    }

    private static void ProcessIcsLine(
        string line,
        ref bool inEvent,
        ref string? dtStart,
        ref string? dtEnd,
        ref string? summary,
        List<SchoolHoliday> holidays)
    {
        if (line == "BEGIN:VEVENT")
        {
            inEvent = true;
            dtStart = null;
            dtEnd = null;
            summary = null;
            return;
        }

        if (line == "END:VEVENT")
        {
            inEvent = false;
            if (dtStart != null && summary != null && TryParseIcsDate(dtStart, out var startDate))
            {
                // EndDate falls back to StartDate if DTEND is absent (single-day event).
                DateOnly endDate = startDate;
                if (dtEnd != null && TryParseIcsDate(dtEnd, out var parsedEnd))
                    endDate = parsedEnd;

                holidays.Add(new SchoolHoliday
                {
                    Id = Guid.NewGuid().ToString(),
                    StartDate = startDate,
                    EndDate = endDate,
                    Name = UnescapeIcsText(summary),
                    Zone = string.Empty,
                });
            }
            return;
        }

        if (!inEvent) return;

        if (line.StartsWith("DTSTART", StringComparison.OrdinalIgnoreCase))
        {
            var colonIdx = line.IndexOf(':');
            if (colonIdx >= 0)
                dtStart = line[(colonIdx + 1)..].Trim();
        }
        else if (line.StartsWith("DTEND", StringComparison.OrdinalIgnoreCase))
        {
            var colonIdx = line.IndexOf(':');
            if (colonIdx >= 0)
                dtEnd = line[(colonIdx + 1)..].Trim();
        }
        else if (line.StartsWith("SUMMARY:", StringComparison.OrdinalIgnoreCase))
        {
            summary = line["SUMMARY:".Length..];
        }
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
        // Process \\ first to avoid double-processing escape sequences.
        text.Replace("\\\\", "\\").Replace("\\n", "\n").Replace("\\,", ",");
}
