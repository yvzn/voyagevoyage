using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public class FiscalRuleService(ApplicationDbContext dbContext) : IFiscalRuleService
{
    public async Task<IEnumerable<FiscalRule>> GetUserFiscalRulesAsync(string userId)
    {
        return await dbContext.FiscalRules
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.StartDate)
            .ToListAsync();
    }

    public async Task<FiscalRule> CreateFiscalRuleAsync(string userId, CreateFiscalRuleRequest request)
    {
        var fiscalRule = new FiscalRule
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MealAllowance = request.MealAllowance,
            MealVoucherContribution = request.MealVoucherContribution,
            RemoteWorkAllowance = request.RemoteWorkAllowance,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.FiscalRules.Add(fiscalRule);
        await dbContext.SaveChangesAsync();

        return fiscalRule;
    }

    public async Task<FiscalRule> UpdateFiscalRuleAsync(string userId, string id, UpdateFiscalRuleRequest request)
    {
        var fiscalRule = await dbContext.FiscalRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId)
            ?? throw new KeyNotFoundException($"Fiscal rule with id {id} not found.");

        fiscalRule.StartDate = request.StartDate;
        fiscalRule.EndDate = request.EndDate;
        fiscalRule.MealAllowance = request.MealAllowance;
        fiscalRule.MealVoucherContribution = request.MealVoucherContribution;
        fiscalRule.RemoteWorkAllowance = request.RemoteWorkAllowance;
        fiscalRule.UpdatedAt = DateTime.UtcNow;

        dbContext.FiscalRules.Update(fiscalRule);
        await dbContext.SaveChangesAsync();

        return fiscalRule;
    }

    public async Task<bool> DeleteFiscalRuleAsync(string userId, string id)
    {
        var fiscalRule = await dbContext.FiscalRules
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (fiscalRule == null)
            return false;

        dbContext.FiscalRules.Remove(fiscalRule);
        await dbContext.SaveChangesAsync();

        return true;
    }
}
