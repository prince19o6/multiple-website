using MongoDB.Bson.Serialization.Attributes;
using System;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class RefreshToken
{
    [BsonElement("token")]
    public string Token { get; set; } = string.Empty;

    [BsonElement("expiresUtc")]
    public DateTime ExpiresUtc { get; set; }

    [BsonElement("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [BsonElement("revokedAtUtc")]
    public DateTime? RevokedAtUtc { get; set; }

    [BsonIgnore]
    public bool IsRevoked => RevokedAtUtc != null;

    [BsonIgnore]
    public bool IsExpired => DateTime.UtcNow >= ExpiresUtc;

    [BsonIgnore]
    public bool IsActive => !IsRevoked && !IsExpired;
}
