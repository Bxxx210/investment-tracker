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
            .OrderBy(x => x.Date)
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

        var created = new StockTransaction
        {
            Date = transaction.Date,
            Ticker = NormalizeTicker(transaction.Ticker),
            Type = transaction.Type,
            Quantity = transaction.Quantity,
            PriceForeign = transaction.PriceForeign,
            RateAtTrade = transaction.RateAtTrade,
            PriceThb = transaction.PriceThb,
            FeeForeign = transaction.FeeForeign,
            FeeThb = transaction.FeeThb,
            Note = transaction.Note
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

        existing.Date = transaction.Date;
        existing.Ticker = NormalizeTicker(transaction.Ticker);
        existing.Type = transaction.Type;
        existing.Quantity = transaction.Quantity;
        existing.PriceForeign = transaction.PriceForeign;
        existing.RateAtTrade = transaction.RateAtTrade;
        existing.PriceThb = transaction.PriceThb;
        existing.FeeForeign = transaction.FeeForeign;
        existing.FeeThb = transaction.FeeThb;
        existing.Note = transaction.Note;

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

    private static string NormalizeTicker(string? ticker)
    {
        return string.IsNullOrWhiteSpace(ticker) ? string.Empty : ticker.Trim().ToUpperInvariant();
    }
}
