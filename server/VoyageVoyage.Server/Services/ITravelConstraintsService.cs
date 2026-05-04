using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Provides read and write access to a user's travel constraint settings.
/// </summary>
public interface ITravelConstraintsService
{
    /// <summary>
    /// Returns the travel constraints for the current user,
    /// or null if no constraints have been configured yet.
    /// </summary>
    Task<TravelConstraints?> GetAsync();

    /// <summary>
    /// Creates or replaces the travel constraints for the current user.
    /// </summary>
    Task<TravelConstraints> UpsertAsync(UpdateTravelConstraintsRequest request);
}
