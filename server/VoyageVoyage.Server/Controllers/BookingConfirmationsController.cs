using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Handles booking confirmation files (.ics / PDF).
/// Parse endpoint returns extracted data for user review (no persistence).
/// Trip-scoped endpoints persist the file and its metadata.
/// </summary>
[Authorize]
[ApiController]
public class BookingConfirmationsController(
    IBookingConfirmationService confirmationService,
    IBookingConfirmationParserService parserService) : ControllerBase
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    /// <summary>
    /// Parses a confirmation file and returns extracted data without saving anything.
    /// </summary>
    [HttpPost("api/booking-confirmations/parse")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<ParsedBookingConfirmation>> Parse(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided.");

        if (file.Length > MaxFileSizeBytes)
            return BadRequest("File exceeds the maximum allowed size of 10 MB.");

        await using var stream = file.OpenReadStream();
        var result = await parserService.ParseAsync(stream, file.ContentType, file.FileName);
        return Ok(result);
    }

    /// <summary>Returns all booking confirmations for a trip.</summary>
    [HttpGet("api/trips/{tripId}/booking-confirmations")]
    public async Task<ActionResult<IReadOnlyList<BookingConfirmation>>> GetAll(string tripId)
    {
        var confirmations = await confirmationService.GetAllByTripAsync(tripId);
        return Ok(confirmations);
    }

    /// <summary>Uploads and stores a booking confirmation for a trip.</summary>
    [HttpPost("api/trips/{tripId}/booking-confirmations")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<BookingConfirmation>> Upload(string tripId, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided.");

        if (file.Length > MaxFileSizeBytes)
            return BadRequest("File exceeds the maximum allowed size of 10 MB.");

        var confirmation = await confirmationService.UploadForTripAsync(tripId, file);
        if (confirmation is null)
            return NotFound();

        return Created($"/api/booking-confirmations/{confirmation.Id}", confirmation);
    }

    /// <summary>Downloads the original confirmation file.</summary>
    [HttpGet("api/booking-confirmations/{id}/download")]
    public async Task<IActionResult> Download(string id)
    {
        var result = await confirmationService.DownloadAsync(id);
        if (result is null)
            return NotFound();

        var (content, contentType, fileName) = result.Value;
        return File(content, contentType, fileName);
    }

    /// <summary>Deletes a booking confirmation.</summary>
    [HttpDelete("api/booking-confirmations/{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await confirmationService.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
