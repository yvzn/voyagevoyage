using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Provides download and deletion of receipts by their identifier,
/// regardless of whether they are linked to an expense or a trip.
/// </summary>
[Authorize]
[ApiController]
[Route("api/receipts")]
public class ReceiptController(IReceiptService receiptService) : ControllerBase
{
    /// <summary>Downloads the file content of a receipt.</summary>
    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(string id)
    {
        var result = await receiptService.DownloadAsync(id);
        if (result is null)
            return NotFound();

        var (content, contentType, fileName) = result.Value;
        return File(content, contentType, fileName);
    }

    /// <summary>Deletes a receipt.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await receiptService.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Returns a preview of the receipt that can be displayed in the browser.
    /// For images: returns the image directly for display
    /// For PDFs: returns the PDF that can be displayed in an iframe/object tag
    /// </summary>
    [HttpGet("{id}/preview")]
    public async Task<IActionResult> Preview(string id)
    {
        var result = await receiptService.DownloadAsync(id);
        if (result is null)
            return NotFound();

        var (content, contentType, _) = result.Value;
        return File(content, contentType);
    }
}
