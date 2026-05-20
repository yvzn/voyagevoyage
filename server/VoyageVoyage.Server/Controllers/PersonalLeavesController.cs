using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages personal leaves for the authenticated user.
/// </summary>
[Authorize]
[ApiController]
[Route("api/personal-leaves")]
public class PersonalLeavesController(IPersonalLeaveService personalLeaveService) : ControllerBase
{
    /// <summary>
    /// Returns personal leaves for the current user.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PersonalLeave>>> Get()
    {
        var leaves = await personalLeaveService.GetForCurrentUserAsync();
        return Ok(leaves);
    }

    /// <summary>
    /// Imports personal leaves from an uploaded ICS file for the current user.
    /// Replaces any previously imported personal leaves.
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
