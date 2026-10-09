using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

public class NoTravelDay
{
    public string Id { get; set; } = string.Empty;

    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public bool IsRecurring { get; set; }

    public string Label { get; set; } = string.Empty;
}
