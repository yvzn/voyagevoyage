namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the request body for creating a new trip.
/// </summary>
public record CreateTripRequest(
    DateOnly StartDate,
    DateOnly EndDate,
    string Destination,
    TripStatus Status
);
