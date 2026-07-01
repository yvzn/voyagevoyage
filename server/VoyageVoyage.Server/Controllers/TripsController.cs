using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages trip entries for the authenticated user.
/// </summary>
[Authorize]
[ApiController]
[Route("api/trips")]
public class TripsController(ITripService tripService) : ControllerBase
{
    /// <summary>Returns all trips.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Trip>>> GetAll()
    {
        var trips = await tripService.GetAllAsync();
        return Ok(trips);
    }

    /// <summary>Returns a trip by its identifier.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Trip>> GetById(string id)
    {
        var trip = await tripService.GetByIdAsync(id);
        if (trip is null)
            return NotFound();

        return Ok(trip);
    }

    /// <summary>Creates a new trip.</summary>
    [HttpPost]
    public async Task<ActionResult<Trip>> Create([FromBody] CreateTripRequest request)
    {
        var trip = await tripService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = trip.Id }, trip);
    }

    /// <summary>Replaces an existing trip.</summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<Trip>> Update(string id, [FromBody] UpdateTripRequest request)
    {
        var trip = await tripService.UpdateAsync(id, request);
        if (trip is null)
            return NotFound();

        return Ok(trip);
    }

    /// <summary>Patches a trip (trainBooking/hotelBooking only).</summary>
    [HttpPatch("{id}")]
    public async Task<ActionResult<Trip>> Patch(string id, [FromBody] PatchTripRequest request)
    {
        var trip = await tripService.PatchAsync(id, request);
        if (trip is null)
            return NotFound();

        return Ok(trip);
    }

    /// <summary>Deletes a trip.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await tripService.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
