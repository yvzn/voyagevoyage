using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

[Authorize]
[ApiController]
[Route("api/trips/{tripId}/expected-expenses")]
public class ExpectedExpensesController(IExpectedExpenseService expectedExpenseService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ExpectedExpensesResponse>> Get(string tripId)
    {
        var expectedExpenses = await expectedExpenseService.GetForTripAsync(tripId);
        if (expectedExpenses is null)
            return NotFound();

        return Ok(expectedExpenses);
    }
}
