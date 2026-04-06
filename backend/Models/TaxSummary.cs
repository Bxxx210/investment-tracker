using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class TaxSummary
{
    public int Id { get; set; }

    [Range(2000, 9999)]
    public int Year { get; set; }

    public decimal TotalIncomeThb { get; set; }

    public decimal TotalCostThb { get; set; }

    public decimal TotalFeeThb { get; set; }

    public decimal NetProfitThb { get; set; }

    [Range(typeof(decimal), "0", "100")]
    public decimal TaxRate { get; set; }

    public decimal TaxAmount { get; set; }
}
