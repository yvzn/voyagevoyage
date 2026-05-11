using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages travel constraint settings for the authenticated user.
/// </summary>
[Authorize]
[ApiController]
[Route("api/travel-constraints")]
public class TravelConstraintsController(ITravelConstraintsService constraintsService) : ControllerBase
{
    /// <summary>Returns the travel constraints for the current user.</summary>
    [HttpGet]
    public async Task<ActionResult<TravelConstraints>> Get()
    {
        var constraints = await constraintsService.GetAsync();
        if (constraints is null)
            return NoContent();

        return Ok(constraints);
    }

    /// <summary>Creates or replaces the travel constraints for the current user.</summary>
    [HttpPut]
    public async Task<ActionResult<TravelConstraints>> Upsert([FromBody] UpdateTravelConstraintsRequest request)
    {
        if (request.PlanningHorizonDays is < 1 or > 365)
        {
            ModelState.AddModelError(nameof(request.PlanningHorizonDays), "validation.planningHorizonDaysOutOfRange");
            return ValidationProblem(ModelState);
        }

        var constraints = await constraintsService.UpsertAsync(request);
        return Ok(constraints);
    }
}
