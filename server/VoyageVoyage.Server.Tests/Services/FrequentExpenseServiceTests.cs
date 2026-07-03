using Microsoft.EntityFrameworkCore;
using Xunit;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Tests.Services;

public class FrequentExpenseServiceTests
{
    private static (FrequentExpenseService service, ApplicationDbContext db) CreateService()
    {
        var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new ApplicationDbContext(dbOptions);
        var service = new FrequentExpenseService(db);
        return (service, db);
    }

    [Fact]
    public async Task GetUserFrequentExpensesAsync_Returns_OnlyCurrentUserExpenses()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;
        
        var expense1 = new FrequentExpense
        {
            Id = "fe-1",
            UserId = "user-1",
            Category = ExpenseCategory.Meal,
            Amount = 50m,
            Description = "Restaurant",
            CreatedAt = now,
            UpdatedAt = now
        };

        var expense2 = new FrequentExpense
        {
            Id = "fe-2",
            UserId = "user-2",
            Category = ExpenseCategory.MetroBus,
            Amount = 30m,
            Description = "Taxi",
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FrequentExpenses.Add(expense1);
        db.FrequentExpenses.Add(expense2);
        await db.SaveChangesAsync();

        // Act
        var result = await service.GetUserFrequentExpensesAsync("user-1");

        // Assert
        Assert.Single(result);
        Assert.Equal("fe-1", result.First().Id);
        Assert.Equal("user-1", result.First().UserId);
    }

    [Fact]
    public async Task CreateFrequentExpenseAsync_Creates_NewExpense()
    {
        // Arrange
        var (service, db) = CreateService();
        var request = new CreateFrequentExpenseRequest
        {
            Category = ExpenseCategory.Hotel,
            Amount = 100m,
            Description = "Hotel"
        };

        // Act
        var result = await service.CreateFrequentExpenseAsync("user-1", request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(ExpenseCategory.Hotel, result.Category);
        Assert.Equal(100m, result.Amount);
        Assert.Equal("Hotel", result.Description);
        Assert.Equal("user-1", result.UserId);

        var saved = await db.FrequentExpenses.FindAsync(result.Id);
        Assert.NotNull(saved);
    }

    [Fact]
    public async Task UpdateFrequentExpenseAsync_Updates_ExistingExpense()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;
        
        var expense = new FrequentExpense
        {
            Id = "fe-1",
            UserId = "user-1",
            Category = ExpenseCategory.Meal,
            Amount = 50m,
            Description = "Restaurant",
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FrequentExpenses.Add(expense);
        await db.SaveChangesAsync();

        var updateRequest = new UpdateFrequentExpenseRequest
        {
            Category = ExpenseCategory.Other,
            Amount = 75m,
            Description = "Cinema"
        };

        // Act
        var result = await service.UpdateFrequentExpenseAsync("user-1", "fe-1", updateRequest);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(ExpenseCategory.Other, result.Category);
        Assert.Equal(75m, result.Amount);
        Assert.Equal("Cinema", result.Description);
    }

    [Fact]
    public async Task UpdateFrequentExpenseAsync_Throws_WhenExpenseNotFound()
    {
        // Arrange
        var (service, _) = CreateService();
        var updateRequest = new UpdateFrequentExpenseRequest
        {
            Category = ExpenseCategory.Other,
            Amount = 75m,
            Description = "Cinema"
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.UpdateFrequentExpenseAsync("user-1", "non-existent", updateRequest));
    }

    [Fact]
    public async Task UpdateFrequentExpenseAsync_Throws_WhenNotOwnedByUser()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;
        
        var expense = new FrequentExpense
        {
            Id = "fe-1",
            UserId = "user-2",
            Category = ExpenseCategory.Meal,
            Amount = 50m,
            Description = "Restaurant",
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FrequentExpenses.Add(expense);
        await db.SaveChangesAsync();

        var updateRequest = new UpdateFrequentExpenseRequest
        {
            Category = ExpenseCategory.Other,
            Amount = 75m,
            Description = "Cinema"
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.UpdateFrequentExpenseAsync("user-1", "fe-1", updateRequest));
    }

    [Fact]
    public async Task DeleteFrequentExpenseAsync_Deletes_ExistingExpense()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;
        
        var expense = new FrequentExpense
        {
            Id = "fe-1",
            UserId = "user-1",
            Category = ExpenseCategory.Meal,
            Amount = 50m,
            Description = "Restaurant",
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FrequentExpenses.Add(expense);
        await db.SaveChangesAsync();

        // Act
        var result = await service.DeleteFrequentExpenseAsync("user-1", "fe-1");

        // Assert
        Assert.True(result);
        var deleted = await db.FrequentExpenses.FindAsync("fe-1");
        Assert.Null(deleted);
    }

    [Fact]
    public async Task DeleteFrequentExpenseAsync_Returns_False_WhenExpenseNotFound()
    {
        // Arrange
        var (service, _) = CreateService();

        // Act
        var result = await service.DeleteFrequentExpenseAsync("user-1", "non-existent");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteFrequentExpenseAsync_Returns_False_WhenNotOwnedByUser()
    {
        // Arrange
        var (service, db) = CreateService();
        var now = DateTime.UtcNow;
        
        var expense = new FrequentExpense
        {
            Id = "fe-1",
            UserId = "user-2",
            Category = ExpenseCategory.Meal,
            Amount = 50m,
            Description = "Restaurant",
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FrequentExpenses.Add(expense);
        await db.SaveChangesAsync();

        // Act
        var result = await service.DeleteFrequentExpenseAsync("user-1", "fe-1");

        // Assert
        Assert.False(result);
    }
}
