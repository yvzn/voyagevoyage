using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the travel constraint settings for a user.
/// Stored as a singleton per user (one document per user in Cosmos DB).
/// </summary>
public class TravelConstraints
{
    public const int DefaultA1MaxPastTripAgeDays = 365;
    public const int DefaultA2MinCompletionDelayDays = 30;
    public const decimal DefaultAtypicalExpenseThresholdPercent = 100m;
    public const int DefaultExpectedExpenseHistoryTripCount = 10;
    public const int DefaultExpectedExpenseMinimumSampleSize = 3;
    public const decimal DefaultExpectedExpenseHabitThresholdPercent = 60m;
    public const int DefaultExpectedExpenseDestinationMinimumCount = 3;

    /// <summary>
    /// Fixed document identifier within the user's partition.
    /// Each user has at most one constraints document.
    /// </summary>
    public const string DocumentId = "travel-constraints";

    public string Id { get; set; } = DocumentId;

    /// <summary>
    /// The identifier of the user who owns these constraints.
    /// Used as the Cosmos DB partition key. Not exposed in the API response.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Days of the week on which travel is allowed, stored as integers (0 = Sunday … 6 = Saturday).
    /// An empty list means all days are allowed.
    /// </summary>
    /// <remarks>
    /// Stored as <see cref="int"/> rather than <see cref="DayOfWeek"/> because the EF Core
    /// Cosmos DB provider does not support value converters on collection element types.
    /// </remarks>
    public List<int> AllowedDaysOfWeek { get; set; } = [];

    /// <summary>
    /// Maximum number of travel days allowed per calendar month.
    /// Null means no limit.
    /// </summary>
    public int? MaxDaysPerMonth { get; set; }

    /// <summary>
    /// When true, public holidays are excluded from allowed travel days.
    /// </summary>
    public bool ConsiderPublicHolidays { get; set; }

    /// <summary>
    /// When true, personal vacation/leave days are excluded from allowed travel days.
    /// </summary>
    public bool ConsiderVacationDays { get; set; }

    /// <summary>
    /// When true, no-travel days are excluded from allowed travel days.
    /// </summary>
    public bool ConsiderNoTravelDays { get; set; }

    /// <summary>
    /// When true, constraints are strict (mandatory).
    /// When false, constraints are flexible (derogations allowed).
    /// </summary>
    public bool IsStrict { get; set; }

    /// <summary>
    /// Number of days ahead for which planning suggestions should be generated.
    /// </summary>
    public int PlanningHorizonDays { get; set; } = 90;

    /// <summary>
    /// Number of days before the trip departure within which the train booking reminder is shown.
    /// Defaults to 90 days (SNCF booking window).
    /// </summary>
    public int TrainBookingThresholdDays { get; set; } = 90;

    /// <summary>
    /// A1 — maximum age in days for past trips to be analyzed.
    /// Trips ending more than A1 days ago are discarded from analysis.
    /// </summary>
    public int A1MaxPastTripAgeDays { get; set; } = DefaultA1MaxPastTripAgeDays;

    /// <summary>
    /// A2 — minimum completion delay in days before a past trip is analyzed.
    /// The trip must be at least A2 days after its end date to be analyzed.
    /// </summary>
    public int A2MinCompletionDelayDays { get; set; } = DefaultA2MinCompletionDelayDays;

    /// <summary>
    /// X — threshold above the category average, expressed as a percentage, beyond which a receipt is considered atypical.
    /// Example: 100 means the receipt exceeds the category mean by 100% or more.
    /// </summary>
    public decimal XAtypicalExpenseThresholdPercent { get; set; } = DefaultAtypicalExpenseThresholdPercent;

    /// <summary>Maximum number of recent trips used to learn expected expenses.</summary>
    public int ExpectedExpenseHistoryTripCount { get; set; } = DefaultExpectedExpenseHistoryTripCount;

    /// <summary>Minimum number of eligible trips required before historical habits are used.</summary>
    public int ExpectedExpenseMinimumSampleSize { get; set; } = DefaultExpectedExpenseMinimumSampleSize;

    /// <summary>Minimum share of trips in which an expense type must occur to be expected.</summary>
    public decimal ExpectedExpenseHabitThresholdPercent { get; set; } = DefaultExpectedExpenseHabitThresholdPercent;

    /// <summary>Minimum number of matching-destination trips required to filter the history corpus.</summary>
    public int ExpectedExpenseDestinationMinimumCount { get; set; } = DefaultExpectedExpenseDestinationMinimumCount;

    /// <summary>
    /// Public holiday region identifiers selected by the user (e.g. "france-metropole").
    /// Holidays for these regions will be fetched and displayed in the user's calendar.
    /// </summary>
    public List<string> PublicHolidayRegions { get; set; } = [];

    /// <summary>
    /// School holiday zone identifiers selected by the user (e.g. "Zone A", "Zone B", "Zone C").
    /// School holiday periods for these zones will be fetched and displayed in the user's calendar.
    /// </summary>
    public List<string> SchoolHolidayZones { get; set; } = [];
}
