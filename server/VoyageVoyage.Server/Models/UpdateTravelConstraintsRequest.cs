namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the request body for creating or updating travel constraints.
/// </summary>
public record UpdateTravelConstraintsRequest(
    List<DayOfWeek> AllowedDaysOfWeek,
    int? MaxDaysPerMonth,
    bool ConsiderPublicHolidays,
    bool ConsiderVacationDays,
    bool IsStrict
);
