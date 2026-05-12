using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Data;

/// <summary>
/// EF Core database context for VoyageVoyage, backed by Azure Cosmos DB.
/// </summary>
public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public const string DatabaseName = "voyagevoyage";
    public const string TripsContainerName = "trips";
    public const string TravelConstraintsContainerName = "travel-constraints";
    public const string ExpensesContainerName = "expenses";
    public const string PublicHolidaysContainerName = "public-holidays";

    public DbSet<Trip> Trips { get; set; }

    public DbSet<TravelConstraints> TravelConstraints { get; set; }

    public DbSet<Expense> Expenses { get; set; }

    public DbSet<PublicHoliday> PublicHolidays { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Trip>(entity =>
        {
            entity.ToContainer(TripsContainerName);
            entity.HasPartitionKey(t => t.UserId);
            entity.HasKey(t => t.Id);
        });

        modelBuilder.Entity<TravelConstraints>(entity =>
        {
            entity.ToContainer(TravelConstraintsContainerName);
            entity.HasPartitionKey(c => c.UserId);
            entity.HasKey(c => c.Id);
        });

        modelBuilder.Entity<Expense>(entity =>
        {
            entity.ToContainer(ExpensesContainerName);
            entity.HasPartitionKey(e => e.UserId);
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<PublicHoliday>(entity =>
        {
            entity.ToContainer(PublicHolidaysContainerName);
            entity.HasPartitionKey(h => h.UserId);
            entity.HasKey(h => h.Id);
        });
    }
}
