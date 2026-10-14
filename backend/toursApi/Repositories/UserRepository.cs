using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<User> _users;

    public UserRepository(IMongoDatabase database)
    {
        _users = database.GetCollection<User>("users");
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail)) return null;

        // Fast path: Exact match on normalized email (uses standard index)
        var user = await _users.Find(Builders<User>.Filter.Eq(u => u.Email, normalizedEmail)).FirstOrDefaultAsync();
        if (user != null) return user;

        // Resilient fallback: Case-insensitive regex match for legacy unnormalized records
        var regex = new BsonRegularExpression($"^{Regex.Escape(normalizedEmail)}$", "i");
        var filter = Builders<User>.Filter.Regex(u => u.Email, regex);
        return await _users.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, id);
        return await _users.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        var filter = Builders<User>.Filter.ElemMatch(
            u => u.RefreshTokens,
            rt => rt.Token == refreshToken && rt.RevokedAtUtc == null
        );
        return await _users.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<User?> GetByResetTokenHashAsync(string resetTokenHash)
    {
        var filter = Builders<User>.Filter.Eq(u => u.PasswordResetTokenHash, resetTokenHash);
        return await _users.Find(filter).FirstOrDefaultAsync();
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

        await _users.InsertOneAsync(user);
        return user;
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _users.Find(FilterDefinition<User>.Empty).ToListAsync();
    }

    public async Task UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        var filter = Builders<User>.Filter.Eq(u => u.Id, user.Id);
        await _users.ReplaceOneAsync(filter, user, new ReplaceOptions { IsUpsert = false });
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, id);
        var result = await _users.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
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
