using VoyageVoyage.Server.Services;
using Xunit;

namespace VoyageVoyage.Server.Tests.Services;

public class TripAnalysisQueueTests
{
    [Fact]
    public async Task Enqueue_CoalescesQueuedEditsAndAllowsOneFollowUpWhileProcessing()
    {
        var queue = new TripAnalysisQueue();
        Assert.True(queue.Enqueue("user-1", "trip-1"));
        Assert.False(queue.Enqueue("user-1", "trip-1"));

        await using var reader = queue.ReadAllAsync(CancellationToken.None).GetAsyncEnumerator();
        Assert.True(await reader.MoveNextAsync());
        Assert.Equal(new TripAnalysisJob("user-1", "trip-1"), reader.Current);

        Assert.True(queue.Enqueue("user-1", "trip-1"));
        Assert.True(await reader.MoveNextAsync());
        Assert.Equal(new TripAnalysisJob("user-1", "trip-1"), reader.Current);
    }
}