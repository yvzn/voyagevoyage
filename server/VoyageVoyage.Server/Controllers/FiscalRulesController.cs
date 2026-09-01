using Microsoft.AspNetCore.Mvc;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Controllers;

/// <summary>
/// Manages the fiscal rules (meal allowance, meal voucher contribution, remote work allowance) for the current user.
/// </summary>
[ApiController]
[Route("api/fiscal-rules")]
public class FiscalRulesController(IFiscalRuleService fiscalRuleService, ICurrentUserService currentUserService) : ControllerBase
{
    /// <summary>
    /// Get all fiscal rules for the current user.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FiscalRule>>> GetFiscalRules()
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        var fiscalRules = await fiscalRuleService.GetUserFiscalRulesAsync(currentUser.Id);
        return Ok(fiscalRules);
    }

    /// <summary>
    /// Create a new fiscal rule.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FiscalRule>> CreateFiscalRule([FromBody] CreateFiscalRuleRequest request)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        if (request.EndDate < request.StartDate)
        {
            ModelState.AddModelError(nameof(request.EndDate), "validation.endDateBeforeStartDate");
            return ValidationProblem(ModelState);
        }

        var createdRule = await fiscalRuleService.CreateFiscalRuleAsync(currentUser.Id, request);
        return CreatedAtAction(nameof(GetFiscalRules), new { id = createdRule.Id }, createdRule);
    }

    /// <summary>
    /// Update an existing fiscal rule.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<FiscalRule>> UpdateFiscalRule(string id, [FromBody] UpdateFiscalRuleRequest request)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        if (request.EndDate < request.StartDate)
        {
            ModelState.AddModelError(nameof(request.EndDate), "validation.endDateBeforeStartDate");
            return ValidationProblem(ModelState);
        }

        try
        {
            var updatedRule = await fiscalRuleService.UpdateFiscalRuleAsync(currentUser.Id, id, request);
            return Ok(updatedRule);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Delete a fiscal rule.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFiscalRule(string id)
    {
        var currentUser = currentUserService.GetCurrentUser();
        if (currentUser == null)
            return Unauthorized();

        var deleted = await fiscalRuleService.DeleteFiscalRuleAsync(currentUser.Id, id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
