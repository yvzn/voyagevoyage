using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Provides access to personal leaves for the current user.
/// </summary>
public interface IPersonalLeaveService
{
    /// <summary>
    /// Returns all personal leaves for the current user.
    /// </summary>
    Task<List<PersonalLeave>> GetForCurrentUserAsync();

    /// <summary>
    /// Imports personal leaves from an ICS file for the current user.
    /// Existing personal leaves are replaced.
    /// </summary>
    Task ImportIcsAsync(Stream icsContent);
}
