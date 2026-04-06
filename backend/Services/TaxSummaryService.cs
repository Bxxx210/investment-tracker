using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

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
    private readonly ApplicationDbContext _dbContext;

    public TaxSummaryService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IEnumerable<TaxSummary> GetAll()
    {
        return _dbContext.TaxSummaries
            .AsNoTracking()
            .OrderByDescending(x => x.Year)
            .ThenBy(x => x.Id)
            .ToArray();
    }

    public TaxSummary? GetById(int id)
    {
        return _dbContext.TaxSummaries
            .AsNoTracking()
            .FirstOrDefault(x => x.Id == id);
    }

    public TaxSummary Create(TaxSummary summary)
    {
        Validate(summary);

        var created = new TaxSummary
        {
            Year = summary.Year,
            TotalIncomeThb = summary.TotalIncomeThb,
            TotalCostThb = summary.TotalCostThb,
            TotalFeeThb = summary.TotalFeeThb,
            NetProfitThb = summary.NetProfitThb,
            TaxRate = summary.TaxRate,
            TaxAmount = summary.TaxAmount
        };

        _dbContext.TaxSummaries.Add(created);
        _dbContext.SaveChanges();
        return created;
    }

    public TaxSummary? Update(int id, TaxSummary summary)
    {
        Validate(summary);

        var existing = _dbContext.TaxSummaries.FirstOrDefault(x => x.Id == id);
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

        _dbContext.SaveChanges();
        return existing;
    }

    public bool Delete(int id)
    {
        var existing = _dbContext.TaxSummaries.FirstOrDefault(x => x.Id == id);
        if (existing is null)
        {
            return false;
        }

        _dbContext.TaxSummaries.Remove(existing);
        _dbContext.SaveChanges();
        return true;
    }

    private static void Validate(TaxSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);
    }
}
