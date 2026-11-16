using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ToursApi.Configuration;

/// <summary>
/// A permissive DateTime JSON converter that handles ISO 8601, European/Indian (dd-MM-yyyy, dd/MM/yyyy),
/// US formats (MM/dd/yyyy), and Unix millisecond timestamps.
/// </summary>
public class FlexibleDateTimeConverter : JsonConverter<DateTime>
{
    private static readonly string[] Formats =
    {
        "yyyy-MM-dd",
        "yyyy-MM-ddTHH:mm:ss",
        "yyyy-MM-ddTHH:mm:ssZ",
        "yyyy-MM-ddTHH:mm:ss.fffZ",
        "yyyy-MM-ddTHH:mm:ss.ffffffZ",
        "yyyy-MM-ddTHH:mm:ssK",
        "dd-MM-yyyy",
        "dd-MM-yyyy HH:mm",
        "dd-MM-yyyy HH:mm:ss",
        "dd/MM/yyyy",
        "dd/MM/yyyy HH:mm",
        "dd/MM/yyyy HH:mm:ss",
        "yyyy/MM/dd",
        "yyyy/MM/dd HH:mm:ss",
        "MM/dd/yyyy",
        "MM/dd/yyyy HH:mm:ss"
    };

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            var num = reader.GetInt64();
            // Handle millisecond vs second timestamps
            if (num > 100000000000L)
            {
                return DateTimeOffset.FromUnixTimeMilliseconds(num).UtcDateTime;
            }
            return DateTimeOffset.FromUnixTimeSeconds(num).UtcDateTime;
        }

        if (reader.TokenType == JsonTokenType.String)
        {
            var str = reader.GetString()?.Trim();
            if (string.IsNullOrWhiteSpace(str))
            {
                return DateTime.MinValue;
            }

            if (DateTime.TryParse(str, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var parsedInv))
            {
                return parsedInv;
            }

            foreach (var fmt in Formats)
            {
                if (DateTime.TryParseExact(str, fmt, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var exactParsed))
                {
                    return exactParsed;
                }
            }

            if (DateTime.TryParse(str, CultureInfo.CurrentCulture, DateTimeStyles.None, out var currentCultureParsed))
            {
                return currentCultureParsed.ToUniversalTime();
            }
        }

        return reader.GetDateTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture));
    }
}

/// <summary>
/// Nullable variant of the FlexibleDateTimeConverter.
/// </summary>
public class FlexibleNullableDateTimeConverter : JsonConverter<DateTime?>
{
    private readonly FlexibleDateTimeConverter _inner = new();

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        if (reader.TokenType == JsonTokenType.String)
        {
            var str = reader.GetString()?.Trim();
            if (string.IsNullOrWhiteSpace(str))
            {
                return null;
            }
        }

        return _inner.Read(ref reader, typeof(DateTime), options);
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (!value.HasValue)
        {
            writer.WriteNullValue();
        }
        else
        {
            _inner.Write(writer, value.Value, options);
        }
    }
}

