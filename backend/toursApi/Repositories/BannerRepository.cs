using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class BannerRepository : IBannerRepository
{
    private readonly IMongoCollection<Banner> _collection;
    private static readonly ConcurrentDictionary<string, List<Banner>> _memCache = new(StringComparer.OrdinalIgnoreCase);

    public BannerRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<Banner>("hero_banners");
    }

    private string GetWebsiteId()
    {
        var dbName = _collection.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Banner> GetFallbackBanners()
    {
        var siteId = GetWebsiteId();
        return _memCache.GetOrAdd(siteId, key =>
        {
            var list = SeedDataCatalog.GetBanners(key);
            for (int i = 0; i < list.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(list[i].Id))
                {
                    list[i].Id = $"banner-{key}-{i + 1}";
                }
            }
            return list;
        });
    }

    public async Task<List<Banner>> GetBannersAsync(string? module = null, bool activeOnly = true)
    {
        try
        {
            var builder = Builders<Banner>.Filter;
            var filter = builder.Empty;

            if (activeOnly)
            {
                filter &= builder.Eq(b => b.IsActive, true);
            }

            if (!string.IsNullOrWhiteSpace(module) && !module.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var cleanModule = module.Trim().ToLowerInvariant();
                filter &= builder.Or(
                    builder.Eq(b => b.Module, cleanModule),
                    builder.Eq(b => b.Module, "home"),
                    builder.Eq(b => b.Module, "all")
                );
            }

            var list = await _collection.Find(filter)
                .SortBy(b => b.SortOrder)
                .ThenByDescending(b => b.CreatedAt)
                .ToListAsync();

            if (list != null && list.Count > 0) return list;
        }
        catch
        {
            // Fall back to seed catalog
        }

        var fallback = GetFallbackBanners().AsEnumerable();
        if (activeOnly) fallback = fallback.Where(b => b.IsActive);
        if (!string.IsNullOrWhiteSpace(module) && !module.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cleanModule = module.Trim().ToLowerInvariant();
            fallback = fallback.Where(b => string.Equals(b.Module, cleanModule, StringComparison.OrdinalIgnoreCase) ||
                                           string.Equals(b.Module, "home", StringComparison.OrdinalIgnoreCase) ||
                                           string.Equals(b.Module, "all", StringComparison.OrdinalIgnoreCase));
        }

        return fallback.OrderBy(b => b.SortOrder).ThenByDescending(b => b.CreatedAt).ToList();
    }

    public async Task<Banner?> GetByIdAsync(string id)
    {
        try
        {
            var item = await _collection.Find(b => b.Id == id).FirstOrDefaultAsync();
            if (item != null) return item;
        }
        catch { }

        return GetFallbackBanners().FirstOrDefault(b => b.Id == id);
    }

    public async Task<Banner> CreateAsync(Banner banner)
    {
        banner.CreatedAt = DateTime.UtcNow;
        banner.UpdatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(banner.Id))
        {
            banner.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        }

        try
        {
            await _collection.InsertOneAsync(banner);
        }
        catch { }

        var list = GetFallbackBanners();
        lock (list)
        {
            list.Insert(0, banner);
        }

        return banner;
    }

    public async Task<bool> UpdateAsync(string id, Banner banner)
    {
        banner.UpdatedAt = DateTime.UtcNow;
        var modified = false;

        try
        {
            var result = await _collection.ReplaceOneAsync(b => b.Id == id, banner);
            modified = result.IsAcknowledged && result.ModifiedCount > 0;
        }
        catch { }

        var list = GetFallbackBanners();
        lock (list)
        {
            var idx = list.FindIndex(b => b.Id == id);
            if (idx >= 0)
            {
                list[idx] = banner;
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
            var result = await _collection.DeleteOneAsync(b => b.Id == id);
            deleted = result.IsAcknowledged && result.DeletedCount > 0;
        }
        catch { }

        var list = GetFallbackBanners();
        lock (list)
        {
            var count = list.RemoveAll(b => b.Id == id);
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
            var update = Builders<Banner>.Update
                .Set(b => b.IsActive, item.IsActive)
                .Set(b => b.UpdatedAt, item.UpdatedAt);

            await _collection.UpdateOneAsync(b => b.Id == id, update);
        }
        catch { }

        return true;
    }

    public async Task<bool> ReorderAsync(List<string> orderedIds)
    {
        if (orderedIds == null || orderedIds.Count == 0) return true;

        try
        {
            for (int i = 0; i < orderedIds.Count; i++)
            {
                var id = orderedIds[i];
                var update = Builders<Banner>.Update
                    .Set(b => b.SortOrder, i)
                    .Set(b => b.UpdatedAt, DateTime.UtcNow);
                await _collection.UpdateOneAsync(b => b.Id == id, update);
            }
        }
        catch { }

        var list = GetFallbackBanners();
        lock (list)
        {
            for (int i = 0; i < orderedIds.Count; i++)
            {
                var id = orderedIds[i];
                var item = list.FirstOrDefault(b => b.Id == id);
                if (item != null) item.SortOrder = i;
            }
        }

        return true;
    }
}
