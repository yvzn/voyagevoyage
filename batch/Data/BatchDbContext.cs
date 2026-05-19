using batch.Models;
using Microsoft.EntityFrameworkCore;

namespace batch.Data;

/// <summary>
/// Minimal EF Core Cosmos DB context for the batch project.
/// Exposes the containers needed for batch imports.
/// </summary>
public class BatchDbContext(DbContextOptions<BatchDbContext> options) : DbContext(options)
{
    public const string DatabaseName = "voyagevoyage";
    public const string PublicHolidaysContainerName = "public-holidays";
    public const string SchoolHolidaysContainerName = "school-holidays";

    public DbSet<PublicHoliday> PublicHolidays { get; set; }

    public DbSet<SchoolHoliday> SchoolHolidays { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PublicHoliday>(entity =>
        {
            entity.ToContainer(PublicHolidaysContainerName);
            entity.HasPartitionKey(h => h.UserId);
            entity.HasKey(h => h.Id);
        });

        modelBuilder.Entity<SchoolHoliday>(entity =>
        {
            entity.ToContainer(SchoolHolidaysContainerName);
            entity.HasPartitionKey(h => h.UserId);
            entity.HasKey(h => h.Id);
        });
    }
}
