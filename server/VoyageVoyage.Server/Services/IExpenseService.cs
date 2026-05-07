using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Provides CRUD operations for expense entries, scoped to a trip.
/// </summary>
public interface IExpenseService
{
    /// <summary>Returns all expenses for the given trip.</summary>
    Task<IReadOnlyList<Expense>> GetAllByTripAsync(string tripId);

    /// <summary>Returns a single expense by trip and expense id, or null if not found.</summary>
    Task<Expense?> GetByIdAsync(string tripId, string id);

    /// <summary>
    /// Creates and returns a new expense linked to the given trip.
    /// Returns null if the trip does not exist or does not belong to the current user.
    /// </summary>
    Task<Expense?> CreateAsync(string tripId, CreateExpenseRequest request);

    /// <summary>Deletes an expense. Returns true if the expense was found and deleted.</summary>
    Task<bool> DeleteAsync(string tripId, string id);
}
