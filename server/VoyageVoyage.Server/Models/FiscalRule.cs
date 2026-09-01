using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the fiscal rule amounts applicable for a given date period.
/// Used to compute deductible expense amounts (meal, remote work) in compliance with yearly tax rules.
/// </summary>
public class FiscalRule
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The identifier of the user who owns this rule.
    /// Used to scope rules to the authenticated user. Not exposed in the API response.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// First day (inclusive) on which this rule applies.
    /// </summary>
    public DateOnly StartDate { get; set; }

    /// <summary>
    /// Last day (inclusive) on which this rule applies.
    /// </summary>
    public DateOnly EndDate { get; set; }

    /// <summary>
    /// Fiscal meal allowance, i.e. the maximum deductible amount for a meal expense.
    /// </summary>
    public decimal MealAllowance { get; set; }

    /// <summary>
    /// Employer's meal voucher (titre-restaurant) contribution amount, deducted from the meal allowance.
    /// </summary>
    public decimal MealVoucherContribution { get; set; }

    /// <summary>
    /// Daily remote work (télétravail) allowance.
    /// </summary>
    public decimal RemoteWorkAllowance { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
