using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// Represents a receipt (justificatif) file linked to an expense or a trip.
/// Metadata is stored in Cosmos DB; the binary file is stored in Azure Blob Storage.
/// </summary>
public class Receipt
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// The identifier of the user who owns this receipt.
    /// Used to scope receipts to the authenticated user. Not exposed in the API response.
    /// </summary>
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    /// <summary>Whether this receipt is linked to an expense or a trip.</summary>
    public ReceiptLinkedEntityType LinkedEntityType { get; set; }

    /// <summary>The identifier of the linked expense or trip.</summary>
    public string LinkedEntityId { get; set; } = string.Empty;

    /// <summary>The original file name as provided by the uploader.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>The MIME content type of the file (e.g. "application/pdf", "image/jpeg").</summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>The blob name used to store the file in Azure Blob Storage.</summary>
    [JsonIgnore]
    public string BlobName { get; set; } = string.Empty;

    /// <summary>The UTC timestamp when the receipt was uploaded.</summary>
    public DateTimeOffset UploadedAt { get; set; }
}
