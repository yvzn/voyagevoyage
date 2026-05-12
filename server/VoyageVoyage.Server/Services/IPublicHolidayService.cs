using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Provides access to public holidays for the current user.
/// </summary>
public interface IPublicHolidayService
{
    /// <summary>
    /// Returns all public holidays visible to the current user:
    /// system-imported holidays for the user's configured regions, plus user-imported (ICS) holidays.
    /// </summary>
    Task<List<PublicHoliday>> GetForCurrentUserAsync();

    /// <summary>
    /// Imports public holidays from an ICS file for the current user.
    /// Existing user-imported holidays are replaced.
    /// </summary>
    Task ImportIcsAsync(Stream icsContent);
}
