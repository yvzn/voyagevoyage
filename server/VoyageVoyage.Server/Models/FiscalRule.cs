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
    /// Face value of the meal voucher (titre-restaurant), in euros.
    /// </summary>
    public decimal MealVoucherFaceValue { get; set; }

    /// <summary>
    /// Percentage of the meal voucher face value subsidized by the employer (e.g. 60 for 60%).
    /// The amount deducted from the meal allowance is <see cref="MealVoucherFaceValue"/> multiplied by this percentage.
    /// </summary>
    public decimal MealVoucherEmployerContributionPercentage { get; set; }

    /// <summary>
    /// Daily remote work (télétravail) allowance.
    /// </summary>
    public decimal RemoteWorkAllowance { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Employer subsidy for the meal voucher, computed as the face value multiplied by the employer contribution percentage.
    /// </summary>
    public decimal EmployerMealVoucherSubsidy => MealVoucherFaceValue * MealVoucherEmployerContributionPercentage / 100m;

    /// <summary>
    /// Net deductible amount for a meal expense, calculated as:
    /// meal amount - fiscal meal allowance - employer meal voucher subsidy.
    /// </summary>
    public decimal CalculateMealNetDeductible(decimal mealAmount)
    {
        var netDeductible = mealAmount - MealAllowance - EmployerMealVoucherSubsidy;
        return Math.Max(0m, netDeductible);
    }

    /// <summary>
    /// Backward-compatible alias for the net deductible calculation.
    /// </summary>
    public decimal GetNetDeductible(decimal mealAmount) => CalculateMealNetDeductible(mealAmount);

    /// <summary>
    /// Backward-compatible alias for the employer subsidy calculation.
    /// </summary>
    public decimal GetEmployerMealVoucherSubsidy() => EmployerMealVoucherSubsidy;
}
