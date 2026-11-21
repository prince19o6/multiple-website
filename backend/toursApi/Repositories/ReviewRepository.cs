using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly IMongoCollection<Review> _collection;
    private static readonly ConcurrentDictionary<string, List<Review>> _memCache = new(StringComparer.OrdinalIgnoreCase);

    public ReviewRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<Review>("reviews");
    }

    private string GetWebsiteId()
    {
        var dbName = _collection.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Review> GetFallbackReviews()
    {
        var siteId = GetWebsiteId();
        return _memCache.GetOrAdd(siteId, key =>
        {
            var list = SeedDataCatalog.GetReviews(key);
            for (int i = 0; i < list.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(list[i].Id))
                {
                    list[i].Id = $"review-{key}-{i + 1}";
                }
            }
            return list;
        });
    }

    public async Task<List<Review>> GetReviewsAsync(string? module = null, string? targetId = null, bool activeOnly = true)
    {
        try
        {
            var builder = Builders<Review>.Filter;
            var filter = builder.Empty;

            if (activeOnly)
            {
                filter &= builder.Eq(r => r.IsActive, true);
            }

            if (!string.IsNullOrWhiteSpace(module) && !module.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var clean = module.Trim().ToLowerInvariant();
                filter &= builder.Or(
                    builder.Eq(r => r.Module, clean),
                    builder.Eq(r => r.Module, "all")
                );
            }

            if (!string.IsNullOrWhiteSpace(targetId))
            {
                filter &= builder.Eq(r => r.TargetId, targetId);
            }

            var list = await _collection.Find(filter)
                .SortBy(r => r.SortOrder)
                .ThenByDescending(r => r.CreatedAt)
                .ToListAsync();

            if (list != null && list.Count > 0) return list;
        }
        catch
        {
            // Fall back to seed catalog
        }

        var fallback = GetFallbackReviews().AsEnumerable();
        if (activeOnly) fallback = fallback.Where(r => r.IsActive);
        if (!string.IsNullOrWhiteSpace(module) && !module.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var clean = module.Trim().ToLowerInvariant();
            fallback = fallback.Where(r => string.Equals(r.Module, clean, StringComparison.OrdinalIgnoreCase) ||
                                           string.Equals(r.Module, "all", StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(targetId))
        {
            fallback = fallback.Where(r => string.Equals(r.TargetId, targetId, StringComparison.OrdinalIgnoreCase));
        }

        return fallback.OrderBy(r => r.SortOrder).ThenByDescending(r => r.CreatedAt).ToList();
    }

    public async Task<Review?> GetByIdAsync(string id)
    {
        try
        {
            var item = await _collection.Find(r => r.Id == id).FirstOrDefaultAsync();
            if (item != null) return item;
        }
        catch { }

        return GetFallbackReviews().FirstOrDefault(r => r.Id == id);
    }

    public async Task<Review> CreateAsync(Review review)
    {
        review.CreatedAt = DateTime.UtcNow;
        review.UpdatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(review.Id))
        {
            review.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        }

        try
        {
            await _collection.InsertOneAsync(review);
        }
        catch { }

        var list = GetFallbackReviews();
        lock (list)
        {
            list.Insert(0, review);
        }

        return review;
    }

    public async Task<bool> UpdateAsync(string id, Review review)
    {
        review.UpdatedAt = DateTime.UtcNow;
        var modified = false;

        try
        {
            var result = await _collection.ReplaceOneAsync(r => r.Id == id, review);
            modified = result.IsAcknowledged && result.ModifiedCount > 0;
        }
        catch { }

        var list = GetFallbackReviews();
        lock (list)
        {
            var idx = list.FindIndex(r => r.Id == id);
            if (idx >= 0)
            {
                list[idx] = review;
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
            var result = await _collection.DeleteOneAsync(r => r.Id == id);
            deleted = result.IsAcknowledged && result.DeletedCount > 0;
        }
        catch { }

        var list = GetFallbackReviews();
        lock (list)
        {
            var count = list.RemoveAll(r => r.Id == id);
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
            var update = Builders<Review>.Update
                .Set(r => r.IsActive, item.IsActive)
                .Set(r => r.UpdatedAt, item.UpdatedAt);

            await _collection.UpdateOneAsync(r => r.Id == id, update);
        }
        catch { }

        return true;
    }
}
