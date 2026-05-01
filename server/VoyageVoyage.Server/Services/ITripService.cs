using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Provides CRUD operations for trip entries.
/// </summary>
public interface ITripService
{
    /// <summary>Returns all trips.</summary>
    Task<IReadOnlyList<Trip>> GetAllAsync();

    /// <summary>Returns a trip by its identifier, or null if not found.</summary>
    Task<Trip?> GetByIdAsync(string id);

    /// <summary>Creates and returns a new trip.</summary>
    Task<Trip> CreateAsync(CreateTripRequest request);

    /// <summary>Updates an existing trip and returns it, or null if not found.</summary>
    Task<Trip?> UpdateAsync(string id, UpdateTripRequest request);

    /// <summary>Deletes a trip. Returns true if the trip was found and deleted.</summary>
    Task<bool> DeleteAsync(string id);
}
