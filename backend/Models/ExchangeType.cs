using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Models;

[JsonConverter(typeof(ExchangeTypeJsonConverter))]
public enum ExchangeType
{
    BuyUsd = 1,
    SellUsd = 2
}

public sealed class ExchangeTypeJsonConverter : JsonConverter<ExchangeType>
{
    public override ExchangeType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.String => ParseString(reader.GetString()),
            JsonTokenType.Number when reader.TryGetInt32(out var value) => value switch
            {
                1 => ExchangeType.BuyUsd,
                2 => ExchangeType.SellUsd,
                _ => throw new JsonException("ค่าประเภทแลกเงินไม่ถูกต้อง")
            },
            _ => throw new JsonException("ค่าประเภทแลกเงินไม่ถูกต้อง")
        };
    }

    public override void Write(Utf8JsonWriter writer, ExchangeType value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value == ExchangeType.SellUsd ? "sell_usd" : "buy_usd");
    }

    private static ExchangeType ParseString(string? value)
    {
        return value?.Trim().ToLowerInvariant() switch
        {
            "buy_usd" => ExchangeType.BuyUsd,
            "sell_usd" => ExchangeType.SellUsd,
            "buyusd" => ExchangeType.BuyUsd,
            "sellusd" => ExchangeType.SellUsd,
            "1" => ExchangeType.BuyUsd,
            "2" => ExchangeType.SellUsd,
            _ => throw new JsonException("ค่าประเภทแลกเงินไม่ถูกต้อง")
        };
    }
}
