using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class ExchangeTransaction
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [EnumDataType(typeof(global::backend.Models.ExchangeType))]
    public ExchangeType ExchangeType { get; set; } = ExchangeType.BuyUsd;

    [Required]
    public DateOnly Date { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal ThbAmount { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal ForeignAmount { get; set; }

    [Required]
    [StringLength(10)]
    public string Currency { get; set; } = "USD";

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal? MidRate { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335")]
    public decimal ActualRate { get; set; }

    [Range(typeof(decimal), "-79228162514264337593543950335", "79228162514264337593543950335")]
    public decimal? Spread { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}
