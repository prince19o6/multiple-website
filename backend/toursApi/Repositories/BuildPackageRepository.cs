using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ToursApi.Common;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class BuildPackageRepository : IBuildPackageRepository
{
    private readonly IMongoCollection<BuildPackageOption> _options;
    private static readonly ConcurrentDictionary<string, List<BuildPackageOption>> _diskCatalogCache = new(StringComparer.OrdinalIgnoreCase);

    public BuildPackageRepository(IMongoDatabase database)
    {
        _options = database.GetCollection<BuildPackageOption>("buildPackageOptions");
    }

    private string GetDatabaseName() =>
        _options.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<BuildPackageOption> GetDiskCatalog()
    {
        var siteId = GetWebsiteId();

        return _diskCatalogCache.GetOrAdd(siteId, key =>
        {
            var fileName = "build-package-options.json";
            var filePath = ToursApi.Common.SeedPathHelper.FindSeedFile(key, fileName)
                           ?? ToursApi.Common.SeedPathHelper.FindSeedFile("gujjutours", fileName);

            if (filePath != null && File.Exists(filePath))
            {
                try
                {
                    var json = File.ReadAllText(filePath);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<BuildPackageOption>>(json, opts);
                    if (list != null && list.Count > 0)
                    {
                        foreach (var item in list)
                        {
                            if (string.IsNullOrWhiteSpace(item.Id))
                            {
                                item.Id = item.DestinationId ?? (item.DestinationNumericId > 0 ? item.DestinationNumericId.ToString() : Guid.NewGuid().ToString("N")[..8]);
                            }
                        }
                        return list;
                    }
                }
                catch
                {
                }
            }

            return new List<BuildPackageOption>();
        });
    }

    public async Task<BuildPackagePagedResult> GetBuildPackageOptionsAsync(BuildPackageFilterParams filters)
    {
        try
        {
            var builder = Builders<BuildPackageOption>.Filter;
            var filter = builder.Eq(o => o.Status, "Active");

            if (!string.IsNullOrWhiteSpace(filters.Query))
            {
                var q = filters.Query.Trim();
                var regex = new BsonRegularExpression(q, "i");
                filter = filter & (
                    builder.Regex(o => o.DestinationName, regex) |
                    builder.Regex(o => o.Country, regex) |
                    builder.Regex(o => o.Tagline, regex) |
                    builder.Regex(o => o.Overview, regex)
                );
            }

            if (!string.IsNullOrWhiteSpace(filters.Country) && !filters.Country.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var cRegex = new BsonRegularExpression(filters.Country.Trim(), "i");
                filter = filter & builder.Regex(o => o.Country, cRegex);
            }

            if (filters.PopularOnly == true)
            {
                filter = filter & builder.Eq(o => o.Popular, true);
            }

            if (filters.FeaturedOnly == true)
            {
                filter = filter & builder.Eq(o => o.Featured, true);
            }

            if (filters.MinPrice.HasValue)
            {
                filter = filter & builder.Gte(o => o.StartingPrice, filters.MinPrice.Value);
            }

            if (filters.MaxPrice.HasValue)
            {
                filter = filter & builder.Lte(o => o.StartingPrice, filters.MaxPrice.Value);
            }

            var total = await _options.CountDocumentsAsync(filter);
            if (total > 0)
            {
                var sortDef = filters.Sort?.ToLowerInvariant() switch
                {
                    "price_asc" => Builders<BuildPackageOption>.Sort.Ascending(o => o.StartingPrice),
                    "price_desc" => Builders<BuildPackageOption>.Sort.Descending(o => o.StartingPrice),
                    "rating_desc" => Builders<BuildPackageOption>.Sort.Descending(o => o.Rating),
                    "popular" => Builders<BuildPackageOption>.Sort.Descending(o => o.Popular).Descending(o => o.Reviews),
                    _ => Builders<BuildPackageOption>.Sort.Ascending(o => o.DestinationNumericId)
                };

                var page = filters.Page > 0 ? filters.Page : 1;
                var pageSize = filters.PageSize > 0 ? filters.PageSize : 20;

                var items = await _options.Find(filter)
                    .Sort(sortDef)
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                UniqueImageRegistry.EnforceUniqueImages(items);

                return new BuildPackagePagedResult
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
            // Resilient fallback to seed catalog on MongoDB timeout or connection failure
        }

        // Resilient disk fallback
        var all = GetDiskCatalog();
        var qSeed = all.AsQueryable();

        qSeed = qSeed.Where(o => string.IsNullOrWhiteSpace(o.Status) || string.Equals(o.Status, "Active", StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(filters.Query))
        {
            var q = filters.Query.Trim();
            qSeed = qSeed.Where(o =>
                (o.DestinationName != null && o.DestinationName.Contains(q, StringComparison.OrdinalIgnoreCase)) ||
                (o.Country != null && o.Country.Contains(q, StringComparison.OrdinalIgnoreCase)) ||
                (o.Tagline != null && o.Tagline.Contains(q, StringComparison.OrdinalIgnoreCase)) ||
                (o.Overview != null && o.Overview.Contains(q, StringComparison.OrdinalIgnoreCase))
            );
        }

        if (!string.IsNullOrWhiteSpace(filters.Country) && !filters.Country.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var c = filters.Country.Trim();
            qSeed = qSeed.Where(o => o.Country != null && o.Country.Contains(c, StringComparison.OrdinalIgnoreCase));
        }

        if (filters.PopularOnly == true)
        {
            qSeed = qSeed.Where(o => o.Popular == true);
        }

        if (filters.FeaturedOnly == true)
        {
            qSeed = qSeed.Where(o => o.Featured == true);
        }

        if (filters.MinPrice.HasValue)
        {
            qSeed = qSeed.Where(o => o.StartingPrice >= filters.MinPrice.Value);
        }

        if (filters.MaxPrice.HasValue)
        {
            qSeed = qSeed.Where(o => o.StartingPrice <= filters.MaxPrice.Value);
        }

        qSeed = filters.Sort?.ToLowerInvariant() switch
        {
            "price_asc" => qSeed.OrderBy(o => o.StartingPrice),
            "price_desc" => qSeed.OrderByDescending(o => o.StartingPrice),
            "rating_desc" => qSeed.OrderByDescending(o => o.Rating),
            "popular" => qSeed.OrderByDescending(o => o.Popular).ThenByDescending(o => o.Reviews),
            _ => qSeed.OrderBy(o => o.DestinationNumericId)
        };

        var fallbackPage = filters.Page > 0 ? filters.Page : 1;
        var fallbackPageSize = filters.PageSize > 0 ? filters.PageSize : 20;
        var fallbackList = qSeed.ToList();
        var fallbackTotal = fallbackList.Count;
        var pagedItems = fallbackList.Skip((fallbackPage - 1) * fallbackPageSize).Take(fallbackPageSize).ToList();
        UniqueImageRegistry.EnforceUniqueImages(pagedItems);

        return new BuildPackagePagedResult
        {
            Items = pagedItems,
            Total = fallbackTotal,
            Page = fallbackPage,
            PageSize = fallbackPageSize
        };
    }

    public async Task<BuildPackageOption?> GetBuildPackageOptionBySlugAsync(string slug)
    {
        var cleanSlug = slug.Trim().ToLowerInvariant();
        try
        {
            var filter = Builders<BuildPackageOption>.Filter.Eq(o => o.DestinationSlug, cleanSlug);
            var result = await _options.Find(filter).FirstOrDefaultAsync();
            if (result != null) return result;
        }
        catch
        {
            // Fall back to seed catalog
        }

        var diskList = GetDiskCatalog();
        return diskList.FirstOrDefault(o => string.Equals(o.DestinationSlug, cleanSlug, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<BuildPackageOption?> GetBuildPackageOptionByIdAsync(string id)
    {
        try
        {
            if (int.TryParse(id, out var numId))
            {
                var numFilter = Builders<BuildPackageOption>.Filter.Eq(o => o.DestinationNumericId, numId);
                var match = await _options.Find(numFilter).FirstOrDefaultAsync();
                if (match != null) return match;
            }

            if (ObjectId.TryParse(id, out var objId))
            {
                var idFilter = Builders<BuildPackageOption>.Filter.Eq(o => o.Id, id);
                var match = await _options.Find(idFilter).FirstOrDefaultAsync();
                if (match != null) return match;
            }

            var strFilter = Builders<BuildPackageOption>.Filter.Or(
                Builders<BuildPackageOption>.Filter.Eq(o => o.DestinationId, id),
                Builders<BuildPackageOption>.Filter.Eq(o => o.DestinationSlug, id.ToLowerInvariant())
            );
            var matchStr = await _options.Find(strFilter).FirstOrDefaultAsync();
            if (matchStr != null) return matchStr;
        }
        catch
        {
            // Fall back to seed catalog
        }

        var diskList = GetDiskCatalog();
        var cleanId = id.Trim().ToLowerInvariant();

        if (int.TryParse(id, out var nId))
        {
            var numMatch = diskList.FirstOrDefault(o => o.DestinationNumericId == nId);
            if (numMatch != null) return numMatch;
        }

        return diskList.FirstOrDefault(o =>
            string.Equals(o.Id, id, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(o.DestinationId, id, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(o.DestinationSlug, cleanId, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<List<string>> AutocompleteDestinationsAsync(string query, int limit = 8)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                var all = await _options.Find(o => o.Status == "Active")
                    .Project(o => o.DestinationName)
                    .Limit(limit)
                    .ToListAsync();
                if (all != null && all.Count > 0) return all.Distinct().ToList();
            }
            else
            {
                var regex = new BsonRegularExpression(query.Trim(), "i");
                var filter = Builders<BuildPackageOption>.Filter.And(
                    Builders<BuildPackageOption>.Filter.Eq(o => o.Status, "Active"),
                    Builders<BuildPackageOption>.Filter.Or(
                        Builders<BuildPackageOption>.Filter.Regex(o => o.DestinationName, regex),
                        Builders<BuildPackageOption>.Filter.Regex(o => o.Country, regex)
                    )
                );

                var list = await _options.Find(filter)
                    .Project(o => o.DestinationName)
                    .Limit(limit)
                    .ToListAsync();

                if (list != null && list.Count > 0) return list.Distinct().ToList();
            }
        }
        catch
        {
            // Fall back to seed catalog
        }

        var disk = GetDiskCatalog();
        var q = query?.Trim();
        var names = disk
            .Where(o => string.IsNullOrWhiteSpace(q) ||
                        (o.DestinationName != null && o.DestinationName.Contains(q, StringComparison.OrdinalIgnoreCase)) ||
                        (o.Country != null && o.Country.Contains(q, StringComparison.OrdinalIgnoreCase)))
            .Select(o => o.DestinationName)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct()
            .Take(limit)
            .ToList();

        return names;
    }

    public async Task CreateBuildPackageOptionAsync(BuildPackageOption option)
    {
        if (string.IsNullOrWhiteSpace(option.Id))
        {
            option.Id = ObjectId.GenerateNewId().ToString();
        }

        try
        {
            await _options.InsertOneAsync(option);
        }
        catch
        {
            // In offline/seed fallback mode, update disk catalog cache
        }

        var disk = GetDiskCatalog();
        lock (disk)
        {
            disk.Insert(0, option);
        }
    }

    public async Task<bool> UpdateBuildPackageOptionAsync(string id, BuildPackageOption option)
    {
        var modified = false;
        try
        {
            var filter = Builders<BuildPackageOption>.Filter.Eq(o => o.Id, id);
            var result = await _options.ReplaceOneAsync(filter, option);
            modified = result.ModifiedCount > 0;
        }
        catch
        {
            // Fallback
        }

        var disk = GetDiskCatalog();
        lock (disk)
        {
            var idx = disk.FindIndex(o => o.Id == id || o.DestinationId == id || (int.TryParse(id, out var nid) && o.DestinationNumericId == nid));
            if (idx >= 0)
            {
                disk[idx] = option;
                modified = true;
            }
        }

        return modified;
    }

    public async Task<bool> DeleteBuildPackageOptionAsync(string id)
    {
        var deleted = false;
        try
        {
            var filter = Builders<BuildPackageOption>.Filter.Eq(o => o.Id, id);
            var result = await _options.DeleteOneAsync(filter);
            deleted = result.DeletedCount > 0;
        }
        catch
        {
            // Fallback
        }

        var disk = GetDiskCatalog();
        lock (disk)
        {
            var count = disk.RemoveAll(o => o.Id == id || o.DestinationId == id || (int.TryParse(id, out var nid) && o.DestinationNumericId == nid));
            if (count > 0) deleted = true;
        }

        return deleted;
    }
}
