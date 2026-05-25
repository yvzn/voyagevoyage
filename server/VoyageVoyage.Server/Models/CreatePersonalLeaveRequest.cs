namespace VoyageVoyage.Server.Models;

/// <summary>
/// Request body for creating a new personal leave period.
/// </summary>
public class CreatePersonalLeaveRequest
{
    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public LeaveType Type { get; set; } = LeaveType.Annual;

    public string Label { get; set; } = string.Empty;
}
