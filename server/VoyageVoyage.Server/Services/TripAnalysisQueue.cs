using System.Runtime.CompilerServices;
using System.Threading.Channels;

namespace VoyageVoyage.Server.Services;

public readonly record struct TripAnalysisJob(string UserId, string TripId);

public interface ITripAnalysisQueue
{
    bool Enqueue(string userId, string tripId);
    IAsyncEnumerable<TripAnalysisJob> ReadAllAsync(CancellationToken cancellationToken);
}

public sealed class TripAnalysisQueue : ITripAnalysisQueue
{
    private readonly Channel<TripAnalysisJob> _channel = Channel.CreateUnbounded<TripAnalysisJob>(
        new UnboundedChannelOptions { SingleReader = true, AllowSynchronousContinuations = false });
    private readonly HashSet<TripAnalysisJob> _queuedJobs = [];
    private readonly object _lock = new();

    public bool Enqueue(string userId, string tripId)
    {
        var job = new TripAnalysisJob(userId, tripId);
        lock (_lock)
        {
            if (!_queuedJobs.Add(job))
                return false;

            if (_channel.Writer.TryWrite(job))
                return true;

            _queuedJobs.Remove(job);
            return false;
        }
    }

    public async IAsyncEnumerable<TripAnalysisJob> ReadAllAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var job in _channel.Reader.ReadAllAsync(cancellationToken))
        {
            lock (_lock)
                _queuedJobs.Remove(job);

            yield return job;
        }
    }
}