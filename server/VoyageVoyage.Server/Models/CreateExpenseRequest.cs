namespace VoyageVoyage.Server.Models;

/// <summary>
/// Payload for creating a new expense entry.
/// </summary>
public class CreateExpenseRequest
{
    public DateOnly Date { get; set; }

    public ExpenseCategory Category { get; set; }

    public decimal Amount { get; set; }

    public string Description { get; set; } = string.Empty;
}
