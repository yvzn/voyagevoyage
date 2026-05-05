namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the request body for creating or updating travel constraints.
/// </summary>
/// <param name="AllowedDaysOfWeek">
/// Days of the week on which travel is allowed, as integers (0 = Sunday … 6 = Saturday).
/// An empty list means all days are allowed.
/// </param>
public record UpdateTravelConstraintsRequest(
    List<int> AllowedDaysOfWeek,
    int? MaxDaysPerMonth,
    bool ConsiderPublicHolidays,
    bool ConsiderVacationDays,
    bool IsStrict
);
