using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents a personal leave period for a user.
/// Used to block travel planning during the leave period.
/// </summary>
public class PersonalLeave
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The identifier of the user who owns this leave period.
    /// Used as the Cosmos DB partition key. Not exposed in the API response.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    /// <summary>Start date of the leave period (inclusive).</summary>
    public DateOnly StartDate { get; set; }

    /// <summary>End date of the leave period (inclusive).</summary>
    public DateOnly EndDate { get; set; }

    /// <summary>Type of leave (annual, sick, or other).</summary>
    public LeaveType Type { get; set; } = LeaveType.Annual;

    /// <summary>Optional free-text label for the leave period.</summary>
    public string Label { get; set; } = string.Empty;
}
