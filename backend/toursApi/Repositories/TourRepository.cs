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
using ToursApi.Common;
using ToursApi.Configuration;
using ToursApi.Exceptions;
using ToursApi.Models;
using ToursApi.Services;

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
        Environment.GetEnvironmentVariable("ALLOW_SEED_FALLBACK")?.Trim().Equals("false", StringComparison.OrdinalIgnoreCase) != true;

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
            var filePath = ToursApi.Common.SeedPathHelper.FindSeedFile(key, fileName)
                           ?? ToursApi.Common.SeedPathHelper.FindSeedFile(key, "activities.json")
                           ?? ToursApi.Common.SeedPathHelper.FindSeedFile("gujjutours", "activities.json");

            if (filePath != null && System.IO.File.Exists(filePath))
            {
                try
                {
                    var json = System.IO.File.ReadAllText(filePath);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<Tour>>(json, opts);
                    if (list != null && list.Count > 0) return list;
                }
                catch
                {
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
            UniqueImageRegistry.EnforceUniqueImages(list);
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

        var resultList = catalog.ToList();
        UniqueImageRegistry.EnforceUniqueImages(resultList);
        return resultList;
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
            if (item != null)
            {
                SetDataSourceHeader("mongodb");
                return item;
            }
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
        var match = catalog.FirstOrDefault(t =>
            string.Equals(t.Id, id, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.Slug, id, StringComparison.OrdinalIgnoreCase) ||
            (int.TryParse(id, out int nid) && t.TourNumericId == nid));

        return match;
    }

    public async Task<Tour?> GetBySlugAsync(string slug)
    {
        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var filter = Builders<Tour>.Filter.Eq(t => t.Slug, slug);
            var item = await _tours.Find(filter).FirstOrDefaultAsync();
            if (item != null)
            {
                SetDataSourceHeader("mongodb");
                return item;
            }
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

        var catalog = GetDiskCatalog();
        var match = catalog.FirstOrDefault(t => string.Equals(t.Slug, slug, StringComparison.OrdinalIgnoreCase));
        if (match != null) return match;

        var resilientItems = ToursApi.Services.ResilientDataGenerator.GetItemsForModule("tours");
        var resMatch = resilientItems.FirstOrDefault(i =>
            string.Equals(i?["slug"]?.ToString(), slug, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(i?["id"]?.ToString(), slug, StringComparison.OrdinalIgnoreCase));
        if (resMatch != null)
        {
            var title = resMatch["title"]?.ToString() ?? "Signature Tour Experience";
            var city = resMatch["city"]?.ToString() ?? "Destination";
            var country = resMatch["country"]?.ToString() ?? "Global";
            double price = 3500;
            if (resMatch["price"] != null && double.TryParse(resMatch["price"]!.ToString(), out var p)) price = p;
            var img = resMatch["imageUrl"]?.ToString() ?? "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85";

            return new Tour
            {
                Id = resMatch["id"]?.ToString() ?? slug,
                Slug = resMatch["slug"]?.ToString() ?? slug,
                Name = title,
                Title = title,
                WebsiteId = siteId,
                Destination = city,
                Location = $"{city}, {country}",
                Country = country,
                Price = price,
                Currency = siteId == "gujjutours" ? "INR" : "USD",
                Rating = 4.9,
                Reviews = 500,
                Image = img,
                Gallery = new List<string> { img },
                Duration = resMatch["duration"]?.ToString() ?? "Full Day",
                Description = $"{title} offers an exceptional guided journey through {city} with verified local experts.",
                Highlights = new List<string> { "Guided Experience", "Hotel Pickup & Drop", "All Entry Tickets Included", "English Speaking Guide" }
            };
        }

        return null;
    }

    public async Task<Tour?> GetByNumericIdAsync(int numericId)
    {
        if (numericId <= 0) return null;

        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var filter = Builders<Tour>.Filter.Eq(t => t.TourNumericId, numericId);
            var item = await _tours.Find(filter).FirstOrDefaultAsync();
            if (item != null)
            {
                SetDataSourceHeader("mongodb");
                return item;
            }
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

        var catalog = GetDiskCatalog();
        return catalog.FirstOrDefault(t => t.TourNumericId == numericId);
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

    public async Task<IEnumerable<Tour>> SearchAsync(string? q, double? minPrice, double? maxPrice, string? difficulty, string? sort = null)
    {
        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var filterBuilder = Builders<Tour>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(q))
            {
                var tokens = q.Split(new[] { ',', '&', '/' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                var tokenFilters = new List<FilterDefinition<Tour>>();
                foreach (var token in tokens)
                {
                    if (string.IsNullOrWhiteSpace(token)) continue;
                    var pattern = Regex.Escape(token);
                    var regex = new MongoDB.Bson.BsonRegularExpression(pattern, "i");
                    tokenFilters.Add(filterBuilder.Or(
                        filterBuilder.Regex(t => t.Name, regex),
                        filterBuilder.Regex(t => t.Description, regex),
                        filterBuilder.Regex(t => t.Category, regex),
                        filterBuilder.Regex(t => t.Destination, regex),
                        filterBuilder.Regex(t => t.Location, regex)
                    ));
                }
                if (tokenFilters.Count > 0)
                {
                    filter &= filterBuilder.Or(tokenFilters);
                }
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

            var query = _tours.Find(filter);

            query = sort?.ToLowerInvariant() switch
            {
                "price-low" or "price_asc" => query.SortBy(t => t.Price),
                "price-high" or "price_desc" => query.SortByDescending(t => t.Price),
                "rating" => query.SortByDescending(t => t.Rating),
                "newest" => query.SortByDescending(t => t.CreatedAt),
                _ => query.SortBy(t => t.TourNumericId)
            };

            var results = await query.Limit(100).ToListAsync();
            UniqueImageRegistry.EnforceUniqueImages(results);
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
            var tokens = q.Split(new[] { ',', '&', '/' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => t.ToLowerInvariant()).ToList();
            catalog = catalog.Where(t => tokens.Any(cleanQ =>
                (t.Name != null && t.Name.ToLowerInvariant().Contains(cleanQ)) ||
                (t.Description != null && t.Description.ToLowerInvariant().Contains(cleanQ)) ||
                (t.Category != null && t.Category.ToLowerInvariant().Contains(cleanQ)) ||
                (t.Destination != null && t.Destination.ToLowerInvariant().Contains(cleanQ)) ||
                (t.Location != null && t.Location.ToLowerInvariant().Contains(cleanQ))
            ));
        }

        if (minPrice.HasValue) catalog = catalog.Where(t => t.Price >= minPrice.Value);
        if (maxPrice.HasValue) catalog = catalog.Where(t => t.Price <= maxPrice.Value);
        if (!string.IsNullOrWhiteSpace(difficulty))
        {
            catalog = catalog.Where(t => string.Equals(t.Difficulty, difficulty.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        catalog = sort?.ToLowerInvariant() switch
        {
            "price-low" or "price_asc" => catalog.OrderBy(t => t.Price),
            "price-high" or "price_desc" => catalog.OrderByDescending(t => t.Price),
            "rating" => catalog.OrderByDescending(t => t.Rating),
            "newest" => catalog.OrderByDescending(t => t.CreatedAt),
            _ => catalog.OrderBy(t => t.TourNumericId)
        };

        var searchList = catalog.Take(100).ToList();
        UniqueImageRegistry.EnforceUniqueImages(searchList);
        return searchList;
    }

    public async Task<IEnumerable<Tour>> GetSimilarToursAsync(string tourIdOrSlug, int limit = 4)
    {
        var siteId = GetWebsiteId();
        var dbName = GetDatabaseName();

        try
        {
            var baseTour = await GetByIdAsync(tourIdOrSlug);

            if (baseTour != null)
            {
                var excludeList = new List<FilterDefinition<Tour>>();
                if (!string.IsNullOrWhiteSpace(baseTour.Id))
                {
                    excludeList.Add(Builders<Tour>.Filter.Ne(t => t.Id, baseTour.Id));
                }
                if (baseTour.TourNumericId > 0)
                {
                    excludeList.Add(Builders<Tour>.Filter.Ne(t => t.TourNumericId, baseTour.TourNumericId));
                }
                if (!string.IsNullOrWhiteSpace(baseTour.Slug))
                {
                    excludeList.Add(Builders<Tour>.Filter.Ne(t => t.Slug, baseTour.Slug));
                }

                var excludeFilter = excludeList.Count > 0
                    ? Builders<Tour>.Filter.And(excludeList)
                    : Builders<Tour>.Filter.Empty;

                var orFilters = new List<FilterDefinition<Tour>>();
                if (!string.IsNullOrWhiteSpace(baseTour.Category))
                {
                    orFilters.Add(Builders<Tour>.Filter.Eq(t => t.Category, baseTour.Category));
                }
                if (!string.IsNullOrWhiteSpace(baseTour.Destination))
                {
                    orFilters.Add(Builders<Tour>.Filter.Eq(t => t.Destination, baseTour.Destination));
                }
                if (!string.IsNullOrWhiteSpace(baseTour.Location))
                {
                    var locPrefix = baseTour.Location.Split(',')[0].Trim();
                    orFilters.Add(Builders<Tour>.Filter.Regex(t => t.Location, new MongoDB.Bson.BsonRegularExpression(Regex.Escape(locPrefix), "i")));
                }

                FilterDefinition<Tour> matchFilter = orFilters.Count > 0
                    ? Builders<Tour>.Filter.And(excludeFilter, Builders<Tour>.Filter.Or(orFilters))
                    : excludeFilter;

                var similar = await _tours.Find(matchFilter)
                    .SortByDescending(t => t.Rating)
                    .Limit(limit * 2)
                    .ToListAsync();

                // Distinct by id/slug
                var distinctSimilar = similar
                    .Where(s => s.Id != baseTour.Id && s.TourNumericId != baseTour.TourNumericId && s.Slug != baseTour.Slug)
                    .DistinctBy(s => s.TourNumericId > 0 ? s.TourNumericId.ToString() : s.Slug)
                    .Take(limit)
                    .ToList();

                if (distinctSimilar.Count < limit)
                {
                    var allTours = await _tours.Find(excludeFilter)
                        .SortByDescending(t => t.Rating)
                        .Limit(limit * 2)
                        .ToListAsync();

                    var existingIds = distinctSimilar.Select(s => s.TourNumericId > 0 ? s.TourNumericId.ToString() : s.Slug).ToHashSet();
                    foreach (var candidate in allTours)
                    {
                        var key = candidate.TourNumericId > 0 ? candidate.TourNumericId.ToString() : candidate.Slug;
                        if (!existingIds.Contains(key) && candidate.Id != baseTour.Id && candidate.Slug != baseTour.Slug)
                        {
                            distinctSimilar.Add(candidate);
                            existingIds.Add(key);
                            if (distinctSimilar.Count >= limit) break;
                        }
                    }
                }

                UniqueImageRegistry.EnforceUniqueImages(distinctSimilar);
                SetDataSourceHeader("mongodb");
                return distinctSimilar;
            }
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[TourRepository.GetSimilarToursAsync] MongoDB query failed. Falling back to disk seed data for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[TourRepository.GetSimilarToursAsync] MongoDB unreachable for database '{DatabaseName}'.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        // Resilient disk catalog fallback
        var catalog = GetDiskCatalog();
        var fallbackBase = catalog.FirstOrDefault(t =>
            (int.TryParse(tourIdOrSlug, out var nId) && t.TourNumericId == nId) ||
            string.Equals(t.Slug, tourIdOrSlug, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.Id, tourIdOrSlug, StringComparison.OrdinalIgnoreCase)
        );

        if (fallbackBase == null)
        {
            var fallback = catalog.Take(limit).ToList();
            UniqueImageRegistry.EnforceUniqueImages(fallback);
            return fallback;
        }

        var candidates = catalog
            .Where(t => t.Id != fallbackBase.Id && t.TourNumericId != fallbackBase.TourNumericId && t.Slug != fallbackBase.Slug)
            .OrderByDescending(t =>
                (string.Equals(t.Category, fallbackBase.Category, StringComparison.OrdinalIgnoreCase) ? 10 : 0) +
                (string.Equals(t.Destination, fallbackBase.Destination, StringComparison.OrdinalIgnoreCase) ? 8 : 0) +
                (t.Rating * 0.5)
            )
            .Take(limit)
            .ToList();

        UniqueImageRegistry.EnforceUniqueImages(candidates);
        return candidates;
    }

    public async Task<GuestReview?> AddReviewAsync(string tourIdOrSlug, GuestReview review)
    {
        if (review == null) return null;
        if (string.IsNullOrWhiteSpace(review.Author)) review.Author = "Traveler";
        if (string.IsNullOrWhiteSpace(review.Date)) review.Date = DateTime.UtcNow.ToString("yyyy-MM-dd");
        if (review.Rating < 1) review.Rating = 1;
        if (review.Rating > 5) review.Rating = 5;

        var siteId = GetWebsiteId();
        var dbName = GetDatabaseName();

        try
        {
            var baseTour = await GetByIdAsync(tourIdOrSlug);
            if (baseTour != null)
            {
                baseTour.GuestReviews ??= new List<GuestReview>();
                baseTour.GuestReviews.Insert(0, review);

                var avgRating = baseTour.GuestReviews.Average(r => r.Rating);
                baseTour.Rating = Math.Round(avgRating, 1);
                baseTour.Reviews = baseTour.GuestReviews.Count;
                baseTour.ReviewCount = baseTour.GuestReviews.Count;
                baseTour.UpdatedAt = DateTime.UtcNow;

                var filter = Builders<Tour>.Filter.Eq(t => t.Id, baseTour.Id);
                await _tours.ReplaceOneAsync(filter, baseTour);
                SetDataSourceHeader("mongodb");
                return review;
            }
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[TourRepository.AddReviewAsync] MongoDB query failed. Falling back to disk seed data for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[TourRepository.AddReviewAsync] MongoDB unreachable for database '{DatabaseName}'.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        var catalog = GetDiskCatalog();
        var fallbackBase = catalog.FirstOrDefault(t =>
            (int.TryParse(tourIdOrSlug, out var nId) && t.TourNumericId == nId) ||
            string.Equals(t.Slug, tourIdOrSlug, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(t.Id, tourIdOrSlug, StringComparison.OrdinalIgnoreCase)
        );

        if (fallbackBase != null)
        {
            fallbackBase.GuestReviews ??= new List<GuestReview>();
            fallbackBase.GuestReviews.Insert(0, review);
            var avg = fallbackBase.GuestReviews.Average(r => r.Rating);
            fallbackBase.Rating = Math.Round(avg, 1);
            fallbackBase.Reviews = fallbackBase.GuestReviews.Count;
            fallbackBase.ReviewCount = fallbackBase.GuestReviews.Count;
            return review;
        }

        return null;
    }
}
