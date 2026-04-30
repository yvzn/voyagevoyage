namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents a professional trip entry.
/// </summary>
public record Trip(
    string Id,
    DateOnly StartDate,
    DateOnly EndDate,
    string Destination,
    TripStatus Status
);
