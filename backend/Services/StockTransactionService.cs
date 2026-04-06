using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IStockTransactionService
{
    Task<IEnumerable<StockTransaction>> GetAllAsync();
    Task<StockTransaction?> GetByIdAsync(int id);
    Task<StockTransaction> CreateAsync(StockTransaction transaction);
    Task<StockTransaction?> UpdateAsync(int id, StockTransaction transaction);
    Task<bool> DeleteAsync(int id);
}

public class StockTransactionService : IStockTransactionService
{
    private readonly ApplicationDbContext _dbContext;

    public StockTransactionService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<StockTransaction>> GetAllAsync()
    {
        return await _dbContext.StockTransactions
            .AsNoTracking()
            .OrderBy(x => x.ExecutedAt)
            .ThenBy(x => x.Id)
            .ToListAsync();
    }

    public async Task<StockTransaction?> GetByIdAsync(int id)
    {
        return await _dbContext.StockTransactions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<StockTransaction> CreateAsync(StockTransaction transaction)
    {
        Validate(transaction);
        var normalized = NormalizeStockTransaction(transaction);

        var created = new StockTransaction
        {
            ExecutedAt = normalized.ExecutedAt,
            Ticker = normalized.Ticker,
            Type = normalized.Type,
            Quantity = normalized.Quantity,
            PriceUsd = normalized.PriceUsd,
            FeeUsd = normalized.FeeUsd,
            VatUsd = normalized.VatUsd,
            TotalCostUsd = normalized.TotalCostUsd,
            RateAtTrade = normalized.RateAtTrade,
            PriceThb = normalized.PriceThb,
            Note = normalized.Note
        };

        _dbContext.StockTransactions.Add(created);
        await _dbContext.SaveChangesAsync();
        return created;
    }

    public async Task<StockTransaction?> UpdateAsync(int id, StockTransaction transaction)
    {
        Validate(transaction);

        var existing = await _dbContext.StockTransactions.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return null;
        }

        var normalized = NormalizeStockTransaction(transaction);
        existing.ExecutedAt = normalized.ExecutedAt;
        existing.Ticker = normalized.Ticker;
        existing.Type = normalized.Type;
        existing.Quantity = normalized.Quantity;
        existing.PriceUsd = normalized.PriceUsd;
        existing.FeeUsd = normalized.FeeUsd;
        existing.VatUsd = normalized.VatUsd;
        existing.TotalCostUsd = normalized.TotalCostUsd;
        existing.RateAtTrade = normalized.RateAtTrade;
        existing.PriceThb = normalized.PriceThb;
        existing.Note = normalized.Note;

        await _dbContext.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _dbContext.StockTransactions.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return false;
        }

        _dbContext.StockTransactions.Remove(existing);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static void Validate(StockTransaction transaction)
    {
        ArgumentNullException.ThrowIfNull(transaction);
        transaction.Ticker = NormalizeTicker(transaction.Ticker);
    }

    private static StockTransaction NormalizeStockTransaction(StockTransaction transaction)
    {
        var executedAt = transaction.ExecutedAt == default
            ? DateTime.Now
            : transaction.ExecutedAt;

        var totalCostUsd = transaction.TotalCostUsd;
        if (totalCostUsd <= 0)
        {
            totalCostUsd = (transaction.PriceUsd * transaction.Quantity)
                + transaction.FeeUsd
                + transaction.VatUsd;
        }

        var priceThb = transaction.PriceThb;
        if (transaction.RateAtTrade.HasValue)
        {
            priceThb = totalCostUsd * transaction.RateAtTrade.Value;
        }

        return new StockTransaction
        {
            ExecutedAt = executedAt,
            Ticker = NormalizeTicker(transaction.Ticker),
            Type = transaction.Type,
            Quantity = transaction.Quantity,
            PriceUsd = transaction.PriceUsd,
            FeeUsd = transaction.FeeUsd,
            VatUsd = transaction.VatUsd,
            TotalCostUsd = totalCostUsd,
            RateAtTrade = transaction.RateAtTrade,
            PriceThb = priceThb,
            Note = transaction.Note
        };
    }

    private static string NormalizeTicker(string? ticker)
    {
        return string.IsNullOrWhiteSpace(ticker) ? string.Empty : ticker.Trim().ToUpperInvariant();
    }
}
