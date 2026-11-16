using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models;

/// <summary>
/// Represents a cryptographically hashed, tenant-scoped API key.
/// Keys are stored as SHA-256 hashes and are valid strictly for their designated WebsiteId and AllowedHostnames.
/// </summary>
public class ApiKey
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Hex-encoded SHA-256 hash of the plain key. Plain key is never persisted.
    /// </summary>
    [BsonElement("keyHash")]
    public string KeyHash { get; set; } = string.Empty;

    /// <summary>
    /// Key prefix (e.g., "gt_sec_live", "gt_pub_app") used for identification and logs without revealing key material.
    /// </summary>
    [BsonElement("keyPrefix")]
    public string KeyPrefix { get; set; } = string.Empty;

    /// <summary>
    /// The tenant identifier ("gujjutours", "tripgoasia", "technoheaven").
    /// </summary>
    [BsonElement("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    /// <summary>
    /// Hostnames permitted to use this key.
    /// </summary>
    [BsonElement("allowedHostnames")]
    public List<string> AllowedHostnames { get; set; } = new();

    /// <summary>
    /// Descriptive human-readable label.
    /// </summary>
    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Key classification: "server" (high privilege) or "app" (low privilege public client).
    /// </summary>
    [BsonElement("type")]
    public string Type { get; set; } = "server";

    /// <summary>
    /// Granted permission scopes: "config:read", "catalog:read", "booking:create", "admin:write".
    /// </summary>
    [BsonElement("scopes")]
    public List<string> Scopes { get; set; } = new();

    /// <summary>
    /// Whether this key is currently enabled.
    /// </summary>
    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether this key has been explicitly revoked.
    /// </summary>
    [BsonElement("isRevoked")]
    public bool IsRevoked { get; set; } = false;

    /// <summary>
    /// Audit reason if revoked.
    /// </summary>
    [BsonElement("revokedReason")]
    public string? RevokedReason { get; set; }

    /// <summary>
    /// Timestamp when key was generated.
    /// </summary>
    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optional expiration timestamp.
    /// </summary>
    [BsonElement("expiresAt")]
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Timestamp of most recent authenticated request.
    /// </summary>
    [BsonElement("lastUsedAt")]
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// Maximum allowed requests per minute for this key.
    /// </summary>
    [BsonElement("rateLimitPerMinute")]
    public int RateLimitPerMinute { get; set; } = 120;

    /// <summary>
    /// Reference to preceding key hash if this key was generated via rotation.
    /// </summary>
    [BsonElement("rotatedFromKeyHash")]
    public string? RotatedFromKeyHash { get; set; }
}

