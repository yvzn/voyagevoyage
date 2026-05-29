using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages receipts (justificatifs) attached to a specific trip.
/// </summary>
[Authorize]
[ApiController]
[Route("api/trips/{tripId}/receipts")]
public class TripReceiptsController(IReceiptService receiptService) : ControllerBase
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    /// <summary>Returns all receipts attached to a trip.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Receipt>>> GetAll(string tripId)
    {
        var receipts = await receiptService.GetAllByTripAsync(tripId);
        return Ok(receipts);
    }

    /// <summary>Uploads a PDF or image receipt and attaches it to the given trip.</summary>
    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<Receipt>> Upload(string tripId, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided.");

        if (file.Length > MaxFileSizeBytes)
            return BadRequest("File exceeds the maximum allowed size of 10 MB.");

        var receipt = await receiptService.UploadForTripAsync(tripId, file);
        if (receipt is null)
            return NotFound(); // trip not found or not owned by current user

        return Created($"/api/receipts/{receipt.Id}", receipt);
    }
}
