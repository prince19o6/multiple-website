using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("email")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("phone")]
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [BsonElement("passwordHash")]
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("role")]
    [JsonPropertyName("role")]
    public string Role { get; set; } = "user";

    [BsonElement("isDisabled")]
    [JsonPropertyName("isDisabled")]
    public bool IsDisabled { get; set; } = false;

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";

    [BsonElement("failedLoginAttempts")]
    [JsonIgnore]
    public int FailedLoginAttempts { get; set; } = 0;

    [BsonElement("lockoutEndUtc")]
    [JsonIgnore]
    public DateTime? LockoutEndUtc { get; set; }

    [BsonElement("refreshTokens")]
    [JsonIgnore]
    public List<RefreshToken> RefreshTokens { get; set; } = new();

    [BsonElement("passwordResetTokenHash")]
    [JsonIgnore]
    public string? PasswordResetTokenHash { get; set; }

    [BsonElement("passwordResetExpiresUtc")]
    [JsonIgnore]
    public DateTime? PasswordResetExpiresUtc { get; set; }

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
