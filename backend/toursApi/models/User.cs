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

    [BsonElement("userCode")]
    [JsonPropertyName("userCode")]
    public string UserCode { get; set; } = string.Empty;

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("fullName")]
    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    // Alias Name property to maintain backwards compatibility with existing references
    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name
    {
        get => !string.IsNullOrEmpty(FullName) ? FullName : _name;
        set
        {
            _name = value;
            if (string.IsNullOrEmpty(FullName)) FullName = value;
        }
    }
    private string _name = string.Empty;

    [BsonElement("email")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("phoneCountryCode")]
    [JsonPropertyName("phoneCountryCode")]
    public string PhoneCountryCode { get; set; } = "+91";

    [BsonElement("phone")]
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [BsonElement("passwordHash")]
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("role")]
    [JsonPropertyName("role")]
    public string Role { get; set; } = "Customer";

    [BsonElement("isEmailVerified")]
    [JsonPropertyName("isEmailVerified")]
    public bool IsEmailVerified { get; set; } = false;

    [BsonElement("emailVerificationTokenHash")]
    [JsonIgnore]
    public string? EmailVerificationTokenHash { get; set; }

    [BsonElement("emailVerificationExpiresAt")]
    [JsonIgnore]
    public DateTime? EmailVerificationExpiresAt { get; set; }

    [BsonElement("passwordResetTokenHash")]
    [JsonIgnore]
    public string? PasswordResetTokenHash { get; set; }

    [BsonElement("passwordResetExpiresAt")]
    [JsonIgnore]
    public DateTime? PasswordResetExpiresAt { get; set; }

    // Alias for existing codebase references
    [BsonIgnore]
    [JsonIgnore]
    public DateTime? PasswordResetExpiresUtc
    {
        get => PasswordResetExpiresAt;
        set => PasswordResetExpiresAt = value;
    }

    [BsonElement("failedLoginCount")]
    [JsonIgnore]
    public int FailedLoginCount { get; set; } = 0;

    // Alias for existing codebase references
    [BsonIgnore]
    [JsonIgnore]
    public int FailedLoginAttempts
    {
        get => FailedLoginCount;
        set => FailedLoginCount = value;
    }

    [BsonElement("lockoutUntil")]
    [JsonIgnore]
    public DateTime? LockoutUntil { get; set; }

    // Alias for existing codebase references
    [BsonIgnore]
    [JsonIgnore]
    public DateTime? LockoutEndUtc
    {
        get => LockoutUntil;
        set => LockoutUntil = value;
    }

    [BsonElement("dietaryPreference")]
    [JsonPropertyName("dietaryPreference")]
    public string DietaryPreference { get; set; } = "None"; // None | PureVeg | Jain | Swaminarayan | Halal

    [BsonElement("preferredCurrency")]
    [JsonPropertyName("preferredCurrency")]
    public string PreferredCurrency { get; set; } = "INR";

    [BsonElement("marketingOptIn")]
    [JsonPropertyName("marketingOptIn")]
    public bool MarketingOptIn { get; set; } = false;

    [BsonElement("termsAcceptedAt")]
    [JsonPropertyName("termsAcceptedAt")]
    public DateTime? TermsAcceptedAt { get; set; }

    [BsonElement("isDisabled")]
    [JsonPropertyName("isDisabled")]
    public bool IsDisabled { get; set; } = false;

    [BsonElement("isDeleted")]
    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; } = false;

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";

    [BsonElement("refreshTokens")]
    [JsonIgnore]
    public List<RefreshToken> RefreshTokens { get; set; } = new();

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("lastLoginAt")]
    [JsonPropertyName("lastLoginAt")]
    public DateTime? LastLoginAt { get; set; }
}
