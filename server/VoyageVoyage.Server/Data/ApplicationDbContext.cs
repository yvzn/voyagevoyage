using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Data;

/// <summary>
/// EF Core database context for VoyageVoyage, backed by Azure Cosmos DB.
/// </summary>
public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Trip> Trips { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Trip>(entity =>
        {
            entity.ToContainer("trips");
            entity.HasPartitionKey(t => t.UserId);
            entity.HasKey(t => t.Id);
        });
    }
}
