using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Models;

[JsonConverter(typeof(StockTransactionTypeJsonConverter))]
public enum StockTransactionType
{
    Buy = 1,
    Sell = 2,
    Dividend = 3,
    Withdrawal = 4
}

public sealed class StockTransactionTypeJsonConverter : JsonConverter<StockTransactionType>
{
    public override StockTransactionType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.String => ParseString(reader.GetString()),
            JsonTokenType.Number when reader.TryGetInt32(out var value) => value switch
            {
                1 => StockTransactionType.Buy,
                2 => StockTransactionType.Sell,
                3 => StockTransactionType.Dividend,
                4 => StockTransactionType.Withdrawal,
                _ => throw new JsonException("ค่าประเภทรายการหุ้นไม่ถูกต้อง")
            },
            _ => throw new JsonException("ค่าประเภทรายการหุ้นไม่ถูกต้อง")
        };
    }

    public override void Write(Utf8JsonWriter writer, StockTransactionType value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value switch
        {
            StockTransactionType.Buy => "buy",
            StockTransactionType.Sell => "sell",
            StockTransactionType.Dividend => "dividend",
            StockTransactionType.Withdrawal => "withdrawal",
            _ => throw new JsonException("ค่าประเภทรายการหุ้นไม่ถูกต้อง")
        });
    }

    private static StockTransactionType ParseString(string? value)
    {
        return value?.Trim().ToLowerInvariant() switch
        {
            "buy" => StockTransactionType.Buy,
            "sell" => StockTransactionType.Sell,
            "dividend" => StockTransactionType.Dividend,
            "withdrawal" => StockTransactionType.Withdrawal,
            "1" => StockTransactionType.Buy,
            "2" => StockTransactionType.Sell,
            "3" => StockTransactionType.Dividend,
            "4" => StockTransactionType.Withdrawal,
            _ => throw new JsonException("ค่าประเภทรายการหุ้นไม่ถูกต้อง")
        };
    }
}
