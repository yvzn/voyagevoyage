using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents a public holiday entry.
/// System-imported holidays use <see cref="SystemUserId"/> as the owner.
/// User-imported holidays (via ICS) use the real user identifier.
/// </summary>
public class PublicHoliday
{
    /// <summary>
    /// Reserved user identifier for system-imported (batch) holidays.
    /// These are shared across all users and filtered by region.
    /// </summary>
    public const string SystemUserId = "system";

    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The identifier of the owner: <see cref="SystemUserId"/> for batch imports,
    /// or the real user identifier for ICS imports.
    /// Used as the Cosmos DB partition key.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    /// <summary>Date of the public holiday.</summary>
    public DateOnly Date { get; set; }

    /// <summary>Display name of the holiday (e.g. "Jour de l'An").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Region identifier for the holiday (e.g. "france-metropole").
    /// Empty for user-imported ICS entries.
    /// </summary>
    public string Region { get; set; } = string.Empty;
}
