namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the train booking details for a trip.
/// Stored as a nested object within the Trip document in Cosmos DB.
/// </summary>
public class TrainBooking
{
    /// <summary>
    /// Departure city or station name.
    /// </summary>
    public string Departure { get; set; } = string.Empty;

    /// <summary>
    /// Arrival city or station name.
    /// </summary>
    public string Arrival { get; set; } = string.Empty;

    /// <summary>
    /// Departure date and time (ISO 8601). Null if not yet specified.
    /// </summary>
    public DateTime? DepartureDateTime { get; set; }
}
