using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// PostgreSQL implementation of <see cref="IPersonalLeaveService"/>.
/// All operations are scoped to the authenticated user.
/// </summary>
public class PersonalLeaveService(
    ApplicationDbContext db,
    ICurrentUserService currentUserService) : IPersonalLeaveService
{
    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    public async Task<List<PersonalLeave>> GetForCurrentUserAsync()
    {
        var userId = GetCurrentUserId();
        return await db.PersonalLeaves
            .Where(l => l.UserId == userId)
            .OrderBy(l => l.StartDate)
            .ToListAsync();
    }

    public async Task<PersonalLeave> CreateAsync(CreatePersonalLeaveRequest request)
    {
        var userId = GetCurrentUserId();

        var leave = new PersonalLeave
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Type = request.Type,
            Label = request.Label,
        };

        db.PersonalLeaves.Add(leave);
        await db.SaveChangesAsync();
        return leave;
    }

    public async Task<PersonalLeave?> UpdateAsync(string id, UpdatePersonalLeaveRequest request)
    {
        var userId = GetCurrentUserId();
        var leave = await db.PersonalLeaves
            .Where(l => l.Id == id && l.UserId == userId)
            .FirstOrDefaultAsync();

        if (leave is null)
            return null;

        leave.StartDate = request.StartDate;
        leave.EndDate = request.EndDate;
        leave.Type = request.Type;
        leave.Label = request.Label;
        await db.SaveChangesAsync();
        return leave;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var userId = GetCurrentUserId();
        var leave = await db.PersonalLeaves
            .Where(l => l.Id == id && l.UserId == userId)
            .FirstOrDefaultAsync();

        if (leave is null)
            return false;

        db.PersonalLeaves.Remove(leave);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task ImportIcsAsync(Stream icsContent)
    {
        var userId = GetCurrentUserId();

        var leaves = ParseIcs(icsContent);

        // Replace all existing leave periods for this user.
        var existing = await db.PersonalLeaves
            .Where(l => l.UserId == userId)
            .ToListAsync();

        db.PersonalLeaves.RemoveRange(existing);

        foreach (var leave in leaves)
        {
            leave.UserId = userId;
            db.PersonalLeaves.Add(leave);
        }

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Minimal ICS parser that extracts VEVENT entries with DTSTART, DTEND and a SUMMARY.
    /// Handles RFC 5545 line folding (continuation lines starting with a space or tab).
    /// </summary>
    internal static List<PersonalLeave> ParseIcs(Stream stream)
    {
        var leaves = new List<PersonalLeave>();
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
                ProcessIcsLine(currentLogicalLine, ref inEvent, ref dtStart, ref dtEnd, ref summary, leaves);
            }

            currentLogicalLine = rawLine.TrimEnd();
        }

        // Process the final logical line.
        if (currentLogicalLine != null)
        {
            ProcessIcsLine(currentLogicalLine, ref inEvent, ref dtStart, ref dtEnd, ref summary, leaves);
        }

        return leaves;
    }

    private static void ProcessIcsLine(
        string line,
        ref bool inEvent,
        ref string? dtStart,
        ref string? dtEnd,
        ref string? summary,
        List<PersonalLeave> leaves)
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
            if (dtStart != null && TryParseIcsDate(dtStart, out var startDate))
            {
                // EndDate falls back to StartDate if DTEND is absent (single-day event).
                DateOnly endDate = startDate;
                if (dtEnd != null && TryParseIcsDate(dtEnd, out var parsedEnd))
                    endDate = parsedEnd;

                leaves.Add(new PersonalLeave
                {
                    Id = Guid.NewGuid().ToString(),
                    StartDate = startDate,
                    EndDate = endDate,
                    Type = LeaveType.Other,
                    Label = summary is not null ? UnescapeIcsText(summary) : string.Empty,
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
