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
            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.Date).HasColumnName("date");
            entity.Property(x => x.ThbAmount).HasColumnName("thb_amount");
            entity.Property(x => x.ForeignAmount).HasColumnName("foreign_amount");
            entity.Property(x => x.Currency).HasColumnName("currency").HasDefaultValue("USD");
            entity.Property(x => x.MidRate).HasColumnName("mid_rate");
            entity.Property(x => x.ActualRate).HasColumnName("actual_rate");
            entity.Property(x => x.Spread).HasColumnName("spread");
            entity.Property(x => x.Note).HasColumnName("note");
        });

        modelBuilder.Entity<StockTransaction>(entity =>
        {
            entity.ToTable("stock_transactions");
            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(x => x.ExecutedAt).HasColumnName("executed_at");
            entity.Property(x => x.Ticker).HasColumnName("ticker");
            entity.Property(x => x.Type).HasColumnName("type").HasConversion<int>();
            entity.Property(x => x.Quantity).HasColumnName("quantity");
            entity.Property(x => x.PriceUsd).HasColumnName("price_usd");
            entity.Property(x => x.FeeUsd).HasColumnName("fee_usd");
            entity.Property(x => x.VatUsd).HasColumnName("vat_usd");
            entity.Property(x => x.TotalCostUsd).HasColumnName("total_cost_usd");
            entity.Property(x => x.RateAtTrade).HasColumnName("rate_at_trade");
            entity.Property(x => x.PriceThb).HasColumnName("price_thb");
            entity.Property(x => x.Note).HasColumnName("note");
        });

        modelBuilder.Entity<TaxSummary>(entity =>
        {
            entity.ToTable("tax_summary");
            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetCreatedAtValues();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        SetCreatedAtValues();
        return base.SaveChanges();
    }

    private void SetCreatedAtValues()
    {
        var entries = ChangeTracker.Entries()
            .Where(entry =>
                entry.State == EntityState.Added &&
                (entry.Entity is ExchangeTransaction || entry.Entity is StockTransaction || entry.Entity is TaxSummary));

        foreach (var entry in entries)
        {
            var createdAtProperty = entry.Property(nameof(TaxSummary.CreatedAt));
            if (createdAtProperty.CurrentValue is DateTime currentValue && currentValue != default)
            {
                continue;
            }

            createdAtProperty.CurrentValue = DateTime.UtcNow;
        }
    }
}
