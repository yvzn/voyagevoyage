using System.Text.Json.Serialization;

namespace batch.Models;

/// <summary>
/// Represents a school holiday period stored in Cosmos DB.
/// Mirrors <c>VoyageVoyage.Server.Models.SchoolHoliday</c>.
/// </summary>
public class SchoolHoliday
{
    /// <summary>Reserved user identifier for system-imported (batch) school holidays.</summary>
    public const string SystemUserId = "system";

    public string Id { get; set; } = string.Empty;

    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>School zone identifier (e.g. "Zone A", "Zone B", "Zone C").</summary>
    public string Zone { get; set; } = string.Empty;
}
