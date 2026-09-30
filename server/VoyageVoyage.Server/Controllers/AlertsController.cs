using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

[Authorize]
[ApiController]
[Route("api/alerts")]
public class AlertsController(IAnomalyDetectionService anomalyDetectionService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AnomalyAlert>>> GetAll([FromQuery] AlertStatus? status = null)
    {
        var alerts = await anomalyDetectionService.GetAlertsAsync(status);
        return Ok(alerts);
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<AnomalyAlert>> UpdateStatus(string id, [FromBody] UpdateAlertStatusRequest request)
    {
        var alert = await anomalyDetectionService.UpdateAlertStatusAsync(id, request.Status);
        if (alert is null)
            return NotFound();

        return Ok(alert);
    }
}
