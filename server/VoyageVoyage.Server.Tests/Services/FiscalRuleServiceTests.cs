using Microsoft.EntityFrameworkCore;
using Xunit;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Tests.Services;

public class FiscalRuleServiceTests
{
    private static (FiscalRuleService service, ApplicationDbContext db) CreateService()
    {
        var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new ApplicationDbContext(dbOptions);
        var service = new FiscalRuleService(db);
        return (service, db);
    }

    [Fact]
    public async Task GetUserFiscalRulesAsync_Returns_OnlyCurrentUserRules()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;

        var rule1 = new FiscalRule
        {
            Id = "fr-1",
            UserId = "user-1",
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            MealAllowance = 20m,
            MealVoucherContribution = 6m,
            RemoteWorkAllowance = 2.5m,
            CreatedAt = now,
            UpdatedAt = now
        };

        var rule2 = new FiscalRule
        {
            Id = "fr-2",
            UserId = "user-2",
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            MealAllowance = 22m,
            MealVoucherContribution = 7m,
            RemoteWorkAllowance = 3m,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FiscalRules.Add(rule1);
        db.FiscalRules.Add(rule2);
        await db.SaveChangesAsync();

        // Act
        var result = await service.GetUserFiscalRulesAsync("user-1");

        // Assert
        Assert.Single(result);
        Assert.Equal("fr-1", result.First().Id);
        Assert.Equal("user-1", result.First().UserId);
    }

    [Fact]
    public async Task CreateFiscalRuleAsync_Creates_NewRule()
    {
        // Arrange
        var (service, db) = CreateService();
        var request = new CreateFiscalRuleRequest
        {
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            MealAllowance = 20.20m,
            MealVoucherContribution = 6.91m,
            RemoteWorkAllowance = 2.6m
        };

        // Act
        var result = await service.CreateFiscalRuleAsync("user-1", request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(new DateOnly(2026, 1, 1), result.StartDate);
        Assert.Equal(new DateOnly(2026, 12, 31), result.EndDate);
        Assert.Equal(20.20m, result.MealAllowance);
        Assert.Equal(6.91m, result.MealVoucherContribution);
        Assert.Equal(2.6m, result.RemoteWorkAllowance);
        Assert.Equal("user-1", result.UserId);

        var saved = await db.FiscalRules.FindAsync(result.Id);
        Assert.NotNull(saved);
    }

    [Fact]
    public async Task UpdateFiscalRuleAsync_Updates_ExistingRule()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;

        var rule = new FiscalRule
        {
            Id = "fr-1",
            UserId = "user-1",
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            MealAllowance = 20m,
            MealVoucherContribution = 6m,
            RemoteWorkAllowance = 2.5m,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FiscalRules.Add(rule);
        await db.SaveChangesAsync();

        var updateRequest = new UpdateFiscalRuleRequest
        {
            StartDate = new DateOnly(2027, 1, 1),
            EndDate = new DateOnly(2027, 12, 31),
            MealAllowance = 21m,
            MealVoucherContribution = 6.5m,
            RemoteWorkAllowance = 2.7m
        };

        // Act
        var result = await service.UpdateFiscalRuleAsync("user-1", "fr-1", updateRequest);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(new DateOnly(2027, 1, 1), result.StartDate);
        Assert.Equal(new DateOnly(2027, 12, 31), result.EndDate);
        Assert.Equal(21m, result.MealAllowance);
        Assert.Equal(6.5m, result.MealVoucherContribution);
        Assert.Equal(2.7m, result.RemoteWorkAllowance);
    }

    [Fact]
    public async Task UpdateFiscalRuleAsync_Throws_WhenRuleNotFound()
    {
        // Arrange
        var (service, _) = CreateService();
        var updateRequest = new UpdateFiscalRuleRequest
        {
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            MealAllowance = 21m,
            MealVoucherContribution = 6.5m,
            RemoteWorkAllowance = 2.7m
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.UpdateFiscalRuleAsync("user-1", "non-existent", updateRequest));
    }

    [Fact]
    public async Task UpdateFiscalRuleAsync_Throws_WhenNotOwnedByUser()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;

        var rule = new FiscalRule
        {
            Id = "fr-1",
            UserId = "user-2",
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            MealAllowance = 20m,
            MealVoucherContribution = 6m,
            RemoteWorkAllowance = 2.5m,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FiscalRules.Add(rule);
        await db.SaveChangesAsync();

        var updateRequest = new UpdateFiscalRuleRequest
        {
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            MealAllowance = 21m,
            MealVoucherContribution = 6.5m,
            RemoteWorkAllowance = 2.7m
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.UpdateFiscalRuleAsync("user-1", "fr-1", updateRequest));
    }

    [Fact]
    public async Task DeleteFiscalRuleAsync_Deletes_ExistingRule()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;

        var rule = new FiscalRule
        {
            Id = "fr-1",
            UserId = "user-1",
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            MealAllowance = 20m,
            MealVoucherContribution = 6m,
            RemoteWorkAllowance = 2.5m,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FiscalRules.Add(rule);
        await db.SaveChangesAsync();

        // Act
        var result = await service.DeleteFiscalRuleAsync("user-1", "fr-1");

        // Assert
        Assert.True(result);
        var deleted = await db.FiscalRules.FindAsync("fr-1");
        Assert.Null(deleted);
    }

    [Fact]
    public async Task DeleteFiscalRuleAsync_Returns_False_WhenRuleNotFound()
    {
        // Arrange
        var (service, _) = CreateService();

        // Act
        var result = await service.DeleteFiscalRuleAsync("user-1", "non-existent");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteFiscalRuleAsync_Returns_False_WhenNotOwnedByUser()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;

        var rule = new FiscalRule
        {
            Id = "fr-1",
            UserId = "user-2",
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            MealAllowance = 20m,
            MealVoucherContribution = 6m,
            RemoteWorkAllowance = 2.5m,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FiscalRules.Add(rule);
        await db.SaveChangesAsync();

        // Act
        var result = await service.DeleteFiscalRuleAsync("user-1", "fr-1");

        // Assert
        Assert.False(result);
    }
}
