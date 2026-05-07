namespace VoyageVoyage.Server.Models;

/// <summary>
/// Payload for updating an existing expense entry.
/// </summary>
public class UpdateExpenseRequest
{
    public DateOnly Date { get; set; }

    public ExpenseCategory Category { get; set; }

    public decimal Amount { get; set; }

    public string Description { get; set; } = string.Empty;
}
