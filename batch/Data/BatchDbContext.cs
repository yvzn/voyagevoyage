using batch.Models;
using Microsoft.EntityFrameworkCore;

namespace batch.Data;

public class BatchDbContext(DbContextOptions<BatchDbContext> options) : DbContext(options)
{
    public DbSet<PublicHoliday> PublicHolidays { get; set; }

    public DbSet<SchoolHoliday> SchoolHolidays { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PublicHoliday>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.HasIndex(h => h.UserId);
        });

        modelBuilder.Entity<SchoolHoliday>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.HasIndex(h => h.UserId);
        });
    }
}
