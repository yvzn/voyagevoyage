using Microsoft.EntityFrameworkCore;
using Xunit;
using VoyageVoyage.Server.Data;
using VoyageVoyage.Server.Models;
using VoyageVoyage.Server.Services;

namespace VoyageVoyage.Server.Tests.Services;

public class VoucherServiceTests
{
    private static (VoucherService service, ApplicationDbContext db) CreateService()
    {
        var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new ApplicationDbContext(dbOptions);
        return (new VoucherService(db), db);
    }

    [Fact]
    public async Task CreateVoucherAsync_PersistsTrimmedActiveVoucher()
    {
        var (service, db) = CreateService();

        var created = await service.CreateVoucherAsync("user-1", new CreateVoucherRequest
        {
            Code = "  TRAIN10 ",
            Category = VoucherCategory.Train,
            Description = " 10% off ",
            ExpirationDate = new DateOnly(2099, 12, 31),
        });

        var stored = await db.Vouchers.SingleAsync();
        Assert.Equal(created.Id, stored.Id);
        Assert.Equal("user-1", stored.UserId);
        Assert.Equal("TRAIN10", stored.Code);
        Assert.Equal("10% off", stored.Description);
        Assert.Equal(VoucherStatus.Active, stored.Status);
    }

    [Fact]
    public async Task GetUserVouchersAsync_ReturnsOnlyCurrentUserVouchers()
    {
        var (service, _) = CreateService();
        await service.CreateVoucherAsync("user-1", new CreateVoucherRequest { Code = "A", Category = VoucherCategory.Train });
        await service.CreateVoucherAsync("user-2", new CreateVoucherRequest { Code = "B", Category = VoucherCategory.Hotel });

        var vouchers = (await service.GetUserVouchersAsync("user-1")).ToList();

        Assert.Single(vouchers);
        Assert.Equal("A", vouchers[0].Code);
    }

    [Fact]
    public async Task UpdateVoucherAsync_UpdatesFields()
    {
        var (service, _) = CreateService();
        var created = await service.CreateVoucherAsync("user-1", new CreateVoucherRequest { Code = "A", Category = VoucherCategory.Train });

        var updated = await service.UpdateVoucherAsync("user-1", created.Id, new UpdateVoucherRequest
        {
            Code = "B",
            Category = VoucherCategory.Hotel,
            Description = "desc",
            ExpirationDate = new DateOnly(2030, 1, 1),
        });

        Assert.Equal("B", updated.Code);
        Assert.Equal(VoucherCategory.Hotel, updated.Category);
        Assert.Equal(new DateOnly(2030, 1, 1), updated.ExpirationDate);
    }

    [Fact]
    public async Task UpdateVoucherAsync_OtherUsersVoucher_ThrowsKeyNotFound()
    {
        var (service, _) = CreateService();
        var created = await service.CreateVoucherAsync("user-1", new CreateVoucherRequest { Code = "A", Category = VoucherCategory.Train });

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.UpdateVoucherAsync("user-2", created.Id, new UpdateVoucherRequest { Code = "X", Category = VoucherCategory.Train }));
    }

    [Fact]
    public async Task MarkVoucherAsUsedAsync_SetsUsedStatus()
    {
        var (service, db) = CreateService();
        var created = await service.CreateVoucherAsync("user-1", new CreateVoucherRequest { Code = "A", Category = VoucherCategory.Train });

        await service.MarkVoucherAsUsedAsync("user-1", created.Id);

        Assert.Equal(VoucherStatus.Used, (await db.Vouchers.SingleAsync()).Status);
    }

    [Fact]
    public async Task DeleteVoucherAsync_RemovesOnlyOwnVoucher()
    {
        var (service, db) = CreateService();
        var created = await service.CreateVoucherAsync("user-1", new CreateVoucherRequest { Code = "A", Category = VoucherCategory.Train });

        Assert.False(await service.DeleteVoucherAsync("user-2", created.Id));
        Assert.True(await service.DeleteVoucherAsync("user-1", created.Id));
        Assert.Empty(db.Vouchers);
    }
}
