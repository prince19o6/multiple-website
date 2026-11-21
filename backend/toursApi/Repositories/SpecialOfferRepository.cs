using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class SpecialOfferRepository : ISpecialOfferRepository
{
    private readonly IMongoCollection<SpecialOffer> _collection;
    private static readonly ConcurrentDictionary<string, List<SpecialOffer>> _memCache = new(StringComparer.OrdinalIgnoreCase);

    public SpecialOfferRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<SpecialOffer>("special_offers");
    }

    private string GetWebsiteId()
    {
        var dbName = _collection.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<SpecialOffer> GetFallbackOffers()
    {
        var siteId = GetWebsiteId();
        return _memCache.GetOrAdd(siteId, key =>
        {
            var list = SeedDataCatalog.GetOffers(key);
            for (int i = 0; i < list.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(list[i].Id))
                {
                    list[i].Id = $"offer-{key}-{i + 1}";
                }
            }
            return list;
        });
    }

    public async Task<List<SpecialOffer>> GetOffersAsync(string? module = null, bool activeOnly = true)
    {
        try
        {
            var builder = Builders<SpecialOffer>.Filter;
            var filter = builder.Empty;

            if (activeOnly)
            {
                filter &= builder.Eq(o => o.IsActive, true);
            }

            if (!string.IsNullOrWhiteSpace(module) && !module.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var clean = module.Trim().ToLowerInvariant();
                filter &= builder.Or(
                    builder.Eq(o => o.Module, clean),
                    builder.Eq(o => o.Module, "all")
                );
            }

            var list = await _collection.Find(filter)
                .SortBy(o => o.SortOrder)
                .ThenByDescending(o => o.CreatedAt)
                .ToListAsync();

            if (list != null && list.Count > 0) return list;
        }
        catch
        {
            // Fall back to seed catalog
        }

        var fallback = GetFallbackOffers().AsEnumerable();
        if (activeOnly) fallback = fallback.Where(o => o.IsActive);
        if (!string.IsNullOrWhiteSpace(module) && !module.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var clean = module.Trim().ToLowerInvariant();
            fallback = fallback.Where(o => string.Equals(o.Module, clean, StringComparison.OrdinalIgnoreCase) ||
                                           string.Equals(o.Module, "all", StringComparison.OrdinalIgnoreCase));
        }

        return fallback.OrderBy(o => o.SortOrder).ThenByDescending(o => o.CreatedAt).ToList();
    }

    public async Task<SpecialOffer?> GetByIdAsync(string id)
    {
        try
        {
            var item = await _collection.Find(o => o.Id == id).FirstOrDefaultAsync();
            if (item != null) return item;
        }
        catch { }

        return GetFallbackOffers().FirstOrDefault(o => o.Id == id);
    }

    public async Task<SpecialOffer?> GetByCodeAsync(string code)
    {
        var clean = code.Trim().ToUpperInvariant();
        try
        {
            var item = await _collection.Find(o => o.Code == clean).FirstOrDefaultAsync();
            if (item != null) return item;
        }
        catch { }

        return GetFallbackOffers().FirstOrDefault(o => string.Equals(o.Code, clean, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<SpecialOffer> CreateAsync(SpecialOffer offer)
    {
        offer.Code = offer.Code.Trim().ToUpperInvariant();
        offer.CreatedAt = DateTime.UtcNow;
        offer.UpdatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(offer.Id))
        {
            offer.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        }

        try
        {
            await _collection.InsertOneAsync(offer);
        }
        catch { }

        var list = GetFallbackOffers();
        lock (list)
        {
            list.Insert(0, offer);
        }

        return offer;
    }

    public async Task<bool> UpdateAsync(string id, SpecialOffer offer)
    {
        offer.Code = offer.Code.Trim().ToUpperInvariant();
        offer.UpdatedAt = DateTime.UtcNow;
        var modified = false;

        try
        {
            var result = await _collection.ReplaceOneAsync(o => o.Id == id, offer);
            modified = result.IsAcknowledged && result.ModifiedCount > 0;
        }
        catch { }

        var list = GetFallbackOffers();
        lock (list)
        {
            var idx = list.FindIndex(o => o.Id == id);
            if (idx >= 0)
            {
                list[idx] = offer;
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
            var result = await _collection.DeleteOneAsync(o => o.Id == id);
            deleted = result.IsAcknowledged && result.DeletedCount > 0;
        }
        catch { }

        var list = GetFallbackOffers();
        lock (list)
        {
            var count = list.RemoveAll(o => o.Id == id);
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
            var update = Builders<SpecialOffer>.Update
                .Set(o => o.IsActive, item.IsActive)
                .Set(o => o.UpdatedAt, item.UpdatedAt);

            await _collection.UpdateOneAsync(o => o.Id == id, update);
        }
        catch { }

        return true;
    }
}
