namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the request body for updating a fiscal rule.
/// </summary>
public class UpdateFiscalRuleRequest
{
    public required DateOnly StartDate { get; set; }
    public required DateOnly EndDate { get; set; }
    public required decimal MealAllowance { get; set; }
    public required decimal MealVoucherFaceValue { get; set; }
    public required decimal MealVoucherEmployerContributionPercentage { get; set; }
    public required decimal RemoteWorkAllowance { get; set; }
}
