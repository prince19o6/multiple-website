using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class RefreshToken
{
    [BsonElement("tokenHash")]
    [JsonPropertyName("tokenHash")]
    public string TokenHash { get; set; } = string.Empty;

    // Optional legacy or raw token field
    [BsonElement("token")]
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [BsonElement("deviceInfo")]
    [JsonPropertyName("deviceInfo")]
    public string? DeviceInfo { get; set; }

    [BsonElement("ipAddress")]
    [JsonPropertyName("ipAddress")]
    public string? IpAddress { get; set; }

    [BsonElement("expiresUtc")]
    [JsonPropertyName("expiresUtc")]
    public DateTime ExpiresUtc { get; set; }

    [BsonElement("createdAtUtc")]
    [JsonPropertyName("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [BsonElement("revokedAtUtc")]
    [JsonPropertyName("revokedAtUtc")]
    public DateTime? RevokedAtUtc { get; set; }

    [BsonElement("replacedByTokenHash")]
    [JsonPropertyName("replacedByTokenHash")]
    public string? ReplacedByTokenHash { get; set; }

    [BsonIgnore]
    [JsonIgnore]
    public bool IsRevoked => RevokedAtUtc != null;

    [BsonIgnore]
    [JsonIgnore]
    public bool IsExpired => DateTime.UtcNow >= ExpiresUtc;

    [BsonIgnore]
    [JsonIgnore]
    public bool IsActive => !IsRevoked && !IsExpired;
}
