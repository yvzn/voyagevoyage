namespace VoyageVoyage.Server.Models;

public class CreateFrequentExpenseRequest
{
    public required ExpenseCategory Category { get; set; }
    public required decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
}
