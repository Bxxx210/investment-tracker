using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IStockTransactionService
{
    IEnumerable<StockTransaction> GetAll();
    StockTransaction? GetById(int id);
    StockTransaction Create(StockTransaction transaction);
    StockTransaction? Update(int id, StockTransaction transaction);
    bool Delete(int id);
}

public class StockTransactionService : IStockTransactionService
{
    private readonly ApplicationDbContext _dbContext;

    public StockTransactionService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IEnumerable<StockTransaction> GetAll()
    {
        return _dbContext.StockTransactions
            .AsNoTracking()
            .OrderBy(x => x.Date)
            .ThenBy(x => x.Id)
            .ToArray();
    }

    public StockTransaction? GetById(int id)
    {
        return _dbContext.StockTransactions
            .AsNoTracking()
            .FirstOrDefault(x => x.Id == id);
    }

    public StockTransaction Create(StockTransaction transaction)
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
        _dbContext.SaveChanges();
        return created;
    }

    public StockTransaction? Update(int id, StockTransaction transaction)
    {
        Validate(transaction);

        var existing = _dbContext.StockTransactions.FirstOrDefault(x => x.Id == id);
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

        _dbContext.SaveChanges();
        return existing;
    }

    public bool Delete(int id)
    {
        var existing = _dbContext.StockTransactions.FirstOrDefault(x => x.Id == id);
        if (existing is null)
        {
            return false;
        }

        _dbContext.StockTransactions.Remove(existing);
        _dbContext.SaveChanges();
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
