using Microsoft.EntityFrameworkCore;
using VoyageVoyage.Server.Models;

namespace VoyageVoyage.Server.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Trip> Trips { get; set; }
    public DbSet<TravelConstraints> TravelConstraints { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<PublicHoliday> PublicHolidays { get; set; }
    public DbSet<SchoolHoliday> SchoolHolidays { get; set; }
    public DbSet<PersonalLeave> PersonalLeaves { get; set; }
    public DbSet<Receipt> Receipts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Trip>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.UserId);
            entity.OwnsOne(t => t.TrainBooking, b => b.ToJson());
            entity.OwnsOne(t => t.HotelBooking, b => b.ToJson());
        });

        modelBuilder.Entity<TravelConstraints>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.UserId);
        });

        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
        });

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

        modelBuilder.Entity<PersonalLeave>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.HasIndex(l => l.UserId);
        });

        modelBuilder.Entity<Receipt>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.UserId);
        });
    }
}
