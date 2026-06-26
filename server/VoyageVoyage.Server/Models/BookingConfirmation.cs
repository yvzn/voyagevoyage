using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

/// <summary>
/// A booking confirmation file (e.g. SNCF/Trainline .ics or PDF) linked to a trip.
/// Stored separately from receipts (justificatifs).
/// Metadata in PostgreSQL; binary file in Azure Blob Storage.
/// </summary>
public class BookingConfirmation
{
    public string Id { get; set; } = string.Empty;

    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public string TripId { get; set; } = string.Empty;

    public BookingConfirmationType Type { get; set; }

    public string? ProviderName { get; set; }

    public string? Reference { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    [JsonIgnore]
    public string BlobName { get; set; } = string.Empty;

    public DateTimeOffset UploadedAt { get; set; }
}
