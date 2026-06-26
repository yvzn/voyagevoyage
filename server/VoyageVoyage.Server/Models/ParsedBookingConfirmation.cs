namespace VoyageVoyage.Server.Models;

/// <summary>
/// Transient result of parsing a booking confirmation file.
/// Not persisted — returned to the frontend for user review before saving.
/// </summary>
public class ParsedBookingConfirmation
{
    public BookingConfirmationType DetectedType { get; set; }
    public string? ProviderName { get; set; }
    public string? Reference { get; set; }

    // Train fields
    public string? Departure { get; set; }
    public string? Arrival { get; set; }
    public DateTimeOffset? DepartureDateTime { get; set; }
    public DateTimeOffset? ReturnDateTime { get; set; }

    // Hotel fields
    public string? HotelName { get; set; }
    public string? HotelAddress { get; set; }
    public DateOnly? CheckInDate { get; set; }
    public DateOnly? CheckOutDate { get; set; }

    // Common
    public decimal? Price { get; set; }

    /// <summary>Used by the frontend to auto-match or create a trip.</summary>
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
