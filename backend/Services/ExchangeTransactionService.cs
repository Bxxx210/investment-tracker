using backend.Models;

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
    private readonly List<ExchangeTransaction> _transactions = [];
    private readonly object _lock = new();
    private int _nextId = 1;

    public IEnumerable<ExchangeTransaction> GetAll()
    {
        lock (_lock)
        {
            return _transactions
                .OrderBy(x => x.Date)
                .ThenBy(x => x.Id)
                .Select(Clone)
                .ToArray();
        }
    }

    public ExchangeTransaction? GetById(int id)
    {
        lock (_lock)
        {
            var transaction = _transactions.FirstOrDefault(x => x.Id == id);
            return transaction is null ? null : Clone(transaction);
        }
    }

    public ExchangeTransaction Create(ExchangeTransaction transaction)
    {
        Validate(transaction);

        lock (_lock)
        {
            var created = Clone(transaction);
            created.Id = _nextId++;
            created.Currency = NormalizeCurrency(created.Currency);
            _transactions.Add(created);
            return Clone(created);
        }
    }

    public ExchangeTransaction? Update(int id, ExchangeTransaction transaction)
    {
        Validate(transaction);

        lock (_lock)
        {
            var existing = _transactions.FirstOrDefault(x => x.Id == id);
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

            return Clone(existing);
        }
    }

    public bool Delete(int id)
    {
        lock (_lock)
        {
            var existing = _transactions.FirstOrDefault(x => x.Id == id);
            if (existing is null)
            {
                return false;
            }

            _transactions.Remove(existing);
            return true;
        }
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

    private static ExchangeTransaction Clone(ExchangeTransaction transaction)
    {
        return new ExchangeTransaction
        {
            Id = transaction.Id,
            Date = transaction.Date,
            ThbAmount = transaction.ThbAmount,
            ForeignAmount = transaction.ForeignAmount,
            Currency = transaction.Currency,
            Rate = transaction.Rate,
            Note = transaction.Note
        };
    }
}
