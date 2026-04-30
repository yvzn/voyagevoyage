namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the request body for updating an existing trip.
/// </summary>
public record UpdateTripRequest(
    DateOnly StartDate,
    DateOnly EndDate,
    string Destination,
    TripStatus Status
);
