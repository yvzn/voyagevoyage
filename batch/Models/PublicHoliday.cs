using System.Text.Json.Serialization;

namespace batch.Models;

/// <summary>
/// Represents a public holiday entry stored in Cosmos DB.
/// Mirrors <c>VoyageVoyage.Server.Models.PublicHoliday</c>.
/// </summary>
public class PublicHoliday
{
    /// <summary>Reserved user identifier for system-imported (batch) holidays.</summary>
    public const string SystemUserId = "system";

    public string Id { get; set; } = string.Empty;

    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Region { get; set; } = string.Empty;
}
