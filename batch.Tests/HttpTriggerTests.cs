using System.Net;
using System.Reflection;
using batch;
using batch.Data;
using batch.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

public class HttpTriggerTests
{
    [Theory]
    [InlineData(typeof(DetectTripAnomaliesFunction))]
    [InlineData(typeof(ImportPublicHolidaysFunction))]
    [InlineData(typeof(ImportSchoolHolidaysFunction))]
    public void JobsRequireFunctionKeyAndPost(Type functionType)
    {
        var trigger = functionType.GetMethod("Run")!.GetParameters()[0]
            .GetCustomAttribute<HttpTriggerAttribute>();

        Assert.NotNull(trigger);
        Assert.Equal(AuthorizationLevel.Function, trigger.AuthLevel);
        Assert.Equal(new[] { "post" }, trigger.Methods);
    }

    [Fact]
    public async Task PublicHolidayFetchFailurePropagates()
    {
        var api = new FrancePublicHolidayApiService(FailingClient(), NullLogger<FrancePublicHolidayApiService>.Instance);
        var factory = Substitute.For<IDbContextFactory<BatchDbContext>>();
        var function = new ImportPublicHolidaysFunction(api, factory, NullLogger<ImportPublicHolidaysFunction>.Instance);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            function.Run(new DefaultHttpContext().Request, CancellationToken.None));
        await factory.DidNotReceive().CreateDbContextAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SchoolHolidayFetchFailurePropagates()
    {
        var api = new FranceSchoolHolidayApiService(FailingClient(), NullLogger<FranceSchoolHolidayApiService>.Instance);
        var factory = Substitute.For<IDbContextFactory<BatchDbContext>>();
        var function = new ImportSchoolHolidaysFunction(api, factory, NullLogger<ImportSchoolHolidaysFunction>.Instance);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            function.Run(new DefaultHttpContext().Request, CancellationToken.None));
        await factory.DidNotReceive().CreateDbContextAsync(Arg.Any<CancellationToken>());
    }

    private static HttpClient FailingClient() => new(new FailureHandler());

    private sealed class FailureHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
    }
}
