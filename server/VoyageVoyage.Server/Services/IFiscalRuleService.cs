using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public interface IFiscalRuleService
{
    /// <summary>
    /// Get all fiscal rules for the given user, ordered by start date descending.
    /// </summary>
    Task<IEnumerable<FiscalRule>> GetUserFiscalRulesAsync(string userId);

    /// <summary>
    /// Create a new fiscal rule for the given user.
    /// </summary>
    Task<FiscalRule> CreateFiscalRuleAsync(string userId, CreateFiscalRuleRequest request);

    /// <summary>
    /// Update an existing fiscal rule.
    /// </summary>
    Task<FiscalRule> UpdateFiscalRuleAsync(string userId, string id, UpdateFiscalRuleRequest request);

    /// <summary>
    /// Delete a fiscal rule.
    /// </summary>
    Task<bool> DeleteFiscalRuleAsync(string userId, string id);
}
