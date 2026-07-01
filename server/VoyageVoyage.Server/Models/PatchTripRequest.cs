namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the request body for patching an existing trip.
/// Only TrainBooking and HotelBooking can be updated; other fields are immutable.
/// Null values are interpreted as "leave field unchanged" (merge semantics), not "clear field".
/// This endpoint cannot clear a booking; use PUT (full update) for that.
/// </summary>
public record PatchTripRequest(
    TrainBooking? TrainBooking = null,
    HotelBooking? HotelBooking = null
);
