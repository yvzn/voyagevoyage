using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public interface IVoucherService
{
    Task<IEnumerable<Voucher>> GetUserVouchersAsync(string userId);

    Task<Voucher> CreateVoucherAsync(string userId, CreateVoucherRequest request);

    /// <exception cref="KeyNotFoundException">The voucher does not exist for this user.</exception>
    Task<Voucher> UpdateVoucherAsync(string userId, string id, UpdateVoucherRequest request);

    /// <exception cref="KeyNotFoundException">The voucher does not exist for this user.</exception>
    Task<Voucher> MarkVoucherAsUsedAsync(string userId, string id);

    Task<bool> DeleteVoucherAsync(string userId, string id);
}
