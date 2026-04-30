using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents a professional trip entry.
/// This class is used both as the EF Core entity (persisted in Cosmos DB) and as the API response contract.
/// </summary>
public class Trip
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The identifier of the user who owns this trip.
    /// Used to scope trips to the authenticated user. Not exposed in the API response.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string Destination { get; set; } = string.Empty;

    public TripStatus Status { get; set; }
}
