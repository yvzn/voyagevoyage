using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

[ApiController]
[Route("api/vouchers")]
public class VouchersController(IVoucherService voucherService, ICurrentUserService currentUserService) : ControllerBase
{
    /// <summary>
    /// Get all vouchers for the current user.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Voucher>>> GetVouchers()
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        return Ok(await voucherService.GetUserVouchersAsync(currentUser.Id));
    }

    /// <summary>
    /// Create a new voucher.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Voucher>> CreateVoucher([FromBody] CreateVoucherRequest request)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        var voucher = await voucherService.CreateVoucherAsync(currentUser.Id, request);
        return CreatedAtAction(nameof(GetVouchers), new { id = voucher.Id }, voucher);
    }

    /// <summary>
    /// Update an existing voucher.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<Voucher>> UpdateVoucher(string id, [FromBody] UpdateVoucherRequest request)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        try
        {
            return Ok(await voucherService.UpdateVoucherAsync(currentUser.Id, id, request));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Mark a voucher as used.
    /// </summary>
    [HttpPost("{id}/use")]
    public async Task<ActionResult<Voucher>> MarkVoucherAsUsed(string id)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        try
        {
            return Ok(await voucherService.MarkVoucherAsUsedAsync(currentUser.Id, id));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Delete a voucher.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVoucher(string id)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        var deleted = await voucherService.DeleteVoucherAsync(currentUser.Id, id);
        return deleted ? NoContent() : NotFound();
    }
}
