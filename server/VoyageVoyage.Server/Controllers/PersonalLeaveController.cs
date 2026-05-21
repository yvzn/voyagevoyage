using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages personal leave periods for the authenticated user.
/// </summary>
[Authorize]
[ApiController]
[Route("api/personal-leaves")]
public class PersonalLeaveController(IPersonalLeaveService personalLeaveService) : ControllerBase
{
    /// <summary>
    /// Returns all personal leave periods for the current user.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PersonalLeave>>> GetAll()
    {
        var leaves = await personalLeaveService.GetForCurrentUserAsync();
        return Ok(leaves);
    }

    /// <summary>
    /// Creates a new personal leave period for the current user.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PersonalLeave>> Create([FromBody] CreatePersonalLeaveRequest request)
    {
        if (request.EndDate < request.StartDate)
            return BadRequest("End date must be on or after the start date.");

        var leave = await personalLeaveService.CreateAsync(request);
        return CreatedAtAction(nameof(GetAll), new { }, leave);
    }

    /// <summary>
    /// Updates an existing personal leave period.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<PersonalLeave>> Update(string id, [FromBody] UpdatePersonalLeaveRequest request)
    {
        if (request.EndDate < request.StartDate)
            return BadRequest("End date must be on or after the start date.");

        var leave = await personalLeaveService.UpdateAsync(id, request);
        if (leave is null)
            return NotFound();

        return Ok(leave);
    }

    /// <summary>
    /// Deletes a personal leave period.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await personalLeaveService.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Imports personal leave periods from an uploaded ICS file for the current user.
    /// Replaces all existing personal leave periods.
    /// </summary>
    [HttpPost("import-ics")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB limit
    public async Task<IActionResult> ImportIcs(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided.");

        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".ics", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Only .ics files are accepted.");

        await using var stream = file.OpenReadStream();
        await personalLeaveService.ImportIcsAsync(stream);

        return NoContent();
    }
}
