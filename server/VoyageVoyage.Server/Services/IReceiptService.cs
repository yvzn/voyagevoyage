using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

/// <summary>
/// Provides operations for uploading, listing, and deleting receipts (justificatifs).
/// File binaries are stored in Azure Blob Storage; metadata is persisted in Cosmos DB.
/// </summary>
public interface IReceiptService
{
    /// <summary>
    /// Uploads a receipt and associates it with an existing expense.
    /// Returns null if the expense does not exist or does not belong to the current user.
    /// </summary>
    Task<Receipt?> UploadForExpenseAsync(string expenseId, IFormFile file);

    /// <summary>Returns all receipts linked to the given expense (scoped to current user).</summary>
    Task<IReadOnlyList<Receipt>> GetAllByExpenseAsync(string expenseId);

    /// <summary>
    /// Downloads the binary content of a receipt by its id.
    /// Returns null if the receipt is not found or does not belong to the current user.
    /// The tuple contains the file stream, content type, and original file name.
    /// </summary>
    Task<(Stream Content, string ContentType, string FileName)?> DownloadAsync(string id);

    /// <summary>
    /// Deletes a receipt by its id (scoped to current user).
    /// Returns true if found and deleted.
    /// </summary>
    Task<bool> DeleteAsync(string id);
}
