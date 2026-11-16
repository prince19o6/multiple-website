using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly IMongoCollection<Category> _categories;
    private static readonly ConcurrentDictionary<string, List<Category>> _seedCache = new(StringComparer.OrdinalIgnoreCase);

    public CategoryRepository(IMongoDatabase database)
    {
        _categories = database.GetCollection<Category>("categories");
    }

    private string GetWebsiteId()
    {
        var dbName = _categories.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Category> GetSeedCategories()
    {
        var siteId = GetWebsiteId();
        return _seedCache.GetOrAdd(siteId, key =>
        {
            var candidates = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "seed", key, "categories.json"),
                Path.Combine(AppContext.BaseDirectory, "seed", key, "categories.json"),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "toursApi", "seed", key, "categories.json"),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "web", "seed", key, "categories.json"),
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    try
                    {
                        var json = File.ReadAllText(path);
                        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var list = JsonSerializer.Deserialize<List<Category>>(json, opts);
                        if (list != null && list.Count > 0) return list;
                    }
                    catch { }
                }
            }

            return new List<Category>();
        });
    }

    public async Task<List<Category>> GetCategoriesByModuleAsync(string module)
    {
        var cleanModule = module.ToLowerInvariant();
        try
        {
            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
            var filter = Builders<Category>.Filter.And(
                Builders<Category>.Filter.Eq(c => c.Module, cleanModule),
                Builders<Category>.Filter.Eq(c => c.Enabled, true)
            );

            var items = await _categories
                .Find(filter)
                .SortBy(c => c.Order)
                .ToListAsync(cts.Token);

            if (items != null && items.Count > 0) return items;
        }
        catch { }

        // Resilient disk seed fallback
        var seed = GetSeedCategories()
            .Where(c => string.Equals(c.Module, cleanModule, StringComparison.OrdinalIgnoreCase) && c.Enabled)
            .OrderBy(c => c.Order)
            .ToList();

        return seed;
    }

    public async Task<List<Category>> GetAllCategoriesAsync()
    {
        try
        {
            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
            var items = await _categories
                .Find(Builders<Category>.Filter.Empty)
                .SortBy(c => c.Module)
                .ThenBy(c => c.Order)
                .ToListAsync(cts.Token);

            if (items != null && items.Count > 0) return items;
        }
        catch { }

        return GetSeedCategories().OrderBy(c => c.Module).ThenBy(c => c.Order).ToList();
    }

    public async Task<Category?> GetCategoryBySlugAsync(string module, string slug)
    {
        var cleanModule = module.ToLowerInvariant();
        var cleanSlug = slug.ToLowerInvariant();
        try
        {
            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
            var filter = Builders<Category>.Filter.And(
                Builders<Category>.Filter.Eq(c => c.Module, cleanModule),
                Builders<Category>.Filter.Eq(c => c.Slug, cleanSlug)
            );

            var item = await _categories.Find(filter).FirstOrDefaultAsync(cts.Token);
            if (item != null) return item;
        }
        catch { }

        return GetSeedCategories().FirstOrDefault(c =>
            string.Equals(c.Module, cleanModule, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(c.Slug, cleanSlug, StringComparison.OrdinalIgnoreCase));
    }

    public async Task UpsertCategoryAsync(Category category)
    {
        category.Module = category.Module.ToLowerInvariant();
        category.Slug = category.Slug.ToLowerInvariant();

        var filter = Builders<Category>.Filter.And(
            Builders<Category>.Filter.Eq(c => c.Module, category.Module),
            Builders<Category>.Filter.Eq(c => c.Slug, category.Slug)
        );

        await _categories.ReplaceOneAsync(filter, category, new ReplaceOptions { IsUpsert = true });
    }

    public async Task<long> DeleteDemoCategoriesAsync()
    {
        var filter = Builders<Category>.Filter.Eq("metadata.isDemo", true);
        var result = await _categories.DeleteManyAsync(filter);
        return result.DeletedCount;
    }
}

