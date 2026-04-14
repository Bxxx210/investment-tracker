namespace backend.Models;

public sealed class InvestmentSummaryResponse
{
    public int Year { get; set; }

    public decimal TotalInvestedThb { get; set; }

    public decimal TotalCurrentValueThb { get; set; }

    public decimal TotalProfitLossThb { get; set; }

    public decimal TotalProfitLossPercent { get; set; }

    public decimal TaxableGainThb { get; set; }

    public decimal EstimatedTaxPayable { get; set; }

    public List<RealizedGainItem> RealizedGains { get; set; } = [];

    public List<string> Warnings { get; set; } = [];
}

public sealed class RealizedGainItem
{
    public string SourceType { get; set; } = string.Empty;

    public int TransactionId { get; set; }

    public DateTime ClosedAt { get; set; }

    public string Label { get; set; } = string.Empty;

    public decimal Quantity { get; set; }

    public decimal ProceedsThb { get; set; }

    public decimal CostBasisThb { get; set; }

    public decimal GainThb { get; set; }

    public string? Note { get; set; }
}
