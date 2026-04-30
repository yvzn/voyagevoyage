using System.Collections.Concurrent;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// In-memory implementation of <see cref="ITripService"/>.
/// Intended for local development. Replace with a Cosmos DB-backed implementation for production.
/// </summary>
public class InMemoryTripService : ITripService
{
    private readonly ConcurrentDictionary<string, Trip> _store = new(
        new[]
        {
            Create("1", new DateOnly(2026, 4, 6),  new DateOnly(2026, 4, 8),  "Lyon",      TripStatus.Confirmed),
            Create("2", new DateOnly(2026, 4, 14), new DateOnly(2026, 4, 16), "Bordeaux",  TripStatus.Planned),
            Create("3", new DateOnly(2026, 4, 22), new DateOnly(2026, 4, 23), "Lille",     TripStatus.Cancelled),
            Create("4", new DateOnly(2026, 5, 4),  new DateOnly(2026, 5, 6),  "Nantes",    TripStatus.Planned),
            Create("5", new DateOnly(2026, 5, 18), new DateOnly(2026, 5, 20), "Marseille", TripStatus.Confirmed),
        }.Select(t => new KeyValuePair<string, Trip>(t.Id, t))
    );

    private static Trip Create(string id, DateOnly start, DateOnly end, string destination, TripStatus status)
        => new Trip(id, start, end, destination, status);

    public Task<IReadOnlyList<Trip>> GetAllAsync()
        => Task.FromResult<IReadOnlyList<Trip>>([.. _store.Values]);

    public Task<Trip?> GetByIdAsync(string id)
        => Task.FromResult(_store.TryGetValue(id, out var trip) ? trip : null);

    public Task<Trip> CreateAsync(CreateTripRequest request)
    {
        var trip = new Trip(
            Id: Guid.NewGuid().ToString(),
            StartDate: request.StartDate,
            EndDate: request.EndDate,
            Destination: request.Destination,
            Status: request.Status
        );
        _store[trip.Id] = trip;
        return Task.FromResult(trip);
    }

    public Task<Trip?> UpdateAsync(string id, UpdateTripRequest request)
    {
        if (!_store.ContainsKey(id))
            return Task.FromResult<Trip?>(null);

        var updated = new Trip(
            Id: id,
            StartDate: request.StartDate,
            EndDate: request.EndDate,
            Destination: request.Destination,
            Status: request.Status
        );
        _store[id] = updated;
        return Task.FromResult<Trip?>(updated);
    }

    public Task<bool> DeleteAsync(string id)
        => Task.FromResult(_store.TryRemove(id, out _));
}
