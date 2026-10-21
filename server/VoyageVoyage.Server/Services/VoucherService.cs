using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Services;

public class VoucherService(ApplicationDbContext dbContext) : IVoucherService
{
    public async Task<IEnumerable<Voucher>> GetUserVouchersAsync(string userId)
    {
        return await dbContext.Vouchers
            .Where(v => v.UserId == userId)
            .OrderBy(v => v.Category)
            .ThenBy(v => v.ExpirationDate == null)
            .ThenBy(v => v.ExpirationDate)
            .ThenBy(v => v.Code)
            .ToListAsync();
    }

    public async Task<Voucher> CreateVoucherAsync(string userId, CreateVoucherRequest request)
    {
        var voucher = new Voucher
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Code = request.Code.Trim(),
            Category = request.Category,
            Description = request.Description.Trim(),
            ExpirationDate = request.ExpirationDate,
            Status = VoucherStatus.Active,
        };

        dbContext.Vouchers.Add(voucher);
        await dbContext.SaveChangesAsync();

        return voucher;
    }

    public async Task<Voucher> UpdateVoucherAsync(string userId, string id, UpdateVoucherRequest request)
    {
        var voucher = await FindAsync(userId, id);

        voucher.Code = request.Code.Trim();
        voucher.Category = request.Category;
        voucher.Description = request.Description.Trim();
        voucher.ExpirationDate = request.ExpirationDate;

        await dbContext.SaveChangesAsync();

        return voucher;
    }

    public async Task<Voucher> MarkVoucherAsUsedAsync(string userId, string id)
    {
        var voucher = await FindAsync(userId, id);

        voucher.Status = VoucherStatus.Used;
        await dbContext.SaveChangesAsync();

        return voucher;
    }

    public async Task<bool> DeleteVoucherAsync(string userId, string id)
    {
        var voucher = await dbContext.Vouchers.FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
        if (voucher == null)
            return false;

        dbContext.Vouchers.Remove(voucher);
        await dbContext.SaveChangesAsync();

        return true;
    }

    private async Task<Voucher> FindAsync(string userId, string id)
    {
        return await dbContext.Vouchers.FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId)
            ?? throw new KeyNotFoundException($"Voucher with id {id} not found.");
    }
}
