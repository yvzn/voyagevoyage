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
    bool IsStrict,
    int PlanningHorizonDays,
    List<string> PublicHolidayRegions,
    List<string> SchoolHolidayZones,
    int TrainBookingThresholdDays = 90,
    int A1MaxPastTripAgeDays = TravelConstraints.DefaultA1MaxPastTripAgeDays,
    int A2MinCompletionDelayDays = TravelConstraints.DefaultA2MinCompletionDelayDays,
    decimal XAtypicalExpenseThresholdPercent = TravelConstraints.DefaultAtypicalExpenseThresholdPercent,
    bool ConsiderNoTravelDays = false
);
