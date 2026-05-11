using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Provides direct access to a single expense by id, without requiring the tripId in the URL.
/// Used by the expense detail page.
/// </summary>
[Authorize]
[ApiController]
[Route("api/expenses")]
public class ExpenseDetailController(IExpenseService expenseService) : ControllerBase
{
    /// <summary>Returns a single expense by its identifier.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Expense>> GetById(string id)
    {
        var expense = await expenseService.GetByIdForUserAsync(id);
        if (expense is null)
            return NotFound();

        return Ok(expense);
    }

    /// <summary>Updates an existing expense.</summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<Expense>> Update(string id, [FromBody] UpdateExpenseRequest request)
    {
        var expense = await expenseService.UpdateAsync(id, request);
        if (expense is null)
            return NotFound();

        return Ok(expense);
    }

    /// <summary>Deletes an expense.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await expenseService.DeleteByIdForUserAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
