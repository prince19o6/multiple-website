using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IApiKeyRepository
{
    /// <summary>
    /// Computes deterministic SHA-256 hash in lowercase hex format.
    /// </summary>
    string ComputeKeyHash(string plainKey);

    /// <summary>
    /// Validates plain key against hashed keys in the database.
    /// Ensures key is active, not revoked, not expired, matches the tenant, and authorizes the given hostname.
    /// </summary>
    Task<ApiKey?> ValidateKeyAsync(string plainKey, string websiteId, string hostname, string? requiredScope = null);

    /// <summary>
    /// Looks up key metadata by its SHA-256 hash.
    /// </summary>
    Task<ApiKey?> GetByKeyHashAsync(string keyHash);

    /// <summary>
    /// Retrieves all keys defined for a tenant.
    /// </summary>
    Task<IEnumerable<ApiKey>> GetKeysForWebsiteAsync(string websiteId);

    /// <summary>
    /// Inserts a new pre-hashed key record into the tenant database.
    /// </summary>
    Task<ApiKey> CreateKeyAsync(ApiKey apiKey);

    /// <summary>
    /// Revokes an existing key with an audit reason.
    /// </summary>
    Task<bool> RevokeKeyAsync(string keyId, string reason = "Manual revocation");

    /// <summary>
    /// Rotates a key by creating a new active key and marking the old one as rotated/deprecated.
    /// </summary>
    Task<ApiKey> RotateKeyAsync(string oldKeyId, string newPlainKey, string newPrefix);

    /// <summary>
    /// Records timestamp of key usage.
    /// </summary>
    Task UpdateLastUsedAsync(string keyId);

    /// <summary>
    /// Seeds default development/staging keys for the active tenant if collection is empty.
    /// </summary>
    Task SeedDefaultKeysIfEmptyAsync(string websiteId);
}

