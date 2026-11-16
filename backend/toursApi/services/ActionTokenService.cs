using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Services;

public class ActionTokenPayload
{
    public string BookingId { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // "approve" or "reject"
    public string WebsiteId { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public string Nonce { get; set; } = Guid.NewGuid().ToString("N")[..8];
}

public interface IActionTokenService
{
    string GenerateToken(Booking booking, string action, WebsiteConfig siteConfig, TimeSpan? lifetime = null);
    bool TryValidateToken(string token, WebsiteConfig siteConfig, out ActionTokenPayload? payload, out string? errorMessage);
}

public class ActionTokenService : IActionTokenService
{
    public string GenerateToken(Booking booking, string action, WebsiteConfig siteConfig, TimeSpan? lifetime = null)
    {
        var validFor = lifetime ?? TimeSpan.FromHours(48);
        var payload = new ActionTokenPayload
        {
            BookingId = booking.Id ?? booking.Reference,
            Reference = booking.Reference,
            Action = action.Trim().ToLowerInvariant(),
            WebsiteId = siteConfig.WebsiteId,
            ExpiresAtUtc = DateTime.UtcNow.Add(validFor),
            Nonce = Guid.NewGuid().ToString("N")[..8]
        };

        var json = JsonSerializer.Serialize(payload);
        var payloadBytes = Encoding.UTF8.GetBytes(json);
        var payloadBase64 = Convert.ToBase64String(payloadBytes)
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');

        var secret = !string.IsNullOrWhiteSpace(siteConfig.ActionTokenSecret)
            ? siteConfig.ActionTokenSecret
            : "Fallback_Default_Secret_Key_For_Action_Tokens_2026!";

        var signature = ComputeHmac(payloadBase64, secret);

        return $"{payloadBase64}.{signature}";
    }

    public bool TryValidateToken(string token, WebsiteConfig siteConfig, out ActionTokenPayload? payload, out string? errorMessage)
    {
        payload = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(token))
        {
            errorMessage = "Action token is missing.";
            return false;
        }

        var parts = token.Split('.');
        if (parts.Length != 2)
        {
            errorMessage = "Invalid action token structure.";
            return false;
        }

        var payloadBase64 = parts[0];
        var incomingSignature = parts[1];

        var secret = !string.IsNullOrWhiteSpace(siteConfig.ActionTokenSecret)
            ? siteConfig.ActionTokenSecret
            : "Fallback_Default_Secret_Key_For_Action_Tokens_2026!";

        var expectedSignature = ComputeHmac(payloadBase64, secret);
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(incomingSignature),
                Encoding.UTF8.GetBytes(expectedSignature)))
        {
            errorMessage = "Invalid or tampered action token signature.";
            return false;
        }

        try
        {
            var paddedBase64 = payloadBase64.Replace("-", "+").Replace("_", "/");
            switch (paddedBase64.Length % 4)
            {
                case 2: paddedBase64 += "=="; break;
                case 3: paddedBase64 += "="; break;
            }

            var bytes = Convert.FromBase64String(paddedBase64);
            var json = Encoding.UTF8.GetString(bytes);
            var decoded = JsonSerializer.Deserialize<ActionTokenPayload>(json);

            if (decoded == null)
            {
                errorMessage = "Could not parse action token payload.";
                return false;
            }

            if (!string.Equals(decoded.WebsiteId, siteConfig.WebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                errorMessage = "Action token belongs to a different website.";
                return false;
            }

            if (DateTime.UtcNow > decoded.ExpiresAtUtc)
            {
                errorMessage = "Action token has expired. Please log in to the admin inbox to take action.";
                return false;
            }

            payload = decoded;
            return true;
        }
        catch (Exception ex)
        {
            errorMessage = $"Error decoding token: {ex.Message}";
            return false;
        }
    }

    private static string ComputeHmac(string data, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToBase64String(hash)
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }
}
