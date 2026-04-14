using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IInvestmentSummaryService
{
    Task<InvestmentSummaryResponse> GetSummaryAsync(int? year = null);
}

public class InvestmentSummaryService : IInvestmentSummaryService
{
    private readonly ApplicationDbContext _dbContext;

    public InvestmentSummaryService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<InvestmentSummaryResponse> GetSummaryAsync(int? year = null)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;

        var exchangeTransactions = await _dbContext.ExchangeTransactions
            .AsNoTracking()
            .OrderBy(x => x.CreatedAt)
            .ThenBy(x => x.Id)
            .ToListAsync();

        var stockTransactions = await _dbContext.StockTransactions
            .AsNoTracking()
            .OrderBy(x => x.ExecutedAt)
            .ThenBy(x => x.Id)
            .ToListAsync();

        var timeline = BuildTimeline(exchangeTransactions, stockTransactions);
        var usdLots = new Queue<Lot>();
        var stockLotsByTicker = new Dictionary<string, Queue<Lot>>(StringComparer.OrdinalIgnoreCase);
        var warnings = new List<string>();
        var realizedGains = new List<RealizedGainItem>();

        decimal totalInvestedThb = 0m;
        decimal netInvestedThb = 0m;
        decimal cashThb = 0m;

        foreach (var entry in timeline)
        {
            if (entry.Exchange is not null)
            {
                ProcessExchangeTransaction(
                    entry.Exchange,
                    targetYear,
                    usdLots,
                    realizedGains,
                    warnings,
                    ref totalInvestedThb,
                    ref netInvestedThb,
                    ref cashThb);
                continue;
            }

            if (entry.Stock is not null)
            {
                ProcessStockTransaction(
                    entry.Stock,
                    targetYear,
                    usdLots,
                    stockLotsByTicker,
                    realizedGains,
                    warnings,
                    ref totalInvestedThb,
                    ref netInvestedThb,
                    ref cashThb);
            }
        }

        var remainingUsdValueThb = usdLots.Sum(lot => lot.RemainingCostThb);
        var remainingStockValueThb = stockLotsByTicker.Values.Sum(queue => queue.Sum(lot => lot.RemainingCostThb));

        var totalCurrentValueThb = cashThb + remainingUsdValueThb + remainingStockValueThb;
        var totalProfitLossThb = totalCurrentValueThb - totalInvestedThb;
        var totalProfitLossPercent = totalInvestedThb > 0
            ? totalProfitLossThb / totalInvestedThb * 100m
            : 0m;

        var realizedGainsThisYear = realizedGains
            .Where(item => item.ClosedAt.Year == targetYear)
            .ToList();

        var taxableGainThb = realizedGainsThisYear.Sum(item => item.GainThb);
        var estimatedTaxPayable = CalculateProgressiveTax(Math.Max(0m, taxableGainThb));

