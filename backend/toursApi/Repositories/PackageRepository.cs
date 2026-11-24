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
using ToursApi.Models;

namespace ToursApi.Repositories;

public class PackageRepository : IPackageRepository
{
    private readonly IMongoCollection<Package> _packages;
    private static readonly ConcurrentDictionary<string, List<Package>> _diskCatalogCache = new(StringComparer.OrdinalIgnoreCase);

    public PackageRepository(IMongoDatabase database)
    {
        _packages = database.GetCollection<Package>("packages");
    }

    private string GetDatabaseName() =>
        _packages.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Package> GetDiskCatalog()
    {
        var siteId = GetWebsiteId();

        return _diskCatalogCache.GetOrAdd(siteId, key =>
        {
            var fileName = "packages.json";
            var filePath = ToursApi.Common.SeedPathHelper.FindSeedFile(key, fileName)
                           ?? ToursApi.Common.SeedPathHelper.FindSeedFile("gujjutours", fileName);

            if (filePath != null && File.Exists(filePath))
            {
                try
                {
                    var json = File.ReadAllText(filePath);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<Package>>(json, opts);
                    if (list != null && list.Count > 0) return list;
                }
                catch
                {
                }
            }

            return new List<Package>();
        });
    }

    public async Task<PackagePagedResult> GetPackagesAsync(PackageFilterParams filters)
    {
        try
        {
            var builder = Builders<Package>.Filter;
            var filter = builder.Eq(p => p.Status, "Active");

            if (!string.IsNullOrWhiteSpace(filters.Destination))
            {
                var tokens = filters.Destination.Split(new[] { ',', '&', '/' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                var tokenFilters = new List<FilterDefinition<Package>>();
                foreach (var token in tokens)
                {
                    if (string.IsNullOrWhiteSpace(token)) continue;
                    var regex = new BsonRegularExpression(Regex.Escape(token), "i");
                    tokenFilters.Add(
                        builder.Regex(p => p.Destination, regex) |
                        builder.Regex(p => p.Country, regex) |
                        builder.Regex(p => p.City, regex) |
                        builder.Regex(p => p.CitiesCovered, regex) |
                        builder.Regex(p => p.Title, regex)
                    );
                }
                if (tokenFilters.Count > 0)
                {
                    filter = filter & builder.Or(tokenFilters);
                }
            }

            if (!string.IsNullOrWhiteSpace(filters.Category) && !filters.Category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var catSlug = filters.Category.Trim().ToLowerInvariant();
                filter = filter & (
                    builder.Eq(p => p.CategorySlug, catSlug) |
                    builder.Regex(p => p.Category, new BsonRegularExpression(catSlug, "i"))
                );
            }

            if (filters.DurationDays.HasValue && filters.DurationDays > 0)
            {
                filter = filter & builder.Lte(p => p.DurationDays, filters.DurationDays.Value + 1);
            }

            if (filters.MinPrice.HasValue && filters.MinPrice > 0)
            {
                filter = filter & builder.Gte(p => p.StartingPrice, filters.MinPrice.Value);
            }

            if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
            {
                filter = filter & builder.Lte(p => p.StartingPrice, filters.MaxPrice.Value);
            }

            var total = await _packages.CountDocumentsAsync(filter);

            if (total > 0)
            {
                var query = _packages.Find(filter);

                query = filters.Sort?.ToLowerInvariant() switch
                {
                    "price_asc" => query.SortBy(p => p.StartingPrice),
                    "price_desc" => query.SortByDescending(p => p.StartingPrice),
                    "rating_desc" or "rating" => query.SortByDescending(p => p.Rating),
                    "popular" => query.SortByDescending(p => p.Popular).ThenByDescending(p => p.Rating),
                    _ => query.SortByDescending(p => p.Featured).ThenByDescending(p => p.Rating)
                };

                var page = filters.Page < 1 ? 1 : filters.Page;
                var pageSize = filters.PageSize < 1 ? 12 : filters.PageSize;

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                return new PackagePagedResult
                {
                    Items = items,
                    Total = total,
                    Page = page,
                    PageSize = pageSize
                };
            }
        }
        catch
        {
            // Fall back to seed
        }

        var allSeed = GetDiskCatalog();
        var qSeed = allSeed.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filters.Destination))
        {
            var tokens = filters.Destination.Split(new[] { ',', '&', '/' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => t.ToLowerInvariant()).ToList();
            qSeed = qSeed.Where(p => tokens.Any(dest =>
                (p.Destination != null && p.Destination.ToLower().Contains(dest)) ||
                (p.Country != null && p.Country.ToLower().Contains(dest)) ||
                (p.City != null && p.City.ToLower().Contains(dest)) ||
                (p.Title != null && p.Title.ToLower().Contains(dest))));
        }

        if (filters.MinPrice.HasValue && filters.MinPrice > 0)
        {
            qSeed = qSeed.Where(p => p.StartingPrice >= filters.MinPrice.Value);
        }

        if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
        {
            qSeed = qSeed.Where(p => p.StartingPrice <= filters.MaxPrice.Value);
        }

        qSeed = filters.Sort?.ToLowerInvariant() switch
        {
            "price_asc" => qSeed.OrderBy(p => p.StartingPrice),
            "price_desc" => qSeed.OrderByDescending(p => p.StartingPrice),
            _ => qSeed.OrderByDescending(p => p.Featured).ThenByDescending(p => p.Rating)
        };

        var p = filters.Page < 1 ? 1 : filters.Page;
        var ps = filters.PageSize < 1 ? 12 : filters.PageSize;
        var list = qSeed.ToList();

        return new PackagePagedResult
        {
            Items = list.Skip((p - 1) * ps).Take(ps).ToList(),
            Total = list.Count,
            Page = p,
            PageSize = ps
        };
    }

    public async Task<Package?> GetPackageBySlugAsync(string slug)
    {
        var cleanSlug = slug.Trim().ToLowerInvariant();
        try
        {
            var p = await _packages.Find(p => p.Slug == cleanSlug).FirstOrDefaultAsync();
            if (p != null) return p;
        }
        catch
        {
        }

        return GetDiskCatalog().FirstOrDefault(p => p.Slug != null && p.Slug.ToLower() == cleanSlug);
    }

    public async Task<Package?> GetPackageByIdAsync(string id)
    {
        try
        {
            if (int.TryParse(id, out int numericId))
            {
                var byNum = await _packages.Find(p => p.PackageNumericId == numericId).FirstOrDefaultAsync();
                if (byNum != null) return byNum;
            }

            if (ObjectId.TryParse(id, out var objId))
            {
                var byObjId = await _packages.Find(p => p.Id == id).FirstOrDefaultAsync();
                if (byObjId != null) return byObjId;
            }

            var p = await _packages.Find(p => p.PackageId == id || p.Slug == id).FirstOrDefaultAsync();
            if (p != null) return p;
        }
        catch
        {
        }

        int.TryParse(id, out var parsedNum);
        return GetDiskCatalog().FirstOrDefault(p =>
            p.PackageId == id ||
            (parsedNum > 0 && p.PackageNumericId == parsedNum) ||
            p.Id == id ||
            p.Slug == id);
    }

    public async Task<List<string>> AutocompleteAsync(string query, int limit = 8)
    {
        if (string.IsNullOrWhiteSpace(query)) return new List<string>();

        try
        {
            var clean = query.Trim();
            var regex = new BsonRegularExpression(clean, "i");
            var filter = Builders<Package>.Filter.Regex(p => p.Title, regex) |
                         Builders<Package>.Filter.Regex(p => p.Destination, regex);

            var results = await _packages.Find(filter)
                .Limit(limit)
                .Project(p => p.Title)
                .ToListAsync();

            if (results != null && results.Count > 0) return results;
        }
        catch
        {
        }

        var q = query.Trim().ToLowerInvariant();
        return GetDiskCatalog()
            .Select(p => p.Title)
            .Where(t => !string.IsNullOrWhiteSpace(t) && t.ToLower().Contains(q))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .ToList();
    }

    public async Task CreatePackageAsync(Package package)
    {
        package.CreatedAt = DateTime.UtcNow;
        try
        {
            await _packages.InsertOneAsync(package);
        }
        catch
        {
        }
    }

    public async Task<bool> UpdatePackageAsync(string id, Package package)
    {
        try
        {
            var result = await _packages.ReplaceOneAsync(p => p.Id == id || p.Slug == id, package);
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeletePackageAsync(string id)
    {
        try
        {
            var result = await _packages.DeleteOneAsync(p => p.Id == id || p.Slug == id);
            return result.DeletedCount > 0;
        }
        catch
        {
            return false;
        }
    }
}
