using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class StaticPageRepository : IStaticPageRepository
{
    private readonly IMongoCollection<StaticPage> _collection;
    private static readonly ConcurrentDictionary<string, List<StaticPage>> _memCache = new(StringComparer.OrdinalIgnoreCase);

    public StaticPageRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<StaticPage>("static_pages");
    }

    private string GetWebsiteId()
    {
        var dbName = _collection.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<StaticPage> GetFallbackPages()
    {
        var siteId = GetWebsiteId();
        return _memCache.GetOrAdd(siteId, key =>
        {
            var list = SeedDataCatalog.GetStaticPages(key);
            for (int i = 0; i < list.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(list[i].Id))
                {
                    list[i].Id = $"page-{key}-{i + 1}";
                }
            }
            return list;
        });
    }

    public async Task<List<StaticPage>> GetAllPagesAsync(bool activeOnly = false)
    {
        try
        {
            var builder = Builders<StaticPage>.Filter;
            var filter = activeOnly ? builder.Eq(p => p.IsActive, true) : builder.Empty;

            var list = await _collection.Find(filter)
                .SortBy(p => p.Slug)
                .ToListAsync();

            if (list != null && list.Count > 0) return list;
        }
        catch
        {
            // Fall back to seed catalog
        }

        var fallback = GetFallbackPages().AsEnumerable();
        if (activeOnly) fallback = fallback.Where(p => p.IsActive);
        return fallback.OrderBy(p => p.Slug).ToList();
    }

    public async Task<StaticPage?> GetBySlugAsync(string slug)
    {
        var clean = slug.Trim().ToLowerInvariant();
        try
        {
            var item = await _collection.Find(p => p.Slug == clean && p.IsActive).FirstOrDefaultAsync();
            if (item != null) return item;
        }
        catch { }

        return GetFallbackPages().FirstOrDefault(p => string.Equals(p.Slug, clean, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<StaticPage?> GetByIdAsync(string id)
    {
        try
        {
            var item = await _collection.Find(p => p.Id == id).FirstOrDefaultAsync();
            if (item != null) return item;
        }
        catch { }

        return GetFallbackPages().FirstOrDefault(p => p.Id == id || string.Equals(p.Slug, id, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<StaticPage> CreateAsync(StaticPage page)
    {
        page.Slug = page.Slug.Trim().ToLowerInvariant();
        page.CreatedAt = DateTime.UtcNow;
        page.UpdatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(page.Id))
        {
            page.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        }

        try
        {
            await _collection.InsertOneAsync(page);
        }
        catch { }

        var list = GetFallbackPages();
        lock (list)
        {
            list.Insert(0, page);
        }

        return page;
    }

    public async Task<bool> UpdateAsync(string id, StaticPage page)
    {
        page.Slug = page.Slug.Trim().ToLowerInvariant();
        page.UpdatedAt = DateTime.UtcNow;
        var modified = false;

        try
        {
            var result = await _collection.ReplaceOneAsync(p => p.Id == id, page);
            modified = result.IsAcknowledged && result.ModifiedCount > 0;
        }
        catch { }

        var list = GetFallbackPages();
        lock (list)
        {
            var idx = list.FindIndex(p => p.Id == id || p.Slug == id);
            if (idx >= 0)
            {
                list[idx] = page;
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

        var list = GetFallbackPages();
        lock (list)
        {
            var count = list.RemoveAll(p => p.Id == id || p.Slug == id);
            if (count > 0) deleted = true;
        }

        return deleted;
    }
}