        return new InvestmentSummaryResponse
        {
            Year = targetYear,
            TotalInvestedThb = totalInvestedThb,
            NetInvestedThb = netInvestedThb,
            TotalCurrentValueThb = totalCurrentValueThb,
            TotalProfitLossThb = totalProfitLossThb,
            TotalProfitLossPercent = totalProfitLossPercent,
            TaxableGainThb = taxableGainThb,
            EstimatedTaxPayable = estimatedTaxPayable,
            RealizedGains = realizedGainsThisYear,
            Warnings = warnings
        };
    }

    private static List<TimelineEntry> BuildTimeline(
        IReadOnlyList<ExchangeTransaction> exchangeTransactions,
        IReadOnlyList<StockTransaction> stockTransactions)
    {
        var entries = new List<TimelineEntry>(exchangeTransactions.Count + stockTransactions.Count);

        entries.AddRange(exchangeTransactions.Select(transaction => new TimelineEntry(
            transaction.CreatedAt,
            0,
            transaction.Id,
            transaction,
            null)));

        entries.AddRange(stockTransactions.Select(transaction => new TimelineEntry(
            transaction.ExecutedAt,
            1,
            transaction.Id,
            null,
            transaction)));

        return entries
            .OrderBy(entry => entry.Timestamp)
            .ThenBy(entry => entry.Order)
            .ThenBy(entry => entry.Id)
            .ToList();
    }

    private static void ProcessExchangeTransaction(
        ExchangeTransaction transaction,
        int targetYear,
        Queue<Lot> usdLots,
        List<RealizedGainItem> realizedGains,
        List<string> warnings,
        ref decimal totalInvestedThb,
        ref decimal netInvestedThb,
        ref decimal cashThb)
    {
        if (transaction.ExchangeType == ExchangeType.BuyUsd)
        {
            if (transaction.ForeignAmount <= 0 || transaction.ThbAmount <= 0)
            {
                warnings.Add($"รายการแลกเงิน #{transaction.Id} มีข้อมูลไม่ครบ");
                return;
            }

            usdLots.Enqueue(new Lot(transaction.ForeignAmount, transaction.ThbAmount));
            totalInvestedThb += transaction.ThbAmount;
            netInvestedThb += transaction.ThbAmount;
            return;
        }

        if (transaction.ForeignAmount <= 0 || transaction.ThbAmount <= 0)
        {
            warnings.Add($"รายการแลกกลับ #{transaction.Id} มีข้อมูลไม่ครบ");
            return;
        }

        var soldQuantity = transaction.ForeignAmount;
        var proceedsThb = transaction.ThbAmount;
        var consumedCostBasisThb = ConsumeFromLots(
            usdLots,
            soldQuantity,
            warnings,
            $"USD แลกกลับ #{transaction.Id}");

        netInvestedThb -= consumedCostBasisThb;
        cashThb += proceedsThb;
        var gainThb = proceedsThb - consumedCostBasisThb;

        if (transaction.Date.Year == targetYear)
        {
            realizedGains.Add(new RealizedGainItem
            {
                SourceType = "exchange_sell_usd",
                TransactionId = transaction.Id,
                ClosedAt = transaction.CreatedAt,
                Label = "แลกกลับ (USD→THB)",
                Quantity = soldQuantity,
                ProceedsThb = proceedsThb,
                CostBasisThb = consumedCostBasisThb,
                GainThb = gainThb,
                Note = transaction.Note
            });
        }
    }

    private static void ProcessStockTransaction(
        StockTransaction transaction,
        int targetYear,
        Queue<Lot> usdLots,
        Dictionary<string, Queue<Lot>> stockLotsByTicker,
        List<RealizedGainItem> realizedGains,
        List<string> warnings,
        ref decimal totalInvestedThb,
        ref decimal netInvestedThb,
        ref decimal cashThb)
    {
        var ticker = transaction.Ticker.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(ticker) || transaction.Quantity <= 0)
        {
            warnings.Add($"รายการหุ้น #{transaction.Id} มีข้อมูลไม่ครบ");
            return;
        }

        var stockLots = GetLotQueue(stockLotsByTicker, ticker);
        var totalCostUsd = transaction.TotalCostUsd > 0
            ? transaction.TotalCostUsd
            : (transaction.PriceUsd * transaction.Quantity) + transaction.FeeUsd + transaction.VatUsd;

        switch (transaction.Type)
        {
            case StockTransactionType.Buy:
            {
                var basisFromUsdLots = ConsumeFromLots(
                    usdLots,
                    totalCostUsd,
                    warnings,
                    $"USD สำหรับซื้อหุ้น {ticker} #{transaction.Id}",
                    allowPartial: true);

                if (basisFromUsdLots < totalCostUsd)
                {
                    warnings.Add($"รายการซื้อหุ้น #{transaction.Id} ใช้ USD สำหรับต้นทุนไม่ครบทั้งหมด");
                }

                var fallbackCostBasisThb = ResolveFallbackStockBuyCostBasis(transaction, warnings);
                var totalCostBasisThb = basisFromUsdLots + fallbackCostBasisThb;

                if (totalCostBasisThb <= 0)
                {
                    warnings.Add($"รายการซื้อหุ้น #{transaction.Id} ไม่สามารถคำนวณต้นทุน THB ได้");
                    return;
                }

                stockLots.Enqueue(new Lot(transaction.Quantity, totalCostBasisThb));

                if (fallbackCostBasisThb > 0)
                {
                    totalInvestedThb += fallbackCostBasisThb;
                    netInvestedThb += fallbackCostBasisThb;
                }

                return;
            }
            case StockTransactionType.Sell:
            {
                var proceedsThb = ResolveStockSellProceedsThb(transaction, warnings);
                if (proceedsThb is null)
                {
                    warnings.Add($"รายการขายหุ้น #{transaction.Id} ไม่สามารถคำนวณมูลค่า THB ได้");
                    return;
                }

                var consumedCostBasisThb = ConsumeFromLots(
                    stockLots,
                    transaction.Quantity,
                    warnings,
                    $"หุ้น {ticker} #{transaction.Id}");

                netInvestedThb -= consumedCostBasisThb;
                cashThb += proceedsThb.Value;
                var gainThb = proceedsThb.Value - consumedCostBasisThb;

                if (transaction.ExecutedAt.Year == targetYear)
                {
                    realizedGains.Add(new RealizedGainItem
                    {
                        SourceType = "stock_sell",
                        TransactionId = transaction.Id,
                        ClosedAt = transaction.ExecutedAt,
                        Label = $"ขายหุ้น {ticker}",
                        Quantity = transaction.Quantity,
                        ProceedsThb = proceedsThb.Value,
                        CostBasisThb = consumedCostBasisThb,
                        GainThb = gainThb,
                        Note = transaction.Note
                    });
                }

                return;
            }
            case StockTransactionType.Dividend:
                warnings.Add($"รายการหุ้น #{transaction.Id} เป็น dividend แต่ schema ปัจจุบันยังไม่มีช่องทางคำนวณแยกอย่างถูกต้อง");
                return;
            case StockTransactionType.Withdrawal:
                warnings.Add($"รายการหุ้น #{transaction.Id} เป็น withdrawal แต่ควรย้ายไปตาราง cash transactions ในอนาคต");
                return;
            default:
                warnings.Add($"รายการหุ้น #{transaction.Id} มี type ที่ไม่รองรับ");
                return;
        }
    }

    private static decimal? ResolveStockSellProceedsThb(StockTransaction transaction, List<string> warnings)
    {
        if (transaction.PriceThb.HasValue && transaction.PriceThb.Value > 0)
        {
            return transaction.PriceThb.Value;
        }

        if (transaction.RateAtTrade.HasValue && transaction.RateAtTrade.Value > 0)
        {
            var netProceedsUsd = (transaction.PriceUsd * transaction.Quantity) - transaction.FeeUsd - transaction.VatUsd;
            return netProceedsUsd * transaction.RateAtTrade.Value;
        }

        warnings.Add($"รายการขายหุ้น #{transaction.Id} ไม่มี price_thb หรือ rate_at_trade");
        return null;
    }

    private static decimal ResolveFallbackStockBuyCostBasis(StockTransaction transaction, List<string> warnings)
    {
        if (transaction.PriceThb.HasValue && transaction.PriceThb.Value > 0)
        {
            return transaction.PriceThb.Value;
        }

        if (transaction.RateAtTrade.HasValue && transaction.RateAtTrade.Value > 0)
        {
            return transaction.TotalCostUsd * transaction.RateAtTrade.Value;
        }

        warnings.Add($"รายการซื้อหุ้น #{transaction.Id} ไม่มี rate_at_trade หรือ price_thb สำหรับ fallback");
        return 0m;
    }

    private static Queue<Lot> GetLotQueue(Dictionary<string, Queue<Lot>> lotsByTicker, string ticker)
    {
        if (!lotsByTicker.TryGetValue(ticker, out var queue))
        {
            queue = new Queue<Lot>();
            lotsByTicker[ticker] = queue;
        }

        return queue;
    }

    private static decimal ConsumeFromLots(
        Queue<Lot> lots,
        decimal quantityToConsume,
        List<string> warnings,
        string context,
        bool allowPartial = false)
    {
        var remaining = quantityToConsume;
        var consumedCostBasis = 0m;

        while (remaining > 0 && lots.Count > 0)
        {
            var current = lots.Peek();
            var quantityUsed = Math.Min(current.RemainingQuantity, remaining);
            var costUsed = quantityUsed * current.UnitCostThb;

            consumedCostBasis += costUsed;
            current.RemainingQuantity -= quantityUsed;
            current.RemainingCostThb -= costUsed;
            remaining -= quantityUsed;

            if (current.RemainingQuantity <= 0)
            {
                lots.Dequeue();
            }
        }

        if (remaining > 0 && !allowPartial)
        {
            warnings.Add($"FIFO ไม่พอสำหรับ {context} ขาดอีก {remaining.ToString("0.####", System.Globalization.CultureInfo.InvariantCulture)}");
        }
        else if (remaining > 0)
        {
            warnings.Add($"FIFO ไม่พอสำหรับ {context} ขาดอีก {remaining.ToString("0.####", System.Globalization.CultureInfo.InvariantCulture)}");
        }

        return consumedCostBasis;
    }

    private static decimal CalculateProgressiveTax(decimal taxableIncome)
    {
        if (taxableIncome <= 0)
        {
            return 0m;
        }

        var brackets = new (decimal UpperBound, decimal Rate)[]
        {
            (150000m, 0m),
            (300000m, 0.05m),
            (500000m, 0.10m),
            (750000m, 0.15m),
            (1000000m, 0.20m),
            (2000000m, 0.25m),
            (5000000m, 0.30m)
        };

        decimal tax = 0m;
        decimal lowerBound = 0m;

        foreach (var bracket in brackets)
        {
            if (taxableIncome <= lowerBound)
            {
                break;
            }

            var amountInBracket = Math.Min(taxableIncome, bracket.UpperBound) - lowerBound;
            if (amountInBracket > 0)
            {
                tax += amountInBracket * bracket.Rate;
            }

            lowerBound = bracket.UpperBound;
        }

        if (taxableIncome > lowerBound)
        {
            tax += (taxableIncome - lowerBound) * 0.35m;
        }

        return tax;
    }

    private sealed record TimelineEntry(
        DateTime Timestamp,
        int Order,
        int Id,
        ExchangeTransaction? Exchange,
        StockTransaction? Stock);

    private sealed class Lot
    {
        public Lot(decimal remainingQuantity, decimal remainingCostThb)
        {
            RemainingQuantity = remainingQuantity;
            RemainingCostThb = remainingCostThb;
        }

        public decimal RemainingQuantity { get; set; }

        public decimal RemainingCostThb { get; set; }

        public decimal UnitCostThb => RemainingQuantity > 0 ? RemainingCostThb / RemainingQuantity : 0m;
    }
}
