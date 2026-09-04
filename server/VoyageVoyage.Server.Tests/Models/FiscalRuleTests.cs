using Xunit;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Tests.Models;

public class FiscalRuleTests
{
    [Fact]
    public void EmployerMealVoucherSubsidy_UsesFaceValueAndEmployerPercentage()
    {
        // Arrange
        var fiscalRule = new FiscalRule
        {
            MealVoucherFaceValue = 10m,
            MealVoucherEmployerContributionPercentage = 60m,
        };

        // Act
        var result = fiscalRule.EmployerMealVoucherSubsidy;

        // Assert
        Assert.Equal(6m, result);
    }

    [Fact]
    public void CalculateMealNetDeductible_UsesMealAllowanceAndSubsidy()
    {
        // Arrange
        var fiscalRule = new FiscalRule
        {
            MealAllowance = 20m,
            MealVoucherFaceValue = 10m,
            MealVoucherEmployerContributionPercentage = 60m,
        };

        // Act
        var result = fiscalRule.CalculateMealNetDeductible(45m);

        // Assert
        Assert.Equal(19m, result);
    }

    [Fact]
    public void CalculateMealNetDeductible_DoesNotGoBelowZero()
    {
        // Arrange
        var fiscalRule = new FiscalRule
        {
            MealAllowance = 20m,
            MealVoucherFaceValue = 10m,
            MealVoucherEmployerContributionPercentage = 60m,
        };

        // Act
        var result = fiscalRule.CalculateMealNetDeductible(20m);

        // Assert
        Assert.Equal(0m, result);
    }

    [Fact]
    public void CountRemoteWorkEligibleDays_ExcludesWeekendsTripsLeaveAndPublicHolidays()
    {
        // Arrange
        var fiscalRule = new FiscalRule { RemoteWorkAllowance = 6m };
        var startDate = new DateOnly(2026, 3, 2);
        var endDate = new DateOnly(2026, 3, 8);

        var tripDates = new[]
        {
            new DateOnly(2026, 3, 3),
        };
        var leaveDates = new[]
        {
            new DateOnly(2026, 3, 4),
        };
        var publicHolidayDates = new[]
        {
            new DateOnly(2026, 3, 6),
        };

        // Act
        var result = fiscalRule.CountRemoteWorkEligibleDays(startDate, endDate, tripDates, leaveDates, publicHolidayDates);

        // Assert
        Assert.Equal(2, result);
    }

    [Fact]
    public void CalculateRemoteWorkAllowance_ComputesAllowanceFromEligibleDays()
    {
        // Arrange
        var fiscalRule = new FiscalRule { RemoteWorkAllowance = 12m };
        var startDate = new DateOnly(2026, 3, 2);
        var endDate = new DateOnly(2026, 3, 8);

        // Act
        var result = fiscalRule.CalculateRemoteWorkAllowance(
            startDate,
            endDate,
            tripDates: [new DateOnly(2026, 3, 3)],
            leaveDates: [new DateOnly(2026, 3, 4)],
            publicHolidayDates: [new DateOnly(2026, 3, 6)]);

        // Assert
        Assert.Equal(24m, result);
    }
}
