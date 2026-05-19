using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages school holidays for the authenticated user.
/// </summary>
[Authorize]
[ApiController]
[Route("api/school-holidays")]
public class SchoolHolidaysController(ISchoolHolidayService schoolHolidayService) : ControllerBase
{
    /// <summary>
    /// Returns school holidays visible to the current user (system-imported + user ICS imports).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<SchoolHoliday>>> Get()
    {
        var holidays = await schoolHolidayService.GetForCurrentUserAsync();
        return Ok(holidays);
    }

    /// <summary>
    /// Imports school holidays from an uploaded ICS file for the current user.
    /// Replaces any previously user-imported school holidays.
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
        await schoolHolidayService.ImportIcsAsync(stream);

        return NoContent();
    }
}
