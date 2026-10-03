using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public interface INoTravelDayService
{
    Task<List<NoTravelDay>> GetForCurrentUserAsync();
    Task<NoTravelDay> CreateAsync(NoTravelDayRequest request);
    Task<NoTravelDay?> UpdateAsync(string id, NoTravelDayRequest request);
    Task<bool> DeleteAsync(string id);
}
