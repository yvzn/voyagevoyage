using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public class AzureBlobBookingConfirmationService(
    ApplicationDbContext db,
    BlobServiceClient blobServiceClient,
    ICurrentUserService currentUserService) : IBookingConfirmationService
{
    private const string ContainerName = "booking-confirmations";

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "text/calendar",
    };

    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    private BlobContainerClient GetContainerClient()
        => blobServiceClient.GetBlobContainerClient(ContainerName);

    public async Task<BookingConfirmation?> UploadForTripAsync(string tripId, IFormFile file)
    {
        var userId = GetCurrentUserId();

        var trip = await db.Trips
            .Where(t => t.Id == tripId && t.UserId == userId)
            .FirstOrDefaultAsync();

        if (trip is null)
            return null;

        var contentType = file.ContentType;
        if (!AllowedContentTypes.Contains(contentType))
            contentType = GetContentTypeFromExtension(Path.GetExtension(file.FileName));

        var uploadedAt = DateTimeOffset.UtcNow;
        var blobName = $"{userId}/{uploadedAt.Year}/{uploadedAt.Month:00}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        var container = GetContainerClient();
        await container.CreateIfNotExistsAsync(PublicAccessType.None);

        var blob = container.GetBlobClient(blobName);
        await using var stream = file.OpenReadStream();
        await blob.UploadAsync(stream, new BlobHttpHeaders { ContentType = contentType });

        var confirmation = new BookingConfirmation
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            TripId = tripId,
            Type = BookingConfirmationType.Train, // default; frontend sends the corrected type
            FileName = file.FileName,
            ContentType = contentType,
            BlobName = blobName,
            UploadedAt = uploadedAt,
        };

        db.BookingConfirmations.Add(confirmation);
        await db.SaveChangesAsync();
        return confirmation;
    }

    public async Task<IReadOnlyList<BookingConfirmation>> GetAllByTripAsync(string tripId)
    {
        var userId = GetCurrentUserId();
        return await db.BookingConfirmations
            .Where(c => c.TripId == tripId && c.UserId == userId)
            .ToListAsync();
    }

    public async Task<(Stream Content, string ContentType, string FileName)?> DownloadAsync(string id)
    {
        var userId = GetCurrentUserId();
        var confirmation = await db.BookingConfirmations
            .Where(c => c.Id == id && c.UserId == userId)
            .FirstOrDefaultAsync();

        if (confirmation is null)
            return null;

        var container = GetContainerClient();
        var blob = container.GetBlobClient(confirmation.BlobName);
        var download = await blob.DownloadStreamingAsync();
        return (download.Value.Content, confirmation.ContentType, confirmation.FileName);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var userId = GetCurrentUserId();
        var confirmation = await db.BookingConfirmations
            .Where(c => c.Id == id && c.UserId == userId)
            .FirstOrDefaultAsync();

        if (confirmation is null)
            return false;

        var container = GetContainerClient();
        var blob = container.GetBlobClient(confirmation.BlobName);
        await blob.DeleteIfExistsAsync();

        db.BookingConfirmations.Remove(confirmation);
        await db.SaveChangesAsync();
        return true;
    }

    private static string GetContentTypeFromExtension(string extension)
        => extension.ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".ics" => "text/calendar",
            _ => "application/octet-stream",
        };
}
