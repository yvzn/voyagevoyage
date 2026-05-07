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

    /// <summary>Returns a single expense by its id alone (scoped to current user), or null if not found.</summary>
    Task<Expense?> GetByIdForUserAsync(string id);

    /// <summary>
    /// Creates and returns a new expense linked to the given trip.
    /// Returns null if the trip does not exist or does not belong to the current user.
    /// </summary>
    Task<Expense?> CreateAsync(string tripId, CreateExpenseRequest request);

    /// <summary>
    /// Updates an existing expense and returns it, or null if not found.
    /// The update is scoped to the current user.
    /// </summary>
    Task<Expense?> UpdateAsync(string id, UpdateExpenseRequest request);

    /// <summary>Deletes an expense. Returns true if the expense was found and deleted.</summary>
    Task<bool> DeleteAsync(string tripId, string id);

    /// <summary>Deletes an expense by its id alone (scoped to current user). Returns true if found and deleted.</summary>
    Task<bool> DeleteByIdForUserAsync(string id);
}
