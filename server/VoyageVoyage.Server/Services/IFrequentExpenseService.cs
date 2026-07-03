using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public interface IFrequentExpenseService
{
    /// <summary>
    /// Get all frequent expense presets for the current user.
    /// </summary>
    Task<IEnumerable<FrequentExpense>> GetUserFrequentExpensesAsync(string userId);

    /// <summary>
    /// Create a new frequent expense preset for the current user.
    /// </summary>
    Task<FrequentExpense> CreateFrequentExpenseAsync(string userId, CreateFrequentExpenseRequest request);

    /// <summary>
    /// Update an existing frequent expense preset.
    /// </summary>
    Task<FrequentExpense> UpdateFrequentExpenseAsync(string userId, string id, UpdateFrequentExpenseRequest request);

    /// <summary>
    /// Delete a frequent expense preset.
    /// </summary>
    Task<bool> DeleteFrequentExpenseAsync(string userId, string id);
}
