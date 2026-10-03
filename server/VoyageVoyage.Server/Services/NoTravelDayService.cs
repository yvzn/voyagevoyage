using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public class NoTravelDayService(
    ApplicationDbContext db,
    ICurrentUserService currentUserService) : INoTravelDayService
{
    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    public async Task<List<NoTravelDay>> GetForCurrentUserAsync()
    {
        var userId = GetCurrentUserId();
        return await db.NoTravelDays
            .Where(day => day.UserId == userId)
            .OrderBy(day => day.StartDate)
            .ToListAsync();
    }

    public async Task<NoTravelDay> CreateAsync(NoTravelDayRequest request)
    {
        var day = new NoTravelDay
        {
            Id = Guid.NewGuid().ToString(),
            UserId = GetCurrentUserId(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsRecurring = request.IsRecurring,
            Label = request.Label,
        };
        db.NoTravelDays.Add(day);
        await db.SaveChangesAsync();
        return day;
    }

    public async Task<NoTravelDay?> UpdateAsync(string id, NoTravelDayRequest request)
    {
        var userId = GetCurrentUserId();
        var day = await db.NoTravelDays
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (day is null)
            return null;

        day.StartDate = request.StartDate;
        day.EndDate = request.EndDate;
        day.IsRecurring = request.IsRecurring;
        day.Label = request.Label;
        await db.SaveChangesAsync();
        return day;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var userId = GetCurrentUserId();
        var day = await db.NoTravelDays
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (day is null)
            return false;

        db.NoTravelDays.Remove(day);
        await db.SaveChangesAsync();
        return true;
    }
}
