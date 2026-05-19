using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages public holidays for the authenticated user.
/// </summary>
[Authorize]
[ApiController]
[Route("api/public-holidays")]
public class PublicHolidaysController(IPublicHolidayService publicHolidayService) : ControllerBase
{
    /// <summary>
    /// Returns public holidays visible to the current user (system-imported + user ICS imports).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PublicHoliday>>> Get()
    {
        var holidays = await publicHolidayService.GetForCurrentUserAsync();
        return Ok(holidays);
    }

    /// <summary>
    /// Imports public holidays from an uploaded ICS file for the current user.
    /// Replaces any previously user-imported holidays.
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
        await publicHolidayService.ImportIcsAsync(stream);

        return NoContent();
    }
}
