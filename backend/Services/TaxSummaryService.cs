using backend.Models;

namespace backend.Services;

public interface ITaxSummaryService
{
    IEnumerable<TaxSummary> GetAll();
    TaxSummary? GetById(int id);
    TaxSummary Create(TaxSummary summary);
    TaxSummary? Update(int id, TaxSummary summary);
    bool Delete(int id);
}

public class TaxSummaryService : ITaxSummaryService
{
    private readonly List<TaxSummary> _summaries = [];
    private readonly object _lock = new();
    private int _nextId = 1;

    public IEnumerable<TaxSummary> GetAll()
    {
        lock (_lock)
        {
            return _summaries
                .OrderByDescending(x => x.Year)
                .ThenBy(x => x.Id)
                .Select(Clone)
                .ToArray();
        }
    }

    public TaxSummary? GetById(int id)
    {
        lock (_lock)
        {
            var summary = _summaries.FirstOrDefault(x => x.Id == id);
            return summary is null ? null : Clone(summary);
        }
    }

    public TaxSummary Create(TaxSummary summary)
    {
        Validate(summary);

        lock (_lock)
        {
            var created = Clone(summary);
            created.Id = _nextId++;
            _summaries.Add(created);
            return Clone(created);
        }
    }

    public TaxSummary? Update(int id, TaxSummary summary)
    {
        Validate(summary);

        lock (_lock)
        {
            var existing = _summaries.FirstOrDefault(x => x.Id == id);
            if (existing is null)
            {
                return null;
            }

            existing.Year = summary.Year;
            existing.TotalIncomeThb = summary.TotalIncomeThb;
            existing.TotalCostThb = summary.TotalCostThb;
            existing.TotalFeeThb = summary.TotalFeeThb;
            existing.NetProfitThb = summary.NetProfitThb;
            existing.TaxRate = summary.TaxRate;
            existing.TaxAmount = summary.TaxAmount;

            return Clone(existing);
        }
    }

    public bool Delete(int id)
    {
        lock (_lock)
        {
            var existing = _summaries.FirstOrDefault(x => x.Id == id);
            if (existing is null)
            {
                return false;
            }

            _summaries.Remove(existing);
            return true;
        }
    }

    private static void Validate(TaxSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);
    }

    private static TaxSummary Clone(TaxSummary summary)
    {
        return new TaxSummary
        {
            Id = summary.Id,
            Year = summary.Year,
            TotalIncomeThb = summary.TotalIncomeThb,
            TotalCostThb = summary.TotalCostThb,
            TotalFeeThb = summary.TotalFeeThb,
            NetProfitThb = summary.NetProfitThb,
            TaxRate = summary.TaxRate,
            TaxAmount = summary.TaxAmount
        };
    }
}
