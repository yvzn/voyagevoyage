using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages expense entries for the authenticated user, scoped to a specific trip.
/// </summary>
[Authorize]
[ApiController]
[Route("api/trips/{tripId}/expenses")]
public class ExpensesController(IExpenseService expenseService) : ControllerBase
{
    /// <summary>Returns all expenses for a trip.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Expense>>> GetAll(string tripId)
    {
        var expenses = await expenseService.GetAllByTripAsync(tripId);
        return Ok(expenses);
    }

    /// <summary>Returns an expense by its identifier.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Expense>> GetById(string tripId, string id)
    {
        var expense = await expenseService.GetByIdAsync(tripId, id);
        if (expense is null)
            return NotFound();

        return Ok(expense);
    }

    /// <summary>Creates a new expense linked to the given trip.</summary>
    [HttpPost]
    public async Task<ActionResult<Expense>> Create(string tripId, [FromBody] CreateExpenseRequest request)
    {
        var expense = await expenseService.CreateAsync(tripId, request);
        if (expense is null)
            return NotFound(); // trip not found or not owned by current user

        return CreatedAtAction(nameof(GetById), new { tripId, id = expense.Id }, expense);
    }

    /// <summary>Deletes an expense.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string tripId, string id)
    {
        var deleted = await expenseService.DeleteAsync(tripId, id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
