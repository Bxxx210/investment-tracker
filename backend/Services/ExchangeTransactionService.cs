using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IExchangeTransactionService
{
    IEnumerable<ExchangeTransaction> GetAll();
    ExchangeTransaction? GetById(int id);
    ExchangeTransaction Create(ExchangeTransaction transaction);
    ExchangeTransaction? Update(int id, ExchangeTransaction transaction);
    bool Delete(int id);
}

public class ExchangeTransactionService : IExchangeTransactionService
{
    private readonly ApplicationDbContext _dbContext;

    public ExchangeTransactionService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IEnumerable<ExchangeTransaction> GetAll()
    {
        return _dbContext.ExchangeTransactions
            .AsNoTracking()
            .OrderBy(x => x.Date)
            .ThenBy(x => x.Id)
            .ToArray();
    }

    public ExchangeTransaction? GetById(int id)
    {
        return _dbContext.ExchangeTransactions
            .AsNoTracking()
            .FirstOrDefault(x => x.Id == id);
    }

    public ExchangeTransaction Create(ExchangeTransaction transaction)
    {
        Validate(transaction);

        var created = new ExchangeTransaction
        {
            Date = transaction.Date,
            ThbAmount = transaction.ThbAmount,
            ForeignAmount = transaction.ForeignAmount,
            Currency = NormalizeCurrency(transaction.Currency),
            Rate = transaction.Rate,
            Note = transaction.Note
        };

        _dbContext.ExchangeTransactions.Add(created);
        _dbContext.SaveChanges();
        return created;
    }

    public ExchangeTransaction? Update(int id, ExchangeTransaction transaction)
    {
        Validate(transaction);

        var existing = _dbContext.ExchangeTransactions.FirstOrDefault(x => x.Id == id);
        if (existing is null)
        {
            return null;
        }

        existing.Date = transaction.Date;
        existing.ThbAmount = transaction.ThbAmount;
        existing.ForeignAmount = transaction.ForeignAmount;
        existing.Currency = NormalizeCurrency(transaction.Currency);
        existing.Rate = transaction.Rate;
        existing.Note = transaction.Note;

        _dbContext.SaveChanges();
        return existing;
    }

    public bool Delete(int id)
    {
        var existing = _dbContext.ExchangeTransactions.FirstOrDefault(x => x.Id == id);
        if (existing is null)
        {
            return false;
        }

        _dbContext.ExchangeTransactions.Remove(existing);
        _dbContext.SaveChanges();
        return true;
    }

    private static void Validate(ExchangeTransaction transaction)
    {
        ArgumentNullException.ThrowIfNull(transaction);
        transaction.Currency = NormalizeCurrency(transaction.Currency);
    }

    private static string NormalizeCurrency(string? currency)
    {
        return string.IsNullOrWhiteSpace(currency) ? "USD" : currency.Trim().ToUpperInvariant();
    }
}
