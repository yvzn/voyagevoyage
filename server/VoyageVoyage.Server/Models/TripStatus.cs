using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the status of a trip.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<TripStatus>))]
public enum TripStatus
{
    Planned,
    Confirmed,
    Cancelled,
}
