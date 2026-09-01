namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the request body for creating a fiscal rule.
/// </summary>
public class CreateFiscalRuleRequest
{
    public required DateOnly StartDate { get; set; }
    public required DateOnly EndDate { get; set; }
    public required decimal MealAllowance { get; set; }
    public required decimal MealVoucherContribution { get; set; }
    public required decimal RemoteWorkAllowance { get; set; }
}
