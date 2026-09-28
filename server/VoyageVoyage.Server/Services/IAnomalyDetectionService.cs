using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public interface IAnomalyDetectionService
{
    Task<IReadOnlyList<AnomalyAlert>> AnalyzePastTripsAsync(DateTime? evaluationDate = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AnomalyAlert>> AnalyzePastTripsForUserAsync(string userId, DateTime? evaluationDate = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AnomalyAlert>> AnalyzeTripAsync(string tripId, DateTime? evaluationDate = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AnomalyAlert>> AnalyzeTripAsync(string userId, string tripId, DateTime? evaluationDate = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AnomalyAlert>> GetAlertsAsync(AlertStatus? status = null, CancellationToken cancellationToken = default);
    Task<AnomalyAlert?> UpdateAlertStatusAsync(string alertId, AlertStatus status, CancellationToken cancellationToken = default);
}
