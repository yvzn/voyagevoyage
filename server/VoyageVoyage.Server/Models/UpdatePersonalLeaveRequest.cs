namespace VoyageVoyage.Server.Models;

/// <summary>
/// Request body for updating an existing personal leave period.
/// </summary>
public class UpdatePersonalLeaveRequest
{
    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public LeaveType Type { get; set; } = LeaveType.Annual;

    public string Label { get; set; } = string.Empty;
}
