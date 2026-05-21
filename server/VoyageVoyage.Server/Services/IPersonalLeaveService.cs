using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Provides CRUD access to personal leave periods for the current user.
/// </summary>
public interface IPersonalLeaveService
{
    /// <summary>Returns all personal leave periods for the current user, ordered by start date.</summary>
    Task<List<PersonalLeave>> GetForCurrentUserAsync();

    /// <summary>Creates a new personal leave period for the current user.</summary>
    Task<PersonalLeave> CreateAsync(CreatePersonalLeaveRequest request);

    /// <summary>
    /// Updates an existing personal leave period.
    /// Returns null when the leave does not exist or does not belong to the current user.
    /// </summary>
    Task<PersonalLeave?> UpdateAsync(string id, UpdatePersonalLeaveRequest request);

    /// <summary>
    /// Deletes a personal leave period.
    /// Returns false when the leave does not exist or does not belong to the current user.
    /// </summary>
    Task<bool> DeleteAsync(string id);

    /// <summary>
    /// Imports personal leave periods from an ICS file for the current user.
    /// All existing leave periods for the user are replaced.
    /// </summary>
    Task ImportIcsAsync(Stream icsContent);
}
