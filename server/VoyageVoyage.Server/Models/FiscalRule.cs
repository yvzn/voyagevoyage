using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the fiscal rule amounts applicable for a given date period.
/// Used to compute deductible expense amounts (meal, remote work) in compliance with yearly tax rules.
/// </summary>
public class FiscalRule
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The identifier of the user who owns this rule.
    /// Used to scope rules to the authenticated user. Not exposed in the API response.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// First day (inclusive) on which this rule applies.
    /// </summary>
    public DateOnly StartDate { get; set; }

    /// <summary>
    /// Last day (inclusive) on which this rule applies.
    /// </summary>
    public DateOnly EndDate { get; set; }

    /// <summary>
    /// Fiscal meal allowance, i.e. the maximum deductible amount for a meal expense.
    /// </summary>
    public decimal MealAllowance { get; set; }

    /// <summary>
    /// Face value of the meal voucher (titre-restaurant), in euros.
    /// </summary>
    public decimal MealVoucherFaceValue { get; set; }

    /// <summary>
    /// Percentage of the meal voucher face value subsidized by the employer (e.g. 60 for 60%).
    /// The amount deducted from the meal allowance is <see cref="MealVoucherFaceValue"/> multiplied by this percentage.
    /// </summary>
    public decimal MealVoucherEmployerContributionPercentage { get; set; }

    /// <summary>
    /// Daily remote work (télétravail) allowance.
    /// </summary>
    public decimal RemoteWorkAllowance { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Employer subsidy for the meal voucher, computed as the face value multiplied by the employer contribution percentage.
    /// </summary>
    public decimal EmployerMealVoucherSubsidy => MealVoucherFaceValue * MealVoucherEmployerContributionPercentage / 100m;

    /// <summary>
    /// Counts eligible telework days in the requested range.
    /// A day is eligible only if it is a working day and does not overlap a trip, leave period, or public holiday.
    /// </summary>
    public int CountRemoteWorkEligibleDays(
        DateOnly startDate,
        DateOnly endDate,
        IEnumerable<DateOnly>? tripDates = null,
        IEnumerable<DateOnly>? leaveDates = null,
        IEnumerable<DateOnly>? publicHolidayDates = null)
    {
        if (endDate < startDate)
        {
            return 0;
        }

        var tripSet = tripDates is null ? new HashSet<DateOnly>() : new HashSet<DateOnly>(tripDates);
        var leaveSet = leaveDates is null ? new HashSet<DateOnly>() : new HashSet<DateOnly>(leaveDates);
        var holidaySet = publicHolidayDates is null ? new HashSet<DateOnly>() : new HashSet<DateOnly>(publicHolidayDates);

        var eligibleDays = 0;
        for (var current = startDate; current <= endDate; current = current.AddDays(1))
        {
            if (current.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            {
                continue;
            }

            if (tripSet.Contains(current) || leaveSet.Contains(current) || holidaySet.Contains(current))
            {
                continue;
            }

            eligibleDays++;
        }

        return eligibleDays;
    }

    /// <summary>
    /// Counts eligible telework days using trip, leave, and holiday entities instead of raw dates.
    /// </summary>
    public int CountRemoteWorkEligibleDays(
        DateOnly startDate,
        DateOnly endDate,
        IEnumerable<Trip>? trips = null,
        IEnumerable<PersonalLeave>? leaves = null,
        IEnumerable<PublicHoliday>? holidays = null)
    {
        var tripDates = trips is null
            ? []
            : trips.SelectMany(trip => EnumerateDates(trip.StartDate, trip.EndDate));

        var leaveDates = leaves is null
            ? []
            : leaves.SelectMany(leave => EnumerateDates(leave.StartDate, leave.EndDate));

        var holidayDates = holidays is null
            ? []
            : holidays.Select(holiday => holiday.Date);

        return CountRemoteWorkEligibleDays(startDate, endDate, tripDates, leaveDates, holidayDates);
    }

    /// <summary>
    /// Computes the remote work allowance for the number of eligible telework days.
    /// </summary>
    public decimal CalculateRemoteWorkAllowance(int eligibleDays) => eligibleDays * RemoteWorkAllowance;

    /// <summary>
    /// Computes the remote work allowance for a date range, excluding trips, leave, public holidays, and weekends.
    /// </summary>
    public decimal CalculateRemoteWorkAllowance(
        DateOnly startDate,
        DateOnly endDate,
        IEnumerable<DateOnly>? tripDates = null,
        IEnumerable<DateOnly>? leaveDates = null,
        IEnumerable<DateOnly>? publicHolidayDates = null)
    {
        var eligibleDays = CountRemoteWorkEligibleDays(startDate, endDate, tripDates, leaveDates, publicHolidayDates);
        return CalculateRemoteWorkAllowance(eligibleDays);
    }

    /// <summary>
    /// Computes the remote work allowance for a date range using trip, leave, and holiday entities.
    /// </summary>
    public decimal CalculateRemoteWorkAllowance(
        DateOnly startDate,
        DateOnly endDate,
        IEnumerable<Trip>? trips = null,
        IEnumerable<PersonalLeave>? leaves = null,
        IEnumerable<PublicHoliday>? holidays = null)
    {
        var eligibleDays = CountRemoteWorkEligibleDays(startDate, endDate, trips, leaves, holidays);
        return CalculateRemoteWorkAllowance(eligibleDays);
    }

    /// <summary>
    /// Alias for the remote work deduction calculation.
    /// </summary>
    public decimal CalculateRemoteWorkDeductible(
        DateOnly startDate,
        DateOnly endDate,
        IEnumerable<DateOnly>? tripDates = null,
        IEnumerable<DateOnly>? leaveDates = null,
        IEnumerable<DateOnly>? publicHolidayDates = null)
        => CalculateRemoteWorkAllowance(startDate, endDate, tripDates, leaveDates, publicHolidayDates);

    /// <summary>
    /// Net deductible amount for a meal expense, calculated as:
    /// meal amount - fiscal meal allowance - employer meal voucher subsidy.
    /// </summary>
    public decimal CalculateMealNetDeductible(decimal mealAmount)
    {
        var netDeductible = mealAmount - MealAllowance - EmployerMealVoucherSubsidy;
        return Math.Max(0m, netDeductible);
    }

    /// <summary>
    /// Backward-compatible alias for the net deductible calculation.
    /// </summary>
    public decimal GetNetDeductible(decimal mealAmount) => CalculateMealNetDeductible(mealAmount);

    /// <summary>
    /// Backward-compatible alias for the employer subsidy calculation.
    /// </summary>
    public decimal GetEmployerMealVoucherSubsidy() => EmployerMealVoucherSubsidy;

    /// <summary>
    /// Backward-compatible aliases for the remote work rule.
    /// </summary>
    public int GetRemoteWorkEligibleDays(DateOnly startDate, DateOnly endDate, IEnumerable<DateOnly>? tripDates = null, IEnumerable<DateOnly>? leaveDates = null, IEnumerable<DateOnly>? publicHolidayDates = null)
        => CountRemoteWorkEligibleDays(startDate, endDate, tripDates, leaveDates, publicHolidayDates);

    public decimal GetRemoteWorkAllowance(int eligibleDays) => CalculateRemoteWorkAllowance(eligibleDays);

    public decimal GetRemoteWorkDeductible(DateOnly startDate, DateOnly endDate, IEnumerable<DateOnly>? tripDates = null, IEnumerable<DateOnly>? leaveDates = null, IEnumerable<DateOnly>? publicHolidayDates = null)
        => CalculateRemoteWorkDeductible(startDate, endDate, tripDates, leaveDates, publicHolidayDates);

    private static IEnumerable<DateOnly> EnumerateDates(DateOnly start, DateOnly end)
    {
        for (var current = start; current <= end; current = current.AddDays(1))
        {
            yield return current;
        }
    }
}
