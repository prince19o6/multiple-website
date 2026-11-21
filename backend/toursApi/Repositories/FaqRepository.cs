using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class FaqRepository : IFaqRepository
{
    private readonly IMongoCollection<FaqItem> _collection;
    private static readonly ConcurrentDictionary<string, List<FaqItem>> _memCache = new(StringComparer.OrdinalIgnoreCase);

    public FaqRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<FaqItem>("faqs");
    }

    private string GetWebsiteId()
    {
        var dbName = _collection.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<FaqItem> GetFallbackFaqs()
    {
        var siteId = GetWebsiteId();
        return _memCache.GetOrAdd(siteId, key =>
        {
            var list = SeedDataCatalog.GetFaqs(key);
            for (int i = 0; i < list.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(list[i].Id))
                {
                    list[i].Id = $"faq-{key}-{i + 1}";
                }
            }
            return list;
        });
    }

    public async Task<List<FaqItem>> GetFaqsAsync(string? category = null, bool activeOnly = true)
    {
        try
        {
            var builder = Builders<FaqItem>.Filter;
            var filter = builder.Empty;

            if (activeOnly)
            {
                filter &= builder.Eq(f => f.IsActive, true);
            }

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var clean = category.Trim().ToLowerInvariant();
                filter &= builder.Eq(f => f.Category, clean);
            }

            var list = await _collection.Find(filter)
                .SortBy(f => f.SortOrder)
                .ThenByDescending(f => f.CreatedAt)
                .ToListAsync();

            if (list != null && list.Count > 0) return list;
        }
        catch
        {
            // Fall back to seed catalog
        }

        var fallback = GetFallbackFaqs().AsEnumerable();
        if (activeOnly) fallback = fallback.Where(f => f.IsActive);
        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var clean = category.Trim().ToLowerInvariant();
            fallback = fallback.Where(f => string.Equals(f.Category, clean, StringComparison.OrdinalIgnoreCase));
        }

        return fallback.OrderBy(f => f.SortOrder).ThenByDescending(f => f.CreatedAt).ToList();
    }

    public async Task<FaqItem?> GetByIdAsync(string id)
    {
        try
        {
            var item = await _collection.Find(f => f.Id == id).FirstOrDefaultAsync();
            if (item != null) return item;
        }
        catch { }

        return GetFallbackFaqs().FirstOrDefault(f => f.Id == id);
    }

    public async Task<FaqItem> CreateAsync(FaqItem faq)
    {
        faq.CreatedAt = DateTime.UtcNow;
        faq.UpdatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(faq.Id))
        {
            faq.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        }

        try
        {
            await _collection.InsertOneAsync(faq);
        }
        catch { }

        var list = GetFallbackFaqs();
        lock (list)
        {
            list.Insert(0, faq);
        }

        return faq;
    }

    public async Task<bool> UpdateAsync(string id, FaqItem faq)
    {
        faq.UpdatedAt = DateTime.UtcNow;
        var modified = false;

        try
        {
            var result = await _collection.ReplaceOneAsync(f => f.Id == id, faq);
            modified = result.IsAcknowledged && result.ModifiedCount > 0;
        }
        catch { }

        var list = GetFallbackFaqs();
        lock (list)
        {
            var idx = list.FindIndex(f => f.Id == id);
            if (idx >= 0)
            {
                list[idx] = faq;
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
            var result = await _collection.DeleteOneAsync(f => f.Id == id);
            deleted = result.IsAcknowledged && result.DeletedCount > 0;
        }
        catch { }

        var list = GetFallbackFaqs();
        lock (list)
        {
            var count = list.RemoveAll(f => f.Id == id);
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
            var update = Builders<FaqItem>.Update
                .Set(f => f.IsActive, item.IsActive)
                .Set(f => f.UpdatedAt, item.UpdatedAt);

            await _collection.UpdateOneAsync(f => f.Id == id, update);
        }
        catch { }

        return true;
    }
}
