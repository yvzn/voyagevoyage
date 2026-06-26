using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Stores and retrieves booking confirmation files linked to a trip.
/// Binary files are stored in Azure Blob Storage; metadata in PostgreSQL.
/// </summary>
public interface IBookingConfirmationService
{
    Task<BookingConfirmation?> UploadForTripAsync(string tripId, IFormFile file);

    Task<IReadOnlyList<BookingConfirmation>> GetAllByTripAsync(string tripId);

    Task<(Stream Content, string ContentType, string FileName)?> DownloadAsync(string id);

    Task<bool> DeleteAsync(string id);
}
