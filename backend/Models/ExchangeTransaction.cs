using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class ExchangeTransaction
{
    public int Id { get; set; }

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
    public decimal Rate { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}
