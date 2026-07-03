using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents a frequently-used expense template that a user can quickly apply to trips.
/// This class is used both as the EF Core entity (persisted in Cosmos DB) and as the API response contract.
/// </summary>
public class FrequentExpense
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The identifier of the user who owns this preset.
    /// Used to scope presets to the authenticated user. Not exposed in the API response.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public ExpenseCategory Category { get; set; }

    public decimal Amount { get; set; }

    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
