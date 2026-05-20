using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Cosmos DB implementation of <see cref="ITravelConstraintsService"/>, backed by EF Core.
/// Each user has at most one constraints document, identified by a fixed <see cref="TravelConstraints.DocumentId"/>.
/// </summary>
public class CosmosDbTravelConstraintsService(
    ApplicationDbContext db,
    ICurrentUserService currentUserService) : ITravelConstraintsService
{
    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    public async Task<TravelConstraints?> GetAsync()
    {
        var userId = GetCurrentUserId();
        return await db.TravelConstraints
            .Where(c => c.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task<TravelConstraints> UpsertAsync(UpdateTravelConstraintsRequest request)
    {
        var userId = GetCurrentUserId();
        var existing = await db.TravelConstraints
            .Where(c => c.UserId == userId)
            .FirstOrDefaultAsync();

        if (existing is null)
        {
            existing = new TravelConstraints { UserId = userId };
            db.TravelConstraints.Add(existing);
        }

        existing.AllowedDaysOfWeek = request.AllowedDaysOfWeek;
        existing.MaxDaysPerMonth = request.MaxDaysPerMonth;
        existing.ConsiderPublicHolidays = request.ConsiderPublicHolidays;
        existing.ConsiderVacationDays = request.ConsiderVacationDays;
        existing.IsStrict = request.IsStrict;
        existing.PlanningHorizonDays = request.PlanningHorizonDays;
        existing.PublicHolidayRegions = request.PublicHolidayRegions;
        existing.SchoolHolidayZones = request.SchoolHolidayZones;

        await db.SaveChangesAsync();
        return existing;
    }
}
