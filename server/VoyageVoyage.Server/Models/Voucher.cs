using System.Text.Json.Serialization;

namespace VoyageVoyage.Server.Models;

public enum VoucherCategory
{
    Train,
    Hotel,
}

public enum VoucherStatus
{
    Active,
    Used,
}

/// <summary>
/// A voucher or promotional code owned by a user.
/// This class is used both as the EF Core entity and as the API response contract.
/// Expiration is derived from <see cref="ExpirationDate"/> and is never stored as a status.
/// </summary>
public class Voucher
{
    public string Id { get; set; } = string.Empty;

    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public VoucherCategory Category { get; set; }

    public string Description { get; set; } = string.Empty;

    public DateOnly? ExpirationDate { get; set; }

    public VoucherStatus Status { get; set; } = VoucherStatus.Active;
}
