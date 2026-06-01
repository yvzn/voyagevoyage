namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents hotel booking details for a trip.
/// Stored as a nested object within the Trip document in Cosmos DB.
/// </summary>
public class HotelBooking
{
    /// <summary>
    /// Date when accommodation is booked.
    /// </summary>
    public DateOnly BookingDate { get; set; }

    /// <summary>
    /// Hotel name.
    /// </summary>
    public string HotelName { get; set; } = string.Empty;

    /// <summary>
    /// Hotel address.
    /// </summary>
    public string HotelAddress { get; set; } = string.Empty;
}
