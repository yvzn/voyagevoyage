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
}
