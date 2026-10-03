namespace VoyageVoyage.Server.Models;

public record NoTravelDayRequest(
    DateOnly StartDate,
    DateOnly EndDate,
    bool IsRecurring,
    string Label
);
