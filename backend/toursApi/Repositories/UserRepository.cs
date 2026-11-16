using MongoDB.Bson;
using MongoDB.Bson.IO;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<User> _users;
    private readonly ILogger<UserRepository>? _logger;
    private static readonly ConcurrentDictionary<string, List<User>> _localUserCache = new(StringComparer.OrdinalIgnoreCase);
    private static readonly object _fileLock = new();

    public UserRepository(IMongoDatabase database, ILogger<UserRepository>? logger = null)
    {
        _users = database.GetCollection<User>("users");
        _logger = logger;
    }

    private string GetDatabaseName() =>
        _users.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private string GetLocalStorePath(string siteId)
    {
        var currentDir = Directory.GetCurrentDirectory();
        var candidates = new[]
        {
            Path.Combine(currentDir, "data", $"users.{siteId}.json"),
            Path.Combine(AppContext.BaseDirectory, "data", $"users.{siteId}.json"),
            Path.Combine(currentDir, "seed", $"users.{siteId}.json"),
            Path.Combine(AppContext.BaseDirectory, "seed", $"users.{siteId}.json"),
        };

        foreach (var p in candidates)
        {
            if (File.Exists(p)) return p;
        }

        var preferredDir = Path.Combine(currentDir, "data");
        try
        {
            if (!Directory.Exists(preferredDir))
            {
                Directory.CreateDirectory(preferredDir);
            }
        }
        catch { }

        return Path.Combine(preferredDir, $"users.{siteId}.json");
    }

    private List<User> GetLocalUsers(string siteId)
    {
        return _localUserCache.GetOrAdd(siteId, key =>
        {
            lock (_fileLock)
            {
                var filePath = GetLocalStorePath(key);
                if (File.Exists(filePath))
                {
                    try
                    {
                        var json = File.ReadAllText(filePath);
                        var docArray = BsonSerializer.Deserialize<BsonArray>(json);
                        var list = docArray.Select(d => BsonSerializer.Deserialize<User>(d.AsBsonDocument)).ToList();
                        if (list != null) return list;
                    }
                    catch (Exception ex)
                    {
                        _logger?.LogWarning(ex, "[UserRepository] Failed reading local user file {Path}", filePath);
                    }
                }
                return new List<User>();
            }
        });
    }

    private void SaveLocalUsers(string siteId)
    {
        lock (_fileLock)
        {
            try
            {
                if (_localUserCache.TryGetValue(siteId, out var users))
                {
                    var filePath = GetLocalStorePath(siteId);
                    var dir = Path.GetDirectoryName(filePath);
                    if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                    {
                        Directory.CreateDirectory(dir);
                    }

                    var docArray = new BsonArray(users.Select(u => u.ToBsonDocument()));
                    var json = docArray.ToJson(new JsonWriterSettings { Indent = true });
                    File.WriteAllText(filePath, json);
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "[UserRepository] Failed saving local users for {SiteId}", siteId);
            }
        }
    }

    private void UpsertLocalCache(string siteId, User user)
    {
        var list = GetLocalUsers(siteId);
        lock (_fileLock)
        {
            var idx = list.FindIndex(u =>
                (!string.IsNullOrEmpty(u.Id) && string.Equals(u.Id, user.Id, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrEmpty(u.Email) && string.Equals(u.Email, user.Email, StringComparison.OrdinalIgnoreCase)));

            if (idx >= 0)
            {
                list[idx] = user;
            }
            else
            {
                list.Add(user);
            }
        }
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail)) return null;

        var siteId = GetWebsiteId();

        try
        {
            var user = await _users.Find(Builders<User>.Filter.Eq(u => u.Email, normalizedEmail)).FirstOrDefaultAsync();
            if (user != null)
            {
                UpsertLocalCache(siteId, user);
                return user;
            }

            var regex = new BsonRegularExpression($"^{Regex.Escape(normalizedEmail)}$", "i");
            var filter = Builders<User>.Filter.Regex(u => u.Email, regex);
            user = await _users.Find(filter).FirstOrDefaultAsync();
            if (user != null)
            {
                UpsertLocalCache(siteId, user);
                return user;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.GetByEmailAsync] MongoDB query failed for '{Db}'. Falling back to local store.", GetDatabaseName());
        }

        var localList = GetLocalUsers(siteId);
        lock (_fileLock)
        {
            return localList.FirstOrDefault(u => string.Equals(u.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase));
        }
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;
        var siteId = GetWebsiteId();

        try
        {
            var filter = Builders<User>.Filter.Eq(u => u.Id, id);
            var user = await _users.Find(filter).FirstOrDefaultAsync();
            if (user != null)
            {
                UpsertLocalCache(siteId, user);
                return user;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.GetByIdAsync] MongoDB query failed. Querying local store.");
        }

        var localList = GetLocalUsers(siteId);
        lock (_fileLock)
        {
            return localList.FirstOrDefault(u => string.Equals(u.Id, id, StringComparison.OrdinalIgnoreCase));
        }
    }

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return null;
        var siteId = GetWebsiteId();

        try
        {
            var filter = Builders<User>.Filter.ElemMatch(
                u => u.RefreshTokens,
                rt => (rt.Token == refreshToken || rt.TokenHash == refreshToken) && rt.RevokedAtUtc == null
            );
            var user = await _users.Find(filter).FirstOrDefaultAsync();
            if (user != null)
            {
                UpsertLocalCache(siteId, user);
                return user;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.GetByRefreshTokenAsync] MongoDB query failed. Falling back to local store.");
        }

        var localList = GetLocalUsers(siteId);
        lock (_fileLock)
        {
            return localList.FirstOrDefault(u => u.RefreshTokens != null &&
                u.RefreshTokens.Any(rt => (rt.Token == refreshToken || rt.TokenHash == refreshToken) && rt.RevokedAtUtc == null));
        }
    }

    public async Task<User?> GetByRefreshTokenHashAsync(string tokenHash)
    {
        if (string.IsNullOrWhiteSpace(tokenHash)) return null;
        var siteId = GetWebsiteId();

        try
        {
            var filter = Builders<User>.Filter.ElemMatch(
                u => u.RefreshTokens,
                rt => (rt.TokenHash == tokenHash || rt.Token == tokenHash)
            );
            var user = await _users.Find(filter).FirstOrDefaultAsync();
            if (user != null)
            {
                UpsertLocalCache(siteId, user);
                return user;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.GetByRefreshTokenHashAsync] MongoDB query failed. Falling back to local store.");
        }

        var localList = GetLocalUsers(siteId);
        lock (_fileLock)
        {
            return localList.FirstOrDefault(u => u.RefreshTokens != null &&
                u.RefreshTokens.Any(rt => rt.TokenHash == tokenHash || rt.Token == tokenHash));
        }
    }

    public async Task<User?> GetByEmailVerificationTokenHashAsync(string tokenHash)
    {
        if (string.IsNullOrWhiteSpace(tokenHash)) return null;
        var siteId = GetWebsiteId();

        try
        {
            var filter = Builders<User>.Filter.Eq(u => u.EmailVerificationTokenHash, tokenHash);
            var user = await _users.Find(filter).FirstOrDefaultAsync();
            if (user != null)
            {
                UpsertLocalCache(siteId, user);
                return user;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.GetByEmailVerificationTokenHashAsync] MongoDB query failed. Falling back to local store.");
        }

        var localList = GetLocalUsers(siteId);
        lock (_fileLock)
        {
            return localList.FirstOrDefault(u => string.Equals(u.EmailVerificationTokenHash, tokenHash, StringComparison.Ordinal));
        }
    }

    public async Task<User?> GetByResetTokenHashAsync(string resetTokenHash)
    {
        if (string.IsNullOrWhiteSpace(resetTokenHash)) return null;
        var siteId = GetWebsiteId();

        try
        {
            var filter = Builders<User>.Filter.Eq(u => u.PasswordResetTokenHash, resetTokenHash);
            var user = await _users.Find(filter).FirstOrDefaultAsync();
            if (user != null)
            {
                UpsertLocalCache(siteId, user);
                return user;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.GetByResetTokenHashAsync] MongoDB query failed. Falling back to local store.");
        }

        var localList = GetLocalUsers(siteId);
        lock (_fileLock)
        {
            return localList.FirstOrDefault(u => string.Equals(u.PasswordResetTokenHash, resetTokenHash, StringComparison.Ordinal));
        }
    }

    public async Task<User> CreateAsync(User user)
    {
        user.Email = user.Email.Trim().ToLowerInvariant();
        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        if (string.IsNullOrEmpty(user.Id))
        {
            user.Id = ObjectId.GenerateNewId().ToString();
        }

        var siteId = GetWebsiteId();

        // Always save to resilient local cache and disk file
        UpsertLocalCache(siteId, user);
        SaveLocalUsers(siteId);

        try
        {
            await _users.InsertOneAsync(user);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.CreateAsync] MongoDB insert failed for user '{Email}' in '{Db}'. Safely persisted in resilient local store.", user.Email, GetDatabaseName());
        }

        return user;
    }

    public async Task<List<User>> GetAllAsync()
    {
        var siteId = GetWebsiteId();

        try
        {
            var list = await _users.Find(FilterDefinition<User>.Empty).ToListAsync();
            foreach (var u in list)
            {
                UpsertLocalCache(siteId, u);
            }
            return list;
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.GetAllAsync] MongoDB query failed. Returning resilient local users.");
            var localList = GetLocalUsers(siteId);
            lock (_fileLock)
            {
                return new List<User>(localList);
            }
        }
    }

    public async Task UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        var siteId = GetWebsiteId();

        UpsertLocalCache(siteId, user);
        SaveLocalUsers(siteId);

        try
        {
            var filter = Builders<User>.Filter.Eq(u => u.Id, user.Id);
            await _users.ReplaceOneAsync(filter, user, new ReplaceOptions { IsUpsert = false });
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.UpdateAsync] MongoDB update failed for '{Email}'. Updated in resilient local store.", user.Email);
        }
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var siteId = GetWebsiteId();
        bool deletedLocally = false;

        var localList = GetLocalUsers(siteId);
        lock (_fileLock)
        {
            var idx = localList.FindIndex(u => string.Equals(u.Id, id, StringComparison.OrdinalIgnoreCase));
            if (idx >= 0)
            {
                localList.RemoveAt(idx);
                deletedLocally = true;
                SaveLocalUsers(siteId);
            }
        }

        try
        {
            var filter = Builders<User>.Filter.Eq(u => u.Id, id);
            var result = await _users.DeleteOneAsync(filter);
            return result.DeletedCount > 0 || deletedLocally;
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[UserRepository.DeleteAsync] MongoDB delete failed for id '{Id}'.", id);
            return deletedLocally;
        }
    }

    public async Task<bool> UpdateRoleAsync(string id, string newRole)
    {
        var user = await GetByIdAsync(id);
        if (user == null) return false;

        user.Role = newRole;
        await UpdateAsync(user);
        return true;
    }

    public async Task<bool> UpdateStatusAsync(string id, bool isDisabled, string status)
    {
        var user = await GetByIdAsync(id);
        if (user == null) return false;

        user.IsDisabled = isDisabled;
        user.Status = status;
        await UpdateAsync(user);
        return true;
    }
}
