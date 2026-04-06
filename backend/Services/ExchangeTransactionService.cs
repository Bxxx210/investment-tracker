using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IExchangeTransactionService
{
    Task<IEnumerable<ExchangeTransaction>> GetAllAsync();
    Task<ExchangeTransaction?> GetByIdAsync(int id);
    Task<ExchangeTransaction> CreateAsync(ExchangeTransaction transaction);
    Task<ExchangeTransaction?> UpdateAsync(int id, ExchangeTransaction transaction);
    Task<bool> DeleteAsync(int id);
}

public class ExchangeTransactionService : IExchangeTransactionService
{
    private readonly ApplicationDbContext _dbContext;

    public ExchangeTransactionService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<ExchangeTransaction>> GetAllAsync()
    {
        return await _dbContext.ExchangeTransactions
            .AsNoTracking()
            .OrderBy(x => x.Date)
            .ThenBy(x => x.Id)
            .ToListAsync();
    }

    public async Task<ExchangeTransaction?> GetByIdAsync(int id)
    {
        return await _dbContext.ExchangeTransactions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<ExchangeTransaction> CreateAsync(ExchangeTransaction transaction)
    {
        Validate(transaction);
        NormalizeRates(transaction);
        var created = new ExchangeTransaction
        {
            Date = transaction.Date,
            ThbAmount = transaction.ThbAmount,
            ForeignAmount = transaction.ForeignAmount,
            Currency = transaction.Currency,
            MidRate = transaction.MidRate,
            ActualRate = transaction.ActualRate,
            Spread = transaction.Spread,
            Note = transaction.Note
        };

        _dbContext.ExchangeTransactions.Add(created);
        await _dbContext.SaveChangesAsync();
        return created;
    }

    public async Task<ExchangeTransaction?> UpdateAsync(int id, ExchangeTransaction transaction)
    {
        Validate(transaction);

        var existing = await _dbContext.ExchangeTransactions.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return null;
        }

        NormalizeRates(transaction);
        existing.Date = transaction.Date;
        existing.ThbAmount = transaction.ThbAmount;
        existing.ForeignAmount = transaction.ForeignAmount;
        existing.Currency = transaction.Currency;
        existing.MidRate = transaction.MidRate;
        existing.ActualRate = transaction.ActualRate;
        existing.Spread = transaction.Spread;
        existing.Note = transaction.Note;

        await _dbContext.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _dbContext.ExchangeTransactions.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return false;
        }

        _dbContext.ExchangeTransactions.Remove(existing);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static void Validate(ExchangeTransaction transaction)
    {
        ArgumentNullException.ThrowIfNull(transaction);
        transaction.Currency = NormalizeCurrency(transaction.Currency);
    }

    private static void NormalizeRates(ExchangeTransaction transaction)
    {
        var midRate = transaction.MidRate;
        var actualRate = transaction.ActualRate;

        transaction.MidRate = midRate;
        transaction.ActualRate = actualRate;
        transaction.Spread = midRate.HasValue
            ? actualRate - midRate.Value
            : null;
    }

    private static string NormalizeCurrency(string? currency)
    {
        return string.IsNullOrWhiteSpace(currency) ? "USD" : currency.Trim().ToUpperInvariant();
    }
}
