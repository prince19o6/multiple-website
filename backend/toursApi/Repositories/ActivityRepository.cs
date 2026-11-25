using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ToursApi.Common;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class ActivityRepository : IActivityRepository
{
    private readonly IMongoCollection<Activity> _collection;
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private readonly ILogger<ActivityRepository>? _logger;
    private static readonly ConcurrentDictionary<string, List<Activity>> _diskCache = new(StringComparer.OrdinalIgnoreCase);

    public ActivityRepository(
        IMongoDatabase database,
        IHttpContextAccessor? httpContextAccessor = null,
        ILogger<ActivityRepository>? logger = null)
    {
        _collection = database.GetCollection<Activity>("activities");
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    private void SetDataSourceHeader(string source)
    {
        try
        {
            var res = _httpContextAccessor?.HttpContext?.Response;
            if (res != null && !res.HasStarted)
            {
                res.Headers["X-Data-Source"] = source;
            }
        }
        catch { }
    }

    private string GetWebsiteId()
    {
        var dbName = _collection.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Activity> LoadDiskSeed(string siteId)
    {
        return _diskCache.GetOrAdd(siteId, key =>
        {
            var candidates = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "seed", key, "activities.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "seed", key, "activities.json"),
                Path.Combine(AppContext.BaseDirectory, "seed", key, "activities.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "seed", "gujjutours", "activities.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "seed", "gujjutours", "activities.json")
            };

            foreach (var p in candidates)
            {
                if (File.Exists(p))
                {
                    try
                    {
                        var json = File.ReadAllText(p);
                        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var items = JsonSerializer.Deserialize<List<Activity>>(json, opts);
                        if (items != null && items.Count > 0)
                        {
                            return items;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger?.LogWarning(ex, "[ActivityRepository] Failed deserializing seed from {Path}", p);
                    }
                }
            }

            return new List<Activity>();
        });
    }

    public async Task<ActivityPagedResult> GetActivitiesAsync(ActivityFilterParams filters)
    {
        var siteId = GetWebsiteId();
        var page = filters.Page > 0 ? filters.Page : 1;
        var pageSize = filters.PageSize > 0 ? filters.PageSize : 20;

        try
        {
            var builder = Builders<Activity>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(filters.Category) && !filters.Category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var pat = Regex.Escape(filters.Category.Trim());
                var reg = new BsonRegularExpression($"^{pat}$", "i");
                filter &= (builder.Regex(a => a.Category, reg) | builder.Regex(a => a.CategorySlug, reg));
            }

            if (!string.IsNullOrWhiteSpace(filters.Search))
            {
                var s = Regex.Escape(filters.Search.Trim());
                var reg = new BsonRegularExpression(s, "i");
                filter &= (builder.Regex(a => a.Title, reg) | builder.Regex(a => a.Description, reg) | builder.Regex(a => a.Location, reg) | builder.Regex(a => a.City, reg));
            }

            if (!string.IsNullOrWhiteSpace(filters.Destination))
            {
                var d = Regex.Escape(filters.Destination.Trim());
                var reg = new BsonRegularExpression(d, "i");
                filter &= (builder.Regex(a => a.Location, reg) | builder.Regex(a => a.City, reg) | builder.Regex(a => a.Country, reg));
            }

            if (filters.MinPrice.HasValue)
            {
                filter &= builder.Gte(a => a.Price, filters.MinPrice.Value);
            }

            if (filters.MaxPrice.HasValue)
            {
                filter &= builder.Lte(a => a.Price, filters.MaxPrice.Value);
            }

            if (filters.PureVegOnly == true)
            {
                filter &= builder.Eq("dietaryFeatures.pureVeg", true);
            }

            if (filters.JainOnly == true)
            {
                filter &= builder.Eq("dietaryFeatures.jainAvailable", true);
            }

            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(3));
            var total = await _collection.CountDocumentsAsync(filter, cancellationToken: cts.Token);

            if (total > 0)
            {
                var query = _collection.Find(filter);

                query = filters.Sort?.ToLowerInvariant() switch
                {
                    "price_asc" or "price-low" => query.SortBy(a => a.Price),
                    "price_desc" or "price-high" => query.SortByDescending(a => a.Price),
                    "rating" => query.SortByDescending(a => a.Rating),
                    "newest" => query.SortByDescending(a => a.CreatedAt),
                    _ => query.SortByDescending(a => a.Featured).ThenByDescending(a => a.Rating)
                };

                var items = await query.Skip((page - 1) * pageSize).Limit(pageSize).ToListAsync(cts.Token);
                UniqueImageRegistry.EnforceUniqueImages(items);
                SetDataSourceHeader("mongodb");

                return new ActivityPagedResult
                {
                    Items = items,
                    Total = total,
                    Page = page,
                    PageSize = pageSize
                };
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[ActivityRepository.GetActivitiesAsync] MongoDB query failed. Falling back to disk seed.");
        }

        // Resilient disk JSON fallback
        SetDataSourceHeader("seed-fallback");
        var list = LoadDiskSeed(siteId);

        var queryable = list.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(filters.Category) && !filters.Category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            queryable = queryable.Where(a =>
                string.Equals(a.Category, filters.Category.Trim(), StringComparison.OrdinalIgnoreCase) ||
                string.Equals(a.CategorySlug, filters.Category.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var q = filters.Search.Trim().ToLowerInvariant();
            queryable = queryable.Where(a =>
                (a.Title != null && a.Title.ToLowerInvariant().Contains(q)) ||
                (a.Description != null && a.Description.ToLowerInvariant().Contains(q)) ||
                (a.Location != null && a.Location.ToLowerInvariant().Contains(q)) ||
                (a.City != null && a.City.ToLowerInvariant().Contains(q)));
        }

        if (!string.IsNullOrWhiteSpace(filters.Destination))
        {
            var d = filters.Destination.Trim().ToLowerInvariant();
            queryable = queryable.Where(a =>
                (a.Location != null && a.Location.ToLowerInvariant().Contains(d)) ||
                (a.City != null && a.City.ToLowerInvariant().Contains(d)) ||
                (a.Country != null && a.Country.ToLowerInvariant().Contains(d)));
        }

        if (filters.MinPrice.HasValue) queryable = queryable.Where(a => a.Price >= filters.MinPrice.Value);
        if (filters.MaxPrice.HasValue) queryable = queryable.Where(a => a.Price <= filters.MaxPrice.Value);
        if (filters.PureVegOnly == true) queryable = queryable.Where(a => a.DietaryFeatures?.PureVeg == true);
        if (filters.JainOnly == true) queryable = queryable.Where(a => a.DietaryFeatures?.JainAvailable == true);

        queryable = filters.Sort?.ToLowerInvariant() switch
        {
            "price_asc" or "price-low" => queryable.OrderBy(a => a.Price),
            "price_desc" or "price-high" => queryable.OrderByDescending(a => a.Price),
            "rating" => queryable.OrderByDescending(a => a.Rating),
            _ => queryable.OrderByDescending(a => a.Featured).ThenByDescending(a => a.Rating)
        };

        var filteredList = queryable.ToList();
        var pagedItems = filteredList.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        UniqueImageRegistry.EnforceUniqueImages(pagedItems);

        return new ActivityPagedResult
        {
            Items = pagedItems,
            Total = filteredList.Count,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<Activity?> GetActivityByIdOrSlugAsync(string idOrSlug)
    {
        if (string.IsNullOrWhiteSpace(idOrSlug)) return null;
        var clean = idOrSlug.Trim();
        var siteId = GetWebsiteId();

        try
        {
            var builder = Builders<Activity>.Filter;
            FilterDefinition<Activity> filter;

            if (ObjectId.TryParse(clean, out _))
            {
                filter = builder.Eq(a => a.Id, clean) | builder.Eq(a => a.Slug, clean);
            }
            else if (int.TryParse(clean, out var numId))
            {
                filter = builder.Eq(a => a.ActivityNumericId, numId) | builder.Eq(a => a.Slug, clean);
            }
            else
            {
                filter = builder.Eq(a => a.Slug, clean);
            }

            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(3));
            var item = await _collection.Find(filter).FirstOrDefaultAsync(cts.Token);
            if (item != null)
            {
                SetDataSourceHeader("mongodb");
                return item;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[ActivityRepository.GetActivityByIdOrSlugAsync] MongoDB lookup failed for {IdOrSlug}", clean);
        }

        // Resilient disk fallback
        SetDataSourceHeader("seed-fallback");
        var list = LoadDiskSeed(siteId);

        return list.FirstOrDefault(a =>
            string.Equals(a.Slug, clean, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(a.Id, clean, StringComparison.OrdinalIgnoreCase) ||
            a.ActivityNumericId.ToString() == clean);
    }

    public async Task<List<string>> GetCategoriesAsync()
    {
        var siteId = GetWebsiteId();
        try
        {
            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(3));
            var cats = await _collection.Distinct(a => a.Category, Builders<Activity>.Filter.Empty).ToListAsync(cts.Token);
            if (cats != null && cats.Count > 0)
            {
                SetDataSourceHeader("mongodb");
                return cats.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToList();
            }
        }
        catch { }

        SetDataSourceHeader("seed-fallback");
        var list = LoadDiskSeed(siteId);
        return list.Select(a => a.Category).Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToList();
    }
}
