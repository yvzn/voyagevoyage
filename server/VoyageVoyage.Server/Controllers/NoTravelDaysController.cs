using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

[Authorize]
[ApiController]
[Route("api/no-travel-days")]
public class NoTravelDaysController(INoTravelDayService noTravelDayService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NoTravelDay>>> GetAll() =>
        Ok(await noTravelDayService.GetForCurrentUserAsync());

    [HttpPost]
    public async Task<ActionResult<NoTravelDay>> Create([FromBody] NoTravelDayRequest request)
    {
        if (!IsValid(request))
            return BadRequest("End date must be on or after the start date; recurring no-travel days must be a single date.");

        var day = await noTravelDayService.CreateAsync(request);
        return CreatedAtAction(nameof(GetAll), new { }, day);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<NoTravelDay>> Update(string id, [FromBody] NoTravelDayRequest request)
    {
        if (!IsValid(request))
            return BadRequest("End date must be on or after the start date; recurring no-travel days must be a single date.");

        var day = await noTravelDayService.UpdateAsync(id, request);
        return day is null ? NotFound() : Ok(day);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        return await noTravelDayService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    private static bool IsValid(NoTravelDayRequest request) =>
        request.EndDate >= request.StartDate
        && (!request.IsRecurring || request.StartDate == request.EndDate);
}
