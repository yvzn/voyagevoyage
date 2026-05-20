using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Provides access to school holidays for the current user.
/// </summary>
public interface ISchoolHolidayService
{
    /// <summary>
    /// Returns all school holidays visible to the current user:
    /// system-imported periods for the user's configured zones, plus user-imported (ICS) periods.
    /// </summary>
    Task<List<SchoolHoliday>> GetForCurrentUserAsync();

    /// <summary>
    /// Imports school holidays from an ICS file for the current user.
    /// Existing user-imported school holidays are replaced.
    /// </summary>
    Task ImportIcsAsync(Stream icsContent);
}
