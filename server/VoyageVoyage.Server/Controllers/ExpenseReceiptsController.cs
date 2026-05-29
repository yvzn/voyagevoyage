using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages receipts (justificatifs) attached to a specific expense.
/// </summary>
[Authorize]
[ApiController]
[Route("api/expenses/{expenseId}/receipts")]
public class ExpenseReceiptsController(IReceiptService receiptService) : ControllerBase
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    /// <summary>Returns all receipts attached to an expense.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Receipt>>> GetAll(string expenseId)
    {
        var receipts = await receiptService.GetAllByExpenseAsync(expenseId);
        return Ok(receipts);
    }

    /// <summary>Uploads a PDF or image receipt and attaches it to the given expense.</summary>
    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<Receipt>> Upload(string expenseId, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file provided.");

        if (file.Length > MaxFileSizeBytes)
            return BadRequest("File exceeds the maximum allowed size of 10 MB.");

        var receipt = await receiptService.UploadForExpenseAsync(expenseId, file);
        if (receipt is null)
            return NotFound(); // expense not found or not owned by current user

        return Created($"/api/receipts/{receipt.Id}", receipt);
    }
}
