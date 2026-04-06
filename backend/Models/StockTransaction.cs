using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public enum StockTransactionType
{
    Buy = 1,
    Sell = 2
}

public class StockTransaction
{
    public int Id { get; set; }

    [Required]
    public DateOnly Date { get; set; }

    [Required]
    [StringLength(20)]
    public string Ticker { get; set; } = string.Empty;

    [Required]
    public StockTransactionType Type { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal Quantity { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal PriceForeign { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal RateAtTrade { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal PriceThb { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal FeeForeign { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal FeeThb { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}
