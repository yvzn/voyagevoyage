using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Tests.Services;

public class TravelConstraintsServiceTests
{
    private static (TravelConstraintsService service, ApplicationDbContext db) CreateService(string userId = "test-user")
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim("sub", userId) }, "TestScheme"));

        var httpContext = Substitute.For<HttpContext>();
        httpContext.User.Returns(principal);

        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns(httpContext);

        var logger = Substitute.For<ILogger<AppServiceCurrentUserService>>();
        var currentUserService = new AppServiceCurrentUserService(accessor, logger);

        var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new ApplicationDbContext(dbOptions);
        var service = new TravelConstraintsService(db, currentUserService);
        return (service, db);
    }

    [Fact]
    public async Task UpsertAsync_PersistsA1A2AndXValues()
    {
        var (service, db) = CreateService();

        var request = new UpdateTravelConstraintsRequest(
            AllowedDaysOfWeek: [1, 2, 3],
            MaxDaysPerMonth: 10,
            ConsiderPublicHolidays: true,
            ConsiderVacationDays: false,
            IsStrict: true,
            PlanningHorizonDays: 90,
            PublicHolidayRegions: ["france-metropole"],
            SchoolHolidayZones: ["Zone A"],
            TrainBookingThresholdDays: 45,
            A1MaxPastTripAgeDays: 365,
            A2MinCompletionDelayDays: 30,
            XAtypicalExpenseThresholdPercent: 120m);

        var result = await service.UpsertAsync(request);

        Assert.Equal(365, result.A1MaxPastTripAgeDays);
        Assert.Equal(30, result.A2MinCompletionDelayDays);
        Assert.Equal(120m, result.XAtypicalExpenseThresholdPercent);

        var saved = await db.TravelConstraints.SingleAsync(c => c.UserId == "test-user");
        Assert.Equal(365, saved.A1MaxPastTripAgeDays);
        Assert.Equal(30, saved.A2MinCompletionDelayDays);
        Assert.Equal(120m, saved.XAtypicalExpenseThresholdPercent);
    }

    [Fact]
    public async Task GetAsync_ReturnsPersistedAnomalySettings()
    {
        var (service, db) = CreateService();
        db.TravelConstraints.Add(new TravelConstraints
        {
            UserId = "test-user",
            A1MaxPastTripAgeDays = 540,
            A2MinCompletionDelayDays = 45,
            XAtypicalExpenseThresholdPercent = 150m,
        });
        await db.SaveChangesAsync();

        var result = await service.GetAsync();

        Assert.NotNull(result);
        Assert.Equal(540, result!.A1MaxPastTripAgeDays);
        Assert.Equal(45, result.A2MinCompletionDelayDays);
        Assert.Equal(150m, result.XAtypicalExpenseThresholdPercent);
    }
}
