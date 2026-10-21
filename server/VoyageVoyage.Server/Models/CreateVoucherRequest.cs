using System.ComponentModel.DataAnnotations;

namespace VoyageVoyage.Server.Models;

public class CreateVoucherRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Code { get; set; } = string.Empty;

    public required VoucherCategory Category { get; set; }

    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    public DateOnly? ExpirationDate { get; set; }
}
