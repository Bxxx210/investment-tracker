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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [StringLength(20)]
    public string Ticker { get; set; } = string.Empty;

    [Required]
    public StockTransactionType Type { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal Quantity { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal PriceUsd { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal FeeUsd { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal VatUsd { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal TotalCostUsd { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal? RateAtTrade { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal? PriceThb { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}
