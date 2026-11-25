using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Common;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class TravelVideoRepository : ITravelVideoRepository
{
    private readonly IMongoCollection<TravelVideo> _collection;
    private static readonly ConcurrentDictionary<string, List<TravelVideo>> _memCache = new(StringComparer.OrdinalIgnoreCase);

    public TravelVideoRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<TravelVideo>("travel_videos");
    }

    private string GetWebsiteId()
    {
        var dbName = _collection.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<TravelVideo> GetFallbackVideos()
    {
        var siteId = GetWebsiteId();
        return _memCache.GetOrAdd(siteId, key =>
        {
            var list = SeedDataCatalog.GetVideos(key);
            for (int i = 0; i < list.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(list[i].Id))
                {
                    list[i].Id = $"video-{key}-{i + 1}";
                }
            }
            return list;
        });
    }

    public async Task<List<TravelVideo>> GetVideosAsync(string? module = null, string? destination = null, bool activeOnly = true)
    {
        try
        {
            var builder = Builders<TravelVideo>.Filter;
            var filter = builder.Empty;

            if (activeOnly)
            {
                filter &= builder.Eq(v => v.IsActive, true);
            }

            if (!string.IsNullOrWhiteSpace(module) && !module.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var clean = module.Trim().ToLowerInvariant();
                filter &= builder.Or(
                    builder.Eq(v => v.Module, clean),
                    builder.Eq(v => v.Module, "all")
                );
            }

            if (!string.IsNullOrWhiteSpace(destination))
            {
                var cleanDest = destination.Trim();
                filter &= builder.Regex(v => v.Destination, new MongoDB.Bson.BsonRegularExpression(cleanDest, "i"));
            }

            var list = await _collection.Find(filter)
                .SortBy(v => v.SortOrder)
                .ThenByDescending(v => v.CreatedAt)
                .ToListAsync();

            if (list != null && list.Count > 0)
            {
                UniqueImageRegistry.EnforceUniqueImages(list);
                return list;
            }
        }
        catch
        {
            // Fall back to seed catalog
        }

        var fallback = GetFallbackVideos().AsEnumerable();
        if (activeOnly) fallback = fallback.Where(v => v.IsActive);
        if (!string.IsNullOrWhiteSpace(module) && !module.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var clean = module.Trim().ToLowerInvariant();
            fallback = fallback.Where(v => string.Equals(v.Module, clean, StringComparison.OrdinalIgnoreCase) ||
                                           string.Equals(v.Module, "all", StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(destination))
        {
            var cleanDest = destination.Trim();
            fallback = fallback.Where(v => v.Destination != null && v.Destination.Contains(cleanDest, StringComparison.OrdinalIgnoreCase));
        }

        var resultList = fallback.OrderBy(v => v.SortOrder).ThenByDescending(v => v.CreatedAt).ToList();
        UniqueImageRegistry.EnforceUniqueImages(resultList);
        return resultList;
    }

    public async Task<TravelVideo?> GetByIdAsync(string id)
    {
        try
        {
            var item = await _collection.Find(v => v.Id == id).FirstOrDefaultAsync();
            if (item != null) return item;
        }
        catch { }

        return GetFallbackVideos().FirstOrDefault(v => v.Id == id);
    }

    public async Task<TravelVideo> CreateAsync(TravelVideo video)
    {
        video.CreatedAt = DateTime.UtcNow;
        video.UpdatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(video.Id))
        {
            video.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        }

        try
        {
            await _collection.InsertOneAsync(video);
        }
        catch { }

        var list = GetFallbackVideos();
        lock (list)
        {
            list.Insert(0, video);
        }

        return video;
    }

    public async Task<bool> UpdateAsync(string id, TravelVideo video)
    {
        video.UpdatedAt = DateTime.UtcNow;
        var modified = false;

        try
        {
            var result = await _collection.ReplaceOneAsync(v => v.Id == id, video);
            modified = result.IsAcknowledged && result.ModifiedCount > 0;
        }
        catch { }

        var list = GetFallbackVideos();
        lock (list)
        {
            var idx = list.FindIndex(v => v.Id == id);
            if (idx >= 0)
            {
                list[idx] = video;
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
            var result = await _collection.DeleteOneAsync(v => v.Id == id);
            deleted = result.IsAcknowledged && result.DeletedCount > 0;
        }
        catch { }

        var list = GetFallbackVideos();
        lock (list)
        {
            var count = list.RemoveAll(v => v.Id == id);
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
            var update = Builders<TravelVideo>.Update
                .Set(v => v.IsActive, item.IsActive)
                .Set(v => v.UpdatedAt, item.UpdatedAt);

            await _collection.UpdateOneAsync(v => v.Id == id, update);
        }
        catch { }

        return true;
    }
}
