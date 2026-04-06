using backend.Models;

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
    private readonly List<StockTransaction> _transactions = [];
    private readonly object _lock = new();
    private int _nextId = 1;

    public IEnumerable<StockTransaction> GetAll()
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

    public StockTransaction? GetById(int id)
    {
        lock (_lock)
        {
            var transaction = _transactions.FirstOrDefault(x => x.Id == id);
            return transaction is null ? null : Clone(transaction);
        }
    }

    public StockTransaction Create(StockTransaction transaction)
    {
        Validate(transaction);

        lock (_lock)
        {
            var created = Clone(transaction);
            created.Id = _nextId++;
            created.Ticker = NormalizeTicker(created.Ticker);
            _transactions.Add(created);
            return Clone(created);
        }
    }

    public StockTransaction? Update(int id, StockTransaction transaction)
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
            existing.Ticker = NormalizeTicker(transaction.Ticker);
            existing.Type = transaction.Type;
            existing.Quantity = transaction.Quantity;
            existing.PriceForeign = transaction.PriceForeign;
            existing.RateAtTrade = transaction.RateAtTrade;
            existing.PriceThb = transaction.PriceThb;
            existing.FeeForeign = transaction.FeeForeign;
            existing.FeeThb = transaction.FeeThb;
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

    private static void Validate(StockTransaction transaction)
    {
        ArgumentNullException.ThrowIfNull(transaction);
        transaction.Ticker = NormalizeTicker(transaction.Ticker);
    }

    private static string NormalizeTicker(string? ticker)
    {
        return string.IsNullOrWhiteSpace(ticker) ? string.Empty : ticker.Trim().ToUpperInvariant();
    }

    private static StockTransaction Clone(StockTransaction transaction)
    {
        return new StockTransaction
        {
            Id = transaction.Id,
            Date = transaction.Date,
            Ticker = transaction.Ticker,
            Type = transaction.Type,
            Quantity = transaction.Quantity,
            PriceForeign = transaction.PriceForeign,
            RateAtTrade = transaction.RateAtTrade,
            PriceThb = transaction.PriceThb,
            FeeForeign = transaction.FeeForeign,
            FeeThb = transaction.FeeThb,
            Note = transaction.Note
        };
    }
}
