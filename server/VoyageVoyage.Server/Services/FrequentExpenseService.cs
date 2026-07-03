using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public class FrequentExpenseService(ApplicationDbContext dbContext) : IFrequentExpenseService
{
    public async Task<IEnumerable<FrequentExpense>> GetUserFrequentExpensesAsync(string userId)
    {
        return await dbContext.FrequentExpenses
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<FrequentExpense> CreateFrequentExpenseAsync(string userId, CreateFrequentExpenseRequest request)
    {
        var frequentExpense = new FrequentExpense
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Category = request.Category,
            Amount = request.Amount,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.FrequentExpenses.Add(frequentExpense);
        await dbContext.SaveChangesAsync();

        return frequentExpense;
    }

    public async Task<FrequentExpense> UpdateFrequentExpenseAsync(string userId, string id, UpdateFrequentExpenseRequest request)
    {
        var frequentExpense = await dbContext.FrequentExpenses
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId)
            ?? throw new KeyNotFoundException($"Frequent expense with id {id} not found.");

        frequentExpense.Category = request.Category;
        frequentExpense.Amount = request.Amount;
        frequentExpense.Description = request.Description;
        frequentExpense.UpdatedAt = DateTime.UtcNow;

        dbContext.FrequentExpenses.Update(frequentExpense);
        await dbContext.SaveChangesAsync();

        return frequentExpense;
    }

    public async Task<bool> DeleteFrequentExpenseAsync(string userId, string id)
    {
        var frequentExpense = await dbContext.FrequentExpenses
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (frequentExpense == null)
            return false;

        dbContext.FrequentExpenses.Remove(frequentExpense);
        await dbContext.SaveChangesAsync();

        return true;
    }
}
