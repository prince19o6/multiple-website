using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using ToursApi.Configuration;
using ToursApi.Exceptions;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class TourRepository : ITourRepository
{
    private readonly IMongoCollection<Tour> _tours;
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private readonly ILogger<TourRepository>? _logger;
    private static readonly ConcurrentDictionary<string, List<Tour>> _diskCatalogCache = new(StringComparer.OrdinalIgnoreCase);

    public TourRepository(
        IMongoDatabase database,
        IHttpContextAccessor? httpContextAccessor = null,
        ILogger<TourRepository>? logger = null)
    {
        _tours = database.GetCollection<Tour>("tours");
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    private static bool IsSeedFallbackAllowed() =>
        Environment.GetEnvironmentVariable("ALLOW_SEED_FALLBACK")?.Trim().Equals("true", StringComparison.OrdinalIgnoreCase) == true;

    private void SetDataSourceHeader(string source)
    {
        try
        {
            var response = _httpContextAccessor?.HttpContext?.Response;
            if (response != null && !response.HasStarted)
            {
                response.Headers["X-Data-Source"] = source;
            }
        }
        catch
        {
            // Ignore response header mutation exceptions if response stream already started
        }
    }

    private string GetDatabaseName() =>
        _tours.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Tour> GetDiskCatalog()
    {
        var siteId = GetWebsiteId();

        return _diskCatalogCache.GetOrAdd(siteId, key =>
        {
            var fileName = $"tours.{key}.json";
            var currentDir = Directory.GetCurrentDirectory();
            var candidates = new[]
            {
                Path.Combine(currentDir, "seed", fileName),
                Path.Combine(currentDir, "..", "..", "seed", fileName),
                Path.Combine(AppContext.BaseDirectory, "seed", fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "toursApi", "seed", fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "web", "seed", fileName)
            };

            foreach (var path in candidates)
            {
                if (System.IO.File.Exists(path))
                {
                    try
                    {
                        var json = System.IO.File.ReadAllText(path);
                        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var list = JsonSerializer.Deserialize<List<Tour>>(json, opts);
                        if (list != null && list.Count > 0) return list;
                    }
                    catch
                    {
                    }
                }
            }

            return key switch
            {
                "tripgoasia" => SeedDataCatalog.Website2Tours(),
                "technoheaven" => SeedDataCatalog.Website3Tours(),
                _ => SeedDataCatalog.Website1Tours()
            };
        });
    }

    public async Task<IEnumerable<Tour>> GetAllAsync(
        string? category = null,
        bool? featured = null,
        bool? popular = null,
        int? page = null,
        int? limit = null,
        string? sort = null)
    {
        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var builder = Builders<Tour>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var catPattern = Regex.Escape(category.Trim());
                var catRegex = new MongoDB.Bson.BsonRegularExpression($"^{catPattern}$", "i");
                filter &= builder.Regex(t => t.Category, catRegex);
            }

            if (featured.HasValue)
            {
                filter &= builder.Eq(t => t.Featured, featured.Value);
            }

            if (popular.HasValue)
            {
                filter &= builder.Eq(t => t.Popular, popular.Value);
            }

            var query = _tours.Find(filter);

            query = sort?.ToLowerInvariant() switch
            {
                "price-low" or "price_asc" => query.SortBy(t => t.Price),
                "price-high" or "price_desc" => query.SortByDescending(t => t.Price),
                "rating" => query.SortByDescending(t => t.Rating),
                "newest" => query.SortByDescending(t => t.CreatedAt),
                _ => query.SortBy(t => t.TourNumericId)
            };

            if (page.HasValue && limit.HasValue && page.Value > 0 && limit.Value > 0)
            {
                query = query.Skip((page.Value - 1) * limit.Value).Limit(limit.Value);
            }
            else if (limit.HasValue && limit.Value > 0)
            {
                query = query.Limit(limit.Value);
            }

            var list = await query.ToListAsync();
            SetDataSourceHeader("mongodb");
            return list;
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[TourRepository.GetAllAsync] MongoDB query failed. ALLOW_SEED_FALLBACK is enabled, falling back to disk seed data for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[TourRepository.GetAllAsync] MongoDB unreachable for database '{DatabaseName}'. ALLOW_SEED_FALLBACK is disabled.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        // Resilient fallback to disk catalog (ONLY reached if ALLOW_SEED_FALLBACK=true)
        var catalog = GetDiskCatalog().AsEnumerable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            catalog = catalog.Where(t => string.Equals(t.Category, category.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (featured.HasValue)
        {
            catalog = catalog.Where(t => t.Featured == featured.Value);
        }

        if (popular.HasValue)
        {
            catalog = catalog.Where(t => t.Popular == popular.Value);
        }

        catalog = sort?.ToLowerInvariant() switch
        {
            "price-low" or "price_asc" => catalog.OrderBy(t => t.Price),
            "price-high" or "price_desc" => catalog.OrderByDescending(t => t.Price),
            "rating" => catalog.OrderByDescending(t => t.Rating),
            "newest" => catalog.OrderByDescending(t => t.CreatedAt),
            _ => catalog.OrderBy(t => t.TourNumericId)
        };

        if (page.HasValue && limit.HasValue && page.Value > 0 && limit.Value > 0)
        {
            catalog = catalog.Skip((page.Value - 1) * limit.Value).Take(limit.Value);
        }
        else if (limit.HasValue && limit.Value > 0)
        {
            catalog = catalog.Take(limit.Value);
        }

        return catalog.ToList();
    }

    public async Task<int> GetCountAsync(
        string? category = null,
        bool? featured = null,
        bool? popular = null)
    {
        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var builder = Builders<Tour>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var catPattern = Regex.Escape(category.Trim());
                var catRegex = new MongoDB.Bson.BsonRegularExpression($"^{catPattern}$", "i");
                filter &= builder.Regex(t => t.Category, catRegex);
            }

            if (featured.HasValue)
            {
                filter &= builder.Eq(t => t.Featured, featured.Value);
            }

            if (popular.HasValue)
            {
                filter &= builder.Eq(t => t.Popular, popular.Value);
            }

            var count = await _tours.CountDocumentsAsync(filter);
            SetDataSourceHeader("mongodb");
            return (int)count;
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[TourRepository.GetCountAsync] MongoDB query failed. ALLOW_SEED_FALLBACK is enabled, falling back to disk count for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[TourRepository.GetCountAsync] MongoDB unreachable for database '{DatabaseName}'. ALLOW_SEED_FALLBACK is disabled.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        var catalog = GetDiskCatalog().AsEnumerable();
        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            catalog = catalog.Where(t => string.Equals(t.Category, category.Trim(), StringComparison.OrdinalIgnoreCase));
        }
        if (featured.HasValue) catalog = catalog.Where(t => t.Featured == featured.Value);
        if (popular.HasValue) catalog = catalog.Where(t => t.Popular == popular.Value);

        return catalog.Count();
    }

    public async Task<Tour?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;

        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var idBuilders = new List<FilterDefinition<Tour>>();

            if (MongoDB.Bson.ObjectId.TryParse(id, out _))
            {
                idBuilders.Add(Builders<Tour>.Filter.Eq(t => t.Id, id));
            }

            idBuilders.Add(Builders<Tour>.Filter.Eq(t => t.Slug, id));

            if (int.TryParse(id, out int numericId))
            {
                idBuilders.Add(Builders<Tour>.Filter.Eq(t => t.TourNumericId, numericId));
            }

            var filter = Builders<Tour>.Filter.Or(idBuilders);
            var item = await _tours.Find(filter).FirstOrDefaultAsync();
            SetDataSourceHeader("mongodb");
            return item;
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[TourRepository.GetByIdAsync] MongoDB query failed. ALLOW_SEED_FALLBACK is enabled, falling back to disk item for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[TourRepository.GetByIdAsync] MongoDB unreachable for database '{DatabaseName}'. ALLOW_SEED_FALLBACK is disabled.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        var catalog = GetDiskCatalog();
        return catalog.FirstOrDefault(t =>
            string.Equals(t.Id, id, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.Slug, id, StringComparison.OrdinalIgnoreCase) ||
            (int.TryParse(id, out int nid) && t.TourNumericId == nid));
    }

    public async Task<Tour?> GetBySlugAsync(string slug)
    {
        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var filter = Builders<Tour>.Filter.Eq(t => t.Slug, slug);
            var item = await _tours.Find(filter).FirstOrDefaultAsync();
            SetDataSourceHeader("mongodb");
            return item;
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[TourRepository.GetBySlugAsync] MongoDB query failed. ALLOW_SEED_FALLBACK is enabled, falling back to disk item for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[TourRepository.GetBySlugAsync] MongoDB unreachable for database '{DatabaseName}'. ALLOW_SEED_FALLBACK is disabled.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        return GetDiskCatalog().FirstOrDefault(t => string.Equals(t.Slug, slug, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<Tour?> GetByNumericIdAsync(int numericId)
    {
        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var filter = Builders<Tour>.Filter.Eq(t => t.TourNumericId, numericId);
            var item = await _tours.Find(filter).FirstOrDefaultAsync();
            SetDataSourceHeader("mongodb");
            return item;
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[TourRepository.GetByNumericIdAsync] MongoDB query failed. ALLOW_SEED_FALLBACK is enabled, falling back to disk item for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[TourRepository.GetByNumericIdAsync] MongoDB unreachable for database '{DatabaseName}'. ALLOW_SEED_FALLBACK is disabled.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        return GetDiskCatalog().FirstOrDefault(t => t.TourNumericId == numericId);
    }

    public async Task CreateAsync(Tour tour)
    {
        if (tour.CreatedAt == null) tour.CreatedAt = DateTime.UtcNow;
        tour.UpdatedAt = DateTime.UtcNow;
        if (string.IsNullOrWhiteSpace(tour.Slug))
        {
            tour.Slug = Regex.Replace(tour.Name.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
        }
        await _tours.InsertOneAsync(tour);
        SetDataSourceHeader("mongodb");
    }

    public async Task<bool> UpsertBySlugAsync(Tour tour)
    {
        if (string.IsNullOrWhiteSpace(tour.Slug))
        {
            tour.Slug = Regex.Replace(tour.Name.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
        }

        var filter = Builders<Tour>.Filter.Eq(t => t.Slug, tour.Slug);

        tour.UpdatedAt = DateTime.UtcNow;
        if (!tour.CreatedAt.HasValue)
        {
            tour.CreatedAt = DateTime.UtcNow;
        }

        var options = new ReplaceOptions { IsUpsert = true };
        var result = await _tours.ReplaceOneAsync(filter, tour, options);
        SetDataSourceHeader("mongodb");
        return result.IsAcknowledged;
    }

    public async Task UpdateAsync(string id, Tour tour)
    {
        var filter = Builders<Tour>.Filter.Eq(t => t.Id, id);
        tour.UpdatedAt = DateTime.UtcNow;
        await _tours.ReplaceOneAsync(filter, tour);
        SetDataSourceHeader("mongodb");
    }

    public async Task DeleteAsync(string id)
    {
        var filter = Builders<Tour>.Filter.Eq(t => t.Id, id);
        await _tours.DeleteOneAsync(filter);
        SetDataSourceHeader("mongodb");
    }

    public async Task<IEnumerable<Tour>> SearchAsync(string? q, double? minPrice, double? maxPrice, string? difficulty)
    {
        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var filterBuilder = Builders<Tour>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(q))
            {
                var pattern = Regex.Escape(q);
                var regex = new MongoDB.Bson.BsonRegularExpression(pattern, "i");

                filter &= filterBuilder.Or(
                    filterBuilder.Regex(t => t.Name, regex),
                    filterBuilder.Regex(t => t.Description, regex),
                    filterBuilder.Regex(t => t.Category, regex),
                    filterBuilder.Regex(t => t.Destination, regex),
                    filterBuilder.Regex(t => t.Location, regex)
                );
            }

            if (minPrice.HasValue)
            {
                filter &= filterBuilder.Gte(t => t.Price, minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                filter &= filterBuilder.Lte(t => t.Price, maxPrice.Value);
            }

            if (!string.IsNullOrWhiteSpace(difficulty))
            {
                filter &= filterBuilder.Eq(t => t.Difficulty, difficulty);
            }

            var results = await _tours.Find(filter).Limit(100).ToListAsync();
            SetDataSourceHeader("mongodb");
            return results;
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[TourRepository.SearchAsync] MongoDB query failed. ALLOW_SEED_FALLBACK is enabled, falling back to disk search for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[TourRepository.SearchAsync] MongoDB unreachable for database '{DatabaseName}'. ALLOW_SEED_FALLBACK is disabled.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        var catalog = GetDiskCatalog().AsEnumerable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var cleanQ = q.Trim().ToLowerInvariant();
            catalog = catalog.Where(t =>
                (t.Name != null && t.Name.ToLowerInvariant().Contains(cleanQ)) ||
                (t.Description != null && t.Description.ToLowerInvariant().Contains(cleanQ)) ||
                (t.Category != null && t.Category.ToLowerInvariant().Contains(cleanQ)) ||
                (t.Destination != null && t.Destination.ToLowerInvariant().Contains(cleanQ)) ||
                (t.Location != null && t.Location.ToLowerInvariant().Contains(cleanQ))
            );
        }

        if (minPrice.HasValue) catalog = catalog.Where(t => t.Price >= minPrice.Value);
        if (maxPrice.HasValue) catalog = catalog.Where(t => t.Price <= maxPrice.Value);
        if (!string.IsNullOrWhiteSpace(difficulty))
        {
            catalog = catalog.Where(t => string.Equals(t.Difficulty, difficulty.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        return catalog.Take(100).ToList();
    }
}
