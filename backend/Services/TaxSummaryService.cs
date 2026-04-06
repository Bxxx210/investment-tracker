using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface ITaxSummaryService
{
    Task<IEnumerable<TaxSummary>> GetAllAsync();
    Task<TaxSummary?> GetByIdAsync(int id);
    Task<TaxSummary> CreateAsync(TaxSummary summary);
    Task<TaxSummary?> UpdateAsync(int id, TaxSummary summary);
    Task<bool> DeleteAsync(int id);
}

public class TaxSummaryService : ITaxSummaryService
{
    private readonly ApplicationDbContext _dbContext;

    public TaxSummaryService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<TaxSummary>> GetAllAsync()
    {
        return await _dbContext.TaxSummaries
            .AsNoTracking()
            .OrderByDescending(x => x.Year)
            .ThenBy(x => x.Id)
            .ToListAsync();
    }

    public async Task<TaxSummary?> GetByIdAsync(int id)
    {
        return await _dbContext.TaxSummaries
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<TaxSummary> CreateAsync(TaxSummary summary)
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
        await _dbContext.SaveChangesAsync();
        return created;
    }

    public async Task<TaxSummary?> UpdateAsync(int id, TaxSummary summary)
    {
        Validate(summary);

        var existing = await _dbContext.TaxSummaries.FirstOrDefaultAsync(x => x.Id == id);
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

        await _dbContext.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _dbContext.TaxSummaries.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return false;
        }

        _dbContext.TaxSummaries.Remove(existing);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static void Validate(TaxSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);
    }
}
