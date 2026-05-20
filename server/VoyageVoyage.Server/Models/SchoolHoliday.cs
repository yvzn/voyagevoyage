using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents a school holiday period.
/// System-imported holidays use <see cref="SystemUserId"/> as the owner.
/// User-imported holidays (via ICS) use the real user identifier.
/// </summary>
public class SchoolHoliday
{
    /// <summary>
    /// Reserved user identifier for system-imported (batch) school holidays.
    /// These are shared across all users and filtered by zone.
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

    /// <summary>Start date of the school holiday period.</summary>
    public DateOnly StartDate { get; set; }

    /// <summary>End date of the school holiday period (inclusive).</summary>
    public DateOnly EndDate { get; set; }

    /// <summary>Display name of the holiday period (e.g. "Vacances de Toussaint").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// School zone identifier (e.g. "Zone A", "Zone B", "Zone C").
    /// Empty for user-imported ICS entries.
    /// </summary>
    public string Zone { get; set; } = string.Empty;
}
