using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ExchangeTransaction> ExchangeTransactions => Set<ExchangeTransaction>();

    public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();

    public DbSet<TaxSummary> TaxSummaries => Set<TaxSummary>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ตั้งค่าคอลัมน์และชนิดข้อมูลให้สอดคล้องกับกฎของแต่ละตาราง
        modelBuilder.Entity<ExchangeTransaction>(entity =>
        {
            entity.ToTable("exchange_transactions");
            entity.Property(x => x.Currency).HasDefaultValue("USD");
        });

        modelBuilder.Entity<StockTransaction>(entity =>
        {
            entity.ToTable("stock_transactions");
            entity.Property(x => x.Type).HasConversion<int>();
        });

        modelBuilder.Entity<TaxSummary>(entity =>
        {
            entity.ToTable("tax_summary");
        });
    }
}
