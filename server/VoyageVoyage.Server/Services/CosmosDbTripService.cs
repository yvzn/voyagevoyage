using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Cosmos DB implementation of <see cref="ITripService"/>, backed by EF Core.
/// All operations are scoped to the authenticated user.
/// </summary>
public class CosmosDbTripService(ApplicationDbContext db, ICurrentUserService currentUserService) : ITripService
{
    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    public async Task<IReadOnlyList<Trip>> GetAllAsync()
    {
        var userId = GetCurrentUserId();
        return await db.Trips
            .Where(t => t.UserId == userId)
            .ToListAsync();
    }

    public async Task<Trip?> GetByIdAsync(string id)
    {
        var userId = GetCurrentUserId();
        return await db.Trips
            .Where(t => t.Id == id && t.UserId == userId)
            .FirstOrDefaultAsync();
    }

    public async Task<Trip> CreateAsync(CreateTripRequest request)
    {
        var userId = GetCurrentUserId();
        var trip = new Trip
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Destination = request.Destination,
            Status = request.Status,
        };
        db.Trips.Add(trip);
        await db.SaveChangesAsync();
        return trip;
    }

    public async Task<Trip?> UpdateAsync(string id, UpdateTripRequest request)
    {
        var userId = GetCurrentUserId();
        var trip = await db.Trips
            .Where(t => t.Id == id && t.UserId == userId)
            .FirstOrDefaultAsync();

        if (trip is null)
            return null;

        trip.StartDate = request.StartDate;
        trip.EndDate = request.EndDate;
        trip.Destination = request.Destination;
        trip.Status = request.Status;
        await db.SaveChangesAsync();
        return trip;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var userId = GetCurrentUserId();
        var trip = await db.Trips
            .Where(t => t.Id == id && t.UserId == userId)
            .FirstOrDefaultAsync();

        if (trip is null)
            return false;

        db.Trips.Remove(trip);
        await db.SaveChangesAsync();
        return true;
    }
}
