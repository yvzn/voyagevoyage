using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

[ApiController]
[Route("api/frequent-expenses")]
public class FrequentExpensesController(IFrequentExpenseService frequentExpenseService, ICurrentUserService currentUserService) : ControllerBase
{
    /// <summary>
    /// Get all frequent expense presets for the current user.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FrequentExpense>>> GetFrequentExpenses()
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        var expenses = await frequentExpenseService.GetUserFrequentExpensesAsync(currentUser.Id);
        return Ok(expenses);
    }

    /// <summary>
    /// Create a new frequent expense preset.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FrequentExpense>> CreateFrequentExpense([FromBody] CreateFrequentExpenseRequest request)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        var createdExpense = await frequentExpenseService.CreateFrequentExpenseAsync(currentUser.Id, request);
        return CreatedAtAction(nameof(GetFrequentExpenses), new { id = createdExpense.Id }, createdExpense);
    }

    /// <summary>
    /// Update an existing frequent expense preset.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<FrequentExpense>> UpdateFrequentExpense(string id, [FromBody] UpdateFrequentExpenseRequest request)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        try
        {
            var updatedExpense = await frequentExpenseService.UpdateFrequentExpenseAsync(currentUser.Id, id, request);
            return Ok(updatedExpense);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Delete a frequent expense preset.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFrequentExpense(string id)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        var deleted = await frequentExpenseService.DeleteFrequentExpenseAsync(currentUser.Id, id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
