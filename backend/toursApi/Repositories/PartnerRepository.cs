using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class PartnerRepository : IPartnerRepository
{
    private readonly IMongoCollection<Partner> _collection;
    private static readonly ConcurrentDictionary<string, List<Partner>> _memCache = new(StringComparer.OrdinalIgnoreCase);

    public PartnerRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<Partner>("partners");
    }

    private string GetWebsiteId()
    {
        var dbName = _collection.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Partner> GetFallbackPartners()
    {
        var siteId = GetWebsiteId();
        return _memCache.GetOrAdd(siteId, key =>
        {
            var list = SeedDataCatalog.GetPartners(key);
            for (int i = 0; i < list.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(list[i].Id))
                {
                    list[i].Id = $"partner-{key}-{i + 1}";
                }
            }
            return list;
        });
    }

    public async Task<List<Partner>> GetPartnersAsync(string? category = null, bool activeOnly = true)
    {
        try
        {
            var builder = Builders<Partner>.Filter;
            var filter = builder.Empty;

            if (activeOnly)
            {
                filter &= builder.Eq(p => p.IsActive, true);
            }

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var clean = category.Trim().ToLowerInvariant();
                filter &= builder.Eq(p => p.Category, clean);
            }

            var list = await _collection.Find(filter)
                .SortBy(p => p.SortOrder)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync();

            if (list != null && list.Count > 0) return list;
        }
        catch
        {
            // Fall back to seed catalog
        }

        var fallback = GetFallbackPartners().AsEnumerable();
        if (activeOnly) fallback = fallback.Where(p => p.IsActive);
        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var clean = category.Trim().ToLowerInvariant();
            fallback = fallback.Where(p => string.Equals(p.Category, clean, StringComparison.OrdinalIgnoreCase));
        }

        return fallback.OrderBy(p => p.SortOrder).ThenByDescending(p => p.CreatedAt).ToList();
    }

    public async Task<Partner?> GetByIdAsync(string id)
    {
        try
        {
            var item = await _collection.Find(p => p.Id == id).FirstOrDefaultAsync();
            if (item != null) return item;
        }
        catch { }

        return GetFallbackPartners().FirstOrDefault(p => p.Id == id);
    }

    public async Task<Partner> CreateAsync(Partner partner)
    {
        partner.CreatedAt = DateTime.UtcNow;
        partner.UpdatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(partner.Id))
        {
            partner.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        }

        try
        {
            await _collection.InsertOneAsync(partner);
        }
        catch { }

        var list = GetFallbackPartners();
        lock (list)
        {
            list.Insert(0, partner);
        }

        return partner;
    }

    public async Task<bool> UpdateAsync(string id, Partner partner)
    {
        partner.UpdatedAt = DateTime.UtcNow;
        var modified = false;

        try
        {
            var result = await _collection.ReplaceOneAsync(p => p.Id == id, partner);
            modified = result.IsAcknowledged && result.ModifiedCount > 0;
        }
        catch { }

        var list = GetFallbackPartners();
        lock (list)
        {
            var idx = list.FindIndex(p => p.Id == id);
            if (idx >= 0)
            {
                list[idx] = partner;
                modified = true;
            }
        }

        return modified;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var deleted = false;
        try
        {
            var result = await _collection.DeleteOneAsync(p => p.Id == id);
            deleted = result.IsAcknowledged && result.DeletedCount > 0;
        }
        catch { }

        var list = GetFallbackPartners();
        lock (list)
        {
            var count = list.RemoveAll(p => p.Id == id);
            if (count > 0) deleted = true;
        }

        return deleted;
    }

    public async Task<bool> ToggleActiveAsync(string id)
    {
        var item = await GetByIdAsync(id);
        if (item == null) return false;

        item.IsActive = !item.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        try
        {
            var update = Builders<Partner>.Update
                .Set(p => p.IsActive, item.IsActive)
                .Set(p => p.UpdatedAt, item.UpdatedAt);

            await _collection.UpdateOneAsync(p => p.Id == id, update);
        }
        catch { }

        return true;
    }
}
