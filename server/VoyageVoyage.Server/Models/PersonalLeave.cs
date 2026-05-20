using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents a personal leave period for a user.
/// User-imported leaves (via ICS) use the real user identifier.
/// </summary>
public class PersonalLeave
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The identifier of the owner (the authenticated user).
    /// Used as the Cosmos DB partition key.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    /// <summary>Start date of the personal leave period.</summary>
    public DateOnly StartDate { get; set; }

    /// <summary>End date of the personal leave period (inclusive).</summary>
    public DateOnly EndDate { get; set; }

    /// <summary>Display name of the leave (e.g. "Congés annuels").</summary>
    public string Name { get; set; } = string.Empty;
}
