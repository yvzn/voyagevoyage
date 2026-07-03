namespace VoyageVoyage.Server.Models;

public class UpdateFrequentExpenseRequest
{
    public required ExpenseCategory Category { get; set; }
    public required decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
}
