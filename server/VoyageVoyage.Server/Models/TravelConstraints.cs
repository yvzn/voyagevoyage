using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents the travel constraint settings for a user.
/// Stored as a singleton per user (one document per user in Cosmos DB).
/// </summary>
public class TravelConstraints
{
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
    /// When true, constraints are strict (mandatory).
    /// When false, constraints are flexible (derogations allowed).
    /// </summary>
    public bool IsStrict { get; set; }
}
