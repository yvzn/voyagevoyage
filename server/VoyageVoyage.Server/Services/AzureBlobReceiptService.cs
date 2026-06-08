using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Authentication;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Azure Blob Storage + Cosmos DB implementation of <see cref="IReceiptService"/>.
/// Binary files are stored in Azure Blob Storage; metadata is stored in Cosmos DB.
/// All operations are scoped to the authenticated user.
/// </summary>
public class AzureBlobReceiptService(
    ApplicationDbContext db,
    BlobServiceClient blobServiceClient,
    ICurrentUserService currentUserService) : IReceiptService
{
    private const string ContainerName = "receipts";

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/tiff",
    };

    private string GetCurrentUserId()
    {
        var user = currentUserService.GetCurrentUser()
            ?? throw new InvalidOperationException("No authenticated user is available.");
        return user.Id;
    }

    private BlobContainerClient GetContainerClient()
        => blobServiceClient.GetBlobContainerClient(ContainerName);

    public async Task<Receipt?> UploadForExpenseAsync(string expenseId, IFormFile file)
    {
        var userId = GetCurrentUserId();

        var expense = await db.Expenses
            .Where(e => e.Id == expenseId && e.UserId == userId)
            .FirstOrDefaultAsync();

        if (expense is null)
            return null;

        return await UploadAsync(userId, ReceiptLinkedEntityType.Expense, expenseId, file);
    }

    public async Task<IReadOnlyList<Receipt>> GetAllByExpenseAsync(string expenseId)
    {
        var userId = GetCurrentUserId();
        return await db.Receipts
            .Where(r => r.LinkedEntityId == expenseId && r.LinkedEntityType == ReceiptLinkedEntityType.Expense && r.UserId == userId)
            .ToListAsync();
    }

    public async Task<(Stream Content, string ContentType, string FileName)?> DownloadAsync(string id)
    {
        var userId = GetCurrentUserId();
        var receipt = await db.Receipts
            .Where(r => r.Id == id && r.UserId == userId)
            .FirstOrDefaultAsync();

        if (receipt is null)
            return null;

        var container = GetContainerClient();
        var blob = container.GetBlobClient(receipt.BlobName);

        var download = await blob.DownloadStreamingAsync();
        return (download.Value.Content, receipt.ContentType, receipt.FileName);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var userId = GetCurrentUserId();
        var receipt = await db.Receipts
            .Where(r => r.Id == id && r.UserId == userId)
            .FirstOrDefaultAsync();

        if (receipt is null)
            return false;

        // Delete binary from blob storage first, then remove metadata from Cosmos DB.
        var container = GetContainerClient();
        var blob = container.GetBlobClient(receipt.BlobName);
        await blob.DeleteIfExistsAsync();

        db.Receipts.Remove(receipt);
        await db.SaveChangesAsync();
        return true;
    }

    private async Task<Receipt> UploadAsync(
        string userId,
        ReceiptLinkedEntityType entityType,
        string entityId,
        IFormFile file)
    {
        var contentType = file.ContentType;
        if (!AllowedContentTypes.Contains(contentType))
        {
            // Fall back to extension-based detection for browsers that omit Content-Type.
            contentType = GetContentTypeFromExtension(Path.GetExtension(file.FileName));
        }

        var blobName = $"{userId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        var container = GetContainerClient();
        await container.CreateIfNotExistsAsync(PublicAccessType.None);

        var blob = container.GetBlobClient(blobName);
        await using var stream = file.OpenReadStream();
        await blob.UploadAsync(stream, new BlobHttpHeaders { ContentType = contentType });

        var receipt = new Receipt
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            LinkedEntityType = entityType,
            LinkedEntityId = entityId,
            FileName = file.FileName,
            ContentType = contentType,
            BlobName = blobName,
            UploadedAt = DateTimeOffset.UtcNow,
        };

        db.Receipts.Add(receipt);
        await db.SaveChangesAsync();
        return receipt;
    }

    private static string GetContentTypeFromExtension(string extension)
        => extension.ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".tif" or ".tiff" => "image/tiff",
            _ => "application/octet-stream",
        };
}
