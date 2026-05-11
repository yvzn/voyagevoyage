using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents a professional expense entry linked to a trip.
/// This class is used both as the EF Core entity (persisted in Cosmos DB) and as the API response contract.
/// </summary>
public class Expense
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The identifier of the user who owns this expense.
    /// Used to scope expenses to the authenticated user. Not exposed in the API response.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public string TripId { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public ExpenseCategory Category { get; set; }

    public decimal Amount { get; set; }

    public string Description { get; set; } = string.Empty;
}
