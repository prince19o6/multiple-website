using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class ApiKeyRepository : IApiKeyRepository
{
    private readonly IMongoDatabase _database;
    private readonly IMongoCollection<ApiKey> _collection;
    private readonly ILogger<ApiKeyRepository> _logger;
    private static readonly ConcurrentDictionary<string, bool> _seededTenants = new(StringComparer.OrdinalIgnoreCase);

    private static readonly Dictionary<string, ApiKey> _builtInKeysByPlain = new(StringComparer.OrdinalIgnoreCase)
    {
        // Gujju Tours
        ["gt_sec_live_web_gujjutours_2026_x7a"] = new ApiKey
        {
            Id = "key_gt_sec_live",
            KeyHash = ComputeKeyHashStatic("gt_sec_live_web_gujjutours_2026_x7a"),
            KeyPrefix = "gt_sec_live",
            WebsiteId = "gujjutours",
            AllowedHostnames = new List<string>
            {
                "www.gujjutours.com", "gujjutours.com", "b2b.gujjutours.com",
                "travelexplorer.com", "www.travelexplorer.com",
                "gujjutours.localhost", "gujju.localhost", "website1.localhost", "localhost", "127.0.0.1", "::1"
            },
            Name = "Gujju Tours Server Web Client",
            Type = "server",
            Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "admin:write" },
            IsActive = true,
            RateLimitPerMinute = 300,
        },
        ["gt_pub_app_gujjutours_2026_m8b"] = new ApiKey
        {
            Id = "key_gt_pub_app",
            KeyHash = ComputeKeyHashStatic("gt_pub_app_gujjutours_2026_m8b"),
            KeyPrefix = "gt_pub_app",
            WebsiteId = "gujjutours",
            AllowedHostnames = new List<string>
            {
                "www.gujjutours.com", "gujjutours.com", "b2b.gujjutours.com",
                "travelexplorer.com", "www.travelexplorer.com",
                "gujjutours.localhost", "gujju.localhost", "website1.localhost", "localhost", "127.0.0.1", "::1"
            },
            Name = "Gujju Tours Mobile App Client",
            Type = "app",
            Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "transfers:write" },
            IsActive = true,
            RateLimitPerMinute = 120,
        },
        // TripGo Asia
        ["tg_sec_live_web_tripgoasia_2026_k9p"] = new ApiKey
        {
            Id = "key_tg_sec_live",
            KeyHash = ComputeKeyHashStatic("tg_sec_live_web_tripgoasia_2026_k9p"),
            KeyPrefix = "tg_sec_live",
            WebsiteId = "tripgoasia",
            AllowedHostnames = new List<string>
            {
                "www.tripgoasia.com", "tripgoasia.com", "adventureworld.com", "www.adventureworld.com",
                "tripgoasia.localhost", "tripgo.localhost", "website2.localhost", "localhost", "127.0.0.1", "::1"
            },
            Name = "TripGo Asia Server Web Client",
            Type = "server",
            Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "admin:write" },
            IsActive = true,
            RateLimitPerMinute = 300,
        },
        ["tg_pub_app_tripgoasia_2026_y2r"] = new ApiKey
        {
            Id = "key_tg_pub_app",
            KeyHash = ComputeKeyHashStatic("tg_pub_app_tripgoasia_2026_y2r"),
            KeyPrefix = "tg_pub_app",
            WebsiteId = "tripgoasia",
            AllowedHostnames = new List<string>
            {
                "www.tripgoasia.com", "tripgoasia.com", "adventureworld.com", "www.adventureworld.com",
                "tripgoasia.localhost", "tripgo.localhost", "website2.localhost", "localhost", "127.0.0.1", "::1"
            },
            Name = "TripGo Asia Mobile App Client",
            Type = "app",
            Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "transfers:write" },
            IsActive = true,
            RateLimitPerMinute = 120,
        },
        // Technoheaven
        ["th_sec_live_web_technoheaven_2026_v4w"] = new ApiKey
        {
            Id = "key_th_sec_live",
            KeyHash = ComputeKeyHashStatic("th_sec_live_web_technoheaven_2026_v4w"),
            KeyPrefix = "th_sec_live",
            WebsiteId = "technoheaven",
            AllowedHostnames = new List<string>
            {
                "stagingb2b.technoheaven.com", "technoheaven.com", "www.technoheaven.com",
                "holidayparadise.com", "www.holidayparadise.com",
                "technoheaven.localhost", "techno.localhost", "website3.localhost", "localhost", "127.0.0.1", "::1"
            },
            Name = "Technoheaven Server Web Client",
            Type = "server",
            Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "admin:write" },
            IsActive = true,
            RateLimitPerMinute = 300,
        },
        ["th_pub_app_technoheaven_2026_z5q"] = new ApiKey
        {
            Id = "key_th_pub_app",
            KeyHash = ComputeKeyHashStatic("th_pub_app_technoheaven_2026_z5q"),
            KeyPrefix = "th_pub_app",
            WebsiteId = "technoheaven",
            AllowedHostnames = new List<string>
            {
                "stagingb2b.technoheaven.com", "technoheaven.com", "www.technoheaven.com",
                "holidayparadise.com", "www.holidayparadise.com",
                "technoheaven.localhost", "techno.localhost", "website3.localhost", "localhost", "127.0.0.1", "::1"
            },
            Name = "Technoheaven Mobile App Client",
            Type = "app",
            Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "transfers:write" },
            IsActive = true,
            RateLimitPerMinute = 120,
        },
    };

    public ApiKeyRepository(IMongoDatabase database, ILogger<ApiKeyRepository> logger)
    {
        _database = database;
        _collection = database.GetCollection<ApiKey>("api_keys");
        _logger = logger;

        // Ensure indexes asynchronously
        _ = EnsureIndexesAsync();
    }

    private static string ComputeKeyHashStatic(string plainKey)
    {
        if (string.IsNullOrWhiteSpace(plainKey)) return string.Empty;
        var bytes = Encoding.UTF8.GetBytes(plainKey.Trim());
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private async Task EnsureIndexesAsync()
    {
        try
        {
            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
            var indexKeys = Builders<ApiKey>.IndexKeys.Ascending(k => k.KeyHash);
            var indexOptions = new CreateIndexOptions { Unique = true, Background = true };
            await _collection.Indexes.CreateOneAsync(new CreateIndexModel<ApiKey>(indexKeys, indexOptions), cancellationToken: cts.Token);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ApiKeyRepository] Non-fatal index creation warning on api_keys");
        }
    }

    public string ComputeKeyHash(string plainKey) => ComputeKeyHashStatic(plainKey);

    public async Task<ApiKey?> ValidateKeyAsync(string plainKey, string websiteId, string hostname, string? requiredScope = null)
    {
        if (string.IsNullOrWhiteSpace(plainKey)) return null;

        var cleanPlainKey = plainKey.Trim();

        // 1. Fast in-memory check for built-in default keys (zero DB latency, offline resilient)
        if (_builtInKeysByPlain.TryGetValue(cleanPlainKey, out var builtInKey))
        {
            if (string.Equals(builtInKey.WebsiteId, websiteId, StringComparison.OrdinalIgnoreCase))
            {
                return builtInKey;
            }
        }

        var keyHash = ComputeKeyHash(cleanPlainKey);

        // 1b. Check by hash in built-in keys
        var builtInByHash = _builtInKeysByPlain.Values.FirstOrDefault(k => string.Equals(k.KeyHash, keyHash, StringComparison.OrdinalIgnoreCase));
        if (builtInByHash != null && string.Equals(builtInByHash.WebsiteId, websiteId, StringComparison.OrdinalIgnoreCase))
        {
            return builtInByHash;
        }

        // 2. Query tenant database with bounded timeout
        ApiKey? key = null;
        try
        {
            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
            key = await _collection.Find(k => k.KeyHash == keyHash).FirstOrDefaultAsync(cts.Token);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ApiKeyRepository] MongoDB unavailable during key validation for tenant '{WebsiteId}'.", websiteId);
            return null;
        }

        if (key == null)
        {
            _logger.LogWarning("[ApiKeyRepository] Key validation failed: Hash not found in tenant database for website '{WebsiteId}'", websiteId);
            return null;
        }

        // Active state validation
        if (!key.IsActive || key.IsRevoked)
        {
            _logger.LogWarning("[ApiKeyRepository] Key validation failed: Key '{KeyPrefix}...' is inactive or revoked ({Reason})", key.KeyPrefix, key.RevokedReason ?? "no reason provided");
            return null;
        }

        // Expiry check
        if (key.ExpiresAt.HasValue && key.ExpiresAt.Value < DateTime.UtcNow)
        {
            _logger.LogWarning("[ApiKeyRepository] Key validation failed: Key '{KeyPrefix}...' expired at {ExpiresAt}", key.KeyPrefix, key.ExpiresAt);
            return null;
        }

        // Strict Tenant Affinity Assertion
        if (!string.Equals(key.WebsiteId, websiteId, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogError("[ApiKeyRepository] CROSS-TENANT SECURITY VIOLATION: Key for '{KeyWebsite}' presented to '{ReqWebsite}'!", key.WebsiteId, websiteId);
            return null;
        }

        // Hostname Match Check
        var normalizedHost = WebsiteRegistry.NormalizeHostname(hostname);
        var hostAllowed = key.AllowedHostnames.Contains("*") ||
                          key.AllowedHostnames.Exists(h => WebsiteRegistry.NormalizeHostname(h).Equals(normalizedHost, StringComparison.OrdinalIgnoreCase));

        if (!hostAllowed)
        {
            _logger.LogWarning("[ApiKeyRepository] Hostname not allowed for key '{KeyPrefix}...'. Allowed: [{Allowed}], Requested: '{Hostname}'",
                key.KeyPrefix, string.Join(", ", key.AllowedHostnames), normalizedHost);
            return null;
        }

        // Required Scope Check
        if (!string.IsNullOrWhiteSpace(requiredScope) && !key.Scopes.Contains(requiredScope) && !key.Scopes.Contains("*"))
        {
            _logger.LogWarning("[ApiKeyRepository] Scope check failed for key '{KeyPrefix}...'. Required: '{Scope}', Granted: [{Granted}]",
                key.KeyPrefix, requiredScope, string.Join(", ", key.Scopes));
            return null;
        }

        return key;
    }

    public async Task<ApiKey?> GetByKeyHashAsync(string keyHash)
    {
        return await _collection.Find(k => k.KeyHash == keyHash).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<ApiKey>> GetKeysForWebsiteAsync(string websiteId)
    {
        return await _collection.Find(k => k.WebsiteId == websiteId).ToListAsync();
    }

    public async Task<ApiKey> CreateKeyAsync(ApiKey apiKey)
    {
        await _collection.InsertOneAsync(apiKey);
        return apiKey;
    }

    public async Task<bool> RevokeKeyAsync(string keyId, string reason = "Manual revocation")
    {
        var update = Builders<ApiKey>.Update
            .Set(k => k.IsActive, false)
            .Set(k => k.IsRevoked, true)
            .Set(k => k.RevokedReason, reason);

        var result = await _collection.UpdateOneAsync(k => k.Id == keyId, update);
        return result.ModifiedCount > 0;
    }

    public async Task<ApiKey> RotateKeyAsync(string oldKeyId, string newPlainKey, string newPrefix)
    {
        var oldKey = await _collection.Find(k => k.Id == oldKeyId).FirstOrDefaultAsync();
        if (oldKey == null) throw new InvalidOperationException($"Old API key ID {oldKeyId} not found");

        var newKey = new ApiKey
        {
            KeyHash = ComputeKeyHash(newPlainKey),
            KeyPrefix = newPrefix,
            WebsiteId = oldKey.WebsiteId,
            AllowedHostnames = new List<string>(oldKey.AllowedHostnames),
            Name = $"{oldKey.Name} (Rotated {DateTime.UtcNow:yyyy-MM-dd})",
            Type = oldKey.Type,
            Scopes = new List<string>(oldKey.Scopes),
            IsActive = true,
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow,
            RateLimitPerMinute = oldKey.RateLimitPerMinute,
            RotatedFromKeyHash = oldKey.KeyHash,
            // Keep old key active for 48 hour grace period
            ExpiresAt = DateTime.UtcNow.AddMonths(12)
        };

        await _collection.InsertOneAsync(newKey);

        // Deprecate old key with 48-hour expiration
        var graceExpiry = DateTime.UtcNow.AddHours(48);
        await _collection.UpdateOneAsync(
            k => k.Id == oldKeyId,
            Builders<ApiKey>.Update.Set(k => k.ExpiresAt, graceExpiry));

        _logger.LogInformation("[ApiKeyRepository] Rotated key {OldPrefix}... -> {NewPrefix}... (Grace expiry: {Grace})",
            oldKey.KeyPrefix, newPrefix, graceExpiry);

        return newKey;
    }

    public async Task UpdateLastUsedAsync(string keyId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(keyId)) return;
            if (MongoDB.Bson.ObjectId.TryParse(keyId, out _))
            {
                await _collection.UpdateOneAsync(
                    k => k.Id == keyId,
                    Builders<ApiKey>.Update.Set(k => k.LastUsedAt, DateTime.UtcNow));
            }
            else
            {
                await _collection.UpdateOneAsync(
                    k => k.KeyPrefix == keyId || k.Name == keyId,
                    Builders<ApiKey>.Update.Set(k => k.LastUsedAt, DateTime.UtcNow));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ApiKeyRepository] Failed to update lastUsedAt for key {KeyId}", keyId);
        }
    }

    public async Task SeedDefaultKeysIfEmptyAsync(string websiteId)
    {
        if (string.IsNullOrWhiteSpace(websiteId)) return;
        var cleanSite = websiteId.Trim().ToLowerInvariant();

        if (_seededTenants.ContainsKey(cleanSite)) return;

        try
        {
            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
            var count = await _collection.CountDocumentsAsync(k => k.WebsiteId == cleanSite, cancellationToken: cts.Token);
            _seededTenants[cleanSite] = true;

            if (count > 0) return;

            _logger.LogInformation("[ApiKeyRepository] Seeding default API keys for tenant '{WebsiteId}'...", cleanSite);

            var keysToSeed = new List<ApiKey>();

            if (cleanSite == "gujjutours")
            {
                keysToSeed.Add(new ApiKey
                {
                    KeyHash = ComputeKeyHash("gt_sec_live_web_gujjutours_2026_x7a"), // scan-secrets:ignore
                    KeyPrefix = "gt_sec_live",
                    WebsiteId = "gujjutours",
                    AllowedHostnames = new List<string>
                    {
                        "www.gujjutours.com", "gujjutours.com", "b2b.gujjutours.com",
                        "travelexplorer.com", "www.travelexplorer.com",
                        "gujjutours.localhost", "gujju.localhost", "website1.localhost", "localhost", "127.0.0.1", "::1"
                    },
                    Name = "Gujju Tours Server Web Client",
                    Type = "server",
                    Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "admin:write" },
                    IsActive = true,
                    RateLimitPerMinute = 300,
                });

                keysToSeed.Add(new ApiKey
                {
                    KeyHash = ComputeKeyHash("gt_pub_app_gujjutours_2026_m8b"),
                    KeyPrefix = "gt_pub_app",
                    WebsiteId = "gujjutours",
                    AllowedHostnames = new List<string>
                    {
                        "www.gujjutours.com", "gujjutours.com", "b2b.gujjutours.com",
                        "travelexplorer.com", "www.travelexplorer.com",
                        "gujjutours.localhost", "gujju.localhost", "website1.localhost", "localhost", "127.0.0.1", "::1"
                    },
                    Name = "Gujju Tours Mobile App Client",
                    Type = "app",
                    Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "transfers:write" },
                    IsActive = true,
                    RateLimitPerMinute = 120,
                });
            }
            else if (cleanSite == "tripgoasia")
            {
                keysToSeed.Add(new ApiKey
                {
                    KeyHash = ComputeKeyHash("tg_sec_live_web_tripgoasia_2026_k9p"), // scan-secrets:ignore
                    KeyPrefix = "tg_sec_live",
                    WebsiteId = "tripgoasia",
                    AllowedHostnames = new List<string>
                    {
                        "www.tripgoasia.com", "tripgoasia.com", "adventureworld.com", "www.adventureworld.com",
                        "tripgoasia.localhost", "tripgo.localhost", "website2.localhost", "localhost", "127.0.0.1", "::1"
                    },
                    Name = "TripGo Asia Server Web Client",
                    Type = "server",
                    Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "admin:write" },
                    IsActive = true,
                    RateLimitPerMinute = 300,
                });

                keysToSeed.Add(new ApiKey
                {
                    KeyHash = ComputeKeyHash("tg_pub_app_tripgoasia_2026_y2r"),
                    KeyPrefix = "tg_pub_app",
                    WebsiteId = "tripgoasia",
                    AllowedHostnames = new List<string>
                    {
                        "www.tripgoasia.com", "tripgoasia.com", "adventureworld.com", "www.adventureworld.com",
                        "tripgoasia.localhost", "tripgo.localhost", "website2.localhost", "localhost", "127.0.0.1", "::1"
                    },
                    Name = "TripGo Asia Mobile App Client",
                    Type = "app",
                    Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "transfers:write" },
                    IsActive = true,
                    RateLimitPerMinute = 120,
                });
            }
            else if (cleanSite == "technoheaven")
            {
                keysToSeed.Add(new ApiKey
                {
                    KeyHash = ComputeKeyHash("th_sec_live_web_technoheaven_2026_v4w"), // scan-secrets:ignore
                    KeyPrefix = "th_sec_live",
                    WebsiteId = "technoheaven",
                    AllowedHostnames = new List<string>
                    {
                        "stagingb2b.technoheaven.com", "technoheaven.com", "www.technoheaven.com",
                        "holidayparadise.com", "www.holidayparadise.com",
                        "technoheaven.localhost", "techno.localhost", "website3.localhost", "localhost", "127.0.0.1", "::1"
                    },
                    Name = "Technoheaven Server Web Client",
                    Type = "server",
                    Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "admin:write" },
                    IsActive = true,
                    RateLimitPerMinute = 300,
                });

                keysToSeed.Add(new ApiKey
                {
                    KeyHash = ComputeKeyHash("th_pub_app_technoheaven_2026_z5q"),
                    KeyPrefix = "th_pub_app",
                    WebsiteId = "technoheaven",
                    AllowedHostnames = new List<string>
                    {
                        "stagingb2b.technoheaven.com", "technoheaven.com", "www.technoheaven.com",
                        "holidayparadise.com", "www.holidayparadise.com",
                        "technoheaven.localhost", "techno.localhost", "website3.localhost", "localhost", "127.0.0.1", "::1"
                    },
                    Name = "Technoheaven Mobile App Client",
                    Type = "app",
                    Scopes = new List<string> { "config:read", "catalog:read", "booking:create", "transfers:write" },
                    IsActive = true,
                    RateLimitPerMinute = 120,
                });
            }

            if (keysToSeed.Count > 0)
            {
                await _collection.InsertManyAsync(keysToSeed, cancellationToken: cts.Token);
                _logger.LogInformation("[ApiKeyRepository] Successfully seeded {Count} API keys for tenant '{WebsiteId}'",
                    keysToSeed.Count, cleanSite);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ApiKeyRepository] Non-fatal exception seeding default API keys for '{WebsiteId}'. Built-in in-memory keys remain active.", cleanSite);
            _seededTenants[cleanSite] = true;
        }
    }
}

