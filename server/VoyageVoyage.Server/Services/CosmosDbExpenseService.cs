using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Cosmos DB implementation of <see cref="IExpenseService"/>, backed by EF Core.
/// All operations are scoped to the authenticated user.
/// </summary>
public class CosmosDbExpenseService(ApplicationDbContext db, ICurrentUserService currentUserService) : IExpenseService
{
    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    public async Task<IReadOnlyList<Expense>> GetAllByTripAsync(string tripId)
    {
        var userId = GetCurrentUserId();
        return await db.Expenses
            .Where(e => e.TripId == tripId && e.UserId == userId)
            .ToListAsync();
    }

    public async Task<Expense?> GetByIdAsync(string tripId, string id)
    {
        var userId = GetCurrentUserId();
        return await db.Expenses
            .Where(e => e.Id == id && e.TripId == tripId && e.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task<Expense?> CreateAsync(string tripId, CreateExpenseRequest request)
    {
        var userId = GetCurrentUserId();

        // Verify that the trip exists and belongs to the current user
        var tripExists = await db.Trips
            .AnyAsync(t => t.Id == tripId && t.UserId == userId);
        if (!tripExists)
            return null;

        var expense = new Expense
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            TripId = tripId,
            Date = request.Date,
            Category = request.Category,
            Amount = request.Amount,
            Description = request.Description,
        };
        db.Expenses.Add(expense);
        await db.SaveChangesAsync();
        return expense;
    }

    public async Task<bool> DeleteAsync(string tripId, string id)
    {
        var userId = GetCurrentUserId();
        var expense = await db.Expenses
            .Where(e => e.Id == id && e.TripId == tripId && e.UserId == userId)
            .FirstOrDefaultAsync();

        if (expense is null)
            return false;

        db.Expenses.Remove(expense);
        await db.SaveChangesAsync();
        return true;
    }
}
