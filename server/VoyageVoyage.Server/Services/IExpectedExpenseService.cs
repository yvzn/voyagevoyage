using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public interface IExpectedExpenseService
{
    Task<ExpectedExpensesResponse?> GetForTripAsync(string tripId);
}
