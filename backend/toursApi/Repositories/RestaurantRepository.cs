using MongoDB.Bson;
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

public class RestaurantRepository : IRestaurantRepository
{
    private readonly IMongoCollection<Restaurant> _restaurants;
    private static readonly ConcurrentDictionary<string, List<Restaurant>> _diskCatalogCache = new(StringComparer.OrdinalIgnoreCase);

    public RestaurantRepository(IMongoDatabase database)
    {
        _restaurants = database.GetCollection<Restaurant>("restaurants");
    }

    private string GetDatabaseName() =>
        _restaurants.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Restaurant> GetDiskCatalog()
    {
        var siteId = GetWebsiteId();

        return _diskCatalogCache.GetOrAdd(siteId, key =>
        {
            var fileName = "restaurants.json";
            var currentDir = Directory.GetCurrentDirectory();
            var candidates = new[]
            {
                Path.Combine(currentDir, "seed", key, fileName),
                Path.Combine(currentDir, "backend", "toursApi", "seed", key, fileName),
                Path.Combine(currentDir, "..", "..", "seed", key, fileName),
                Path.Combine(AppContext.BaseDirectory, "seed", key, fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", key, fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "toursApi", "seed", key, fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "web", "seed", key, fileName),
                Path.Combine(currentDir, "seed", "gujjutours", fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", "gujjutours", fileName)
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    try
                    {
                        var json = File.ReadAllText(path);
                        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var list = JsonSerializer.Deserialize<List<Restaurant>>(json, opts);
                        if (list != null && list.Count > 0) return list;
                    }
                    catch
                    {
                    }
                }
            }

            return new List<Restaurant>();
        });
    }

    public async Task<RestaurantPagedResult> GetRestaurantsAsync(RestaurantFilterParams filters)
    {
        try
        {
            var builder = Builders<Restaurant>.Filter;
            var filter = builder.Eq(r => r.Status, "Active");

            if (!string.IsNullOrWhiteSpace(filters.Query))
            {
                var q = filters.Query.Trim();
                var regex = new BsonRegularExpression(q, "i");
                filter = filter & (
                    builder.Regex(r => r.Title, regex) |
                    builder.Regex(r => r.City, regex) |
                    builder.Regex(r => r.Address, regex) |
                    builder.Regex(r => r.CuisineLabel, regex)
                );
            }

            if (!string.IsNullOrWhiteSpace(filters.City) && !filters.City.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var cityRegex = new BsonRegularExpression(filters.City.Trim(), "i");
                filter = filter & (builder.Regex(r => r.City, cityRegex) | builder.Regex(r => r.Country, cityRegex));
            }

            if (!string.IsNullOrWhiteSpace(filters.Cuisine) && !filters.Cuisine.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var c = filters.Cuisine.Trim().ToLowerInvariant();
                filter = filter & (builder.Eq(r => r.Cuisine, c) | builder.Regex(r => r.CuisineLabel, new BsonRegularExpression(c, "i")));
            }

            if (filters.PureVegOnly == true)
            {
                filter = filter & builder.Eq(r => r.IsPureVeg, true);
            }

            if (filters.JainOnly == true)
            {
                filter = filter & builder.Eq(r => r.IsJainAvailable, true);
            }

            if (filters.HalalOnly == true)
            {
                filter = filter & builder.Eq(r => r.IsHalalCertified, true);
            }

            if (!string.IsNullOrWhiteSpace(filters.PriceRange) && !filters.PriceRange.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                filter = filter & builder.Eq(r => r.PriceRange, filters.PriceRange.Trim());
            }

            if (filters.MinCost.HasValue && filters.MinCost > 0)
            {
                filter = filter & builder.Gte(r => r.CostForTwo, filters.MinCost.Value);
            }

            if (filters.MaxCost.HasValue && filters.MaxCost > 0)
            {
                filter = filter & builder.Lte(r => r.CostForTwo, filters.MaxCost.Value);
            }

            var total = await _restaurants.CountDocumentsAsync(filter);

            if (total > 0)
            {
                var query = _restaurants.Find(filter);

                switch (filters.Sort?.ToLowerInvariant())
                {
                    case "cost_asc":
                    case "price_asc":
                        query = query.SortBy(r => r.CostForTwo);
                        break;
                    case "cost_desc":
                    case "price_desc":
                        query = query.SortByDescending(r => r.CostForTwo);
                        break;
                    case "rating_desc":
                        query = query.SortByDescending(r => r.Rating).ThenByDescending(r => r.Reviews);
                        break;
                    case "newest":
                        query = query.SortByDescending(r => r.IsNew).ThenByDescending(r => r.CreatedAt);
                        break;
                    case "popular":
                    default:
                        query = query.SortByDescending(r => r.Featured).ThenByDescending(r => r.Popular).ThenByDescending(r => r.Rating);
                        break;
                }

                var page = filters.Page < 1 ? 1 : filters.Page;
                var pageSize = filters.PageSize < 1 ? 20 : filters.PageSize;

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                return new RestaurantPagedResult
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

        if (!string.IsNullOrWhiteSpace(filters.Query))
        {
            var q = filters.Query.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(r =>
                (r.Title != null && r.Title.ToLower().Contains(q)) ||
                (r.City != null && r.City.ToLower().Contains(q)) ||
                (r.Address != null && r.Address.ToLower().Contains(q)) ||
                (r.CuisineLabel != null && r.CuisineLabel.ToLower().Contains(q)));
        }

        if (!string.IsNullOrWhiteSpace(filters.City) && !filters.City.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var city = filters.City.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(r => (r.City != null && r.City.ToLower().Contains(city)) || (r.Country != null && r.Country.ToLower().Contains(city)));
        }

        if (!string.IsNullOrWhiteSpace(filters.Cuisine) && !filters.Cuisine.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var c = filters.Cuisine.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(r => (r.Cuisine != null && r.Cuisine.ToLower() == c) || (r.CuisineLabel != null && r.CuisineLabel.ToLower().Contains(c)));
        }

        if (filters.PureVegOnly == true)
        {
            qSeed = qSeed.Where(r => r.IsPureVeg);
        }

        if (filters.JainOnly == true)
        {
            qSeed = qSeed.Where(r => r.IsJainAvailable);
        }

        if (filters.MinCost.HasValue && filters.MinCost > 0)
        {
            qSeed = qSeed.Where(r => r.CostForTwo >= filters.MinCost.Value);
        }

        if (filters.MaxCost.HasValue && filters.MaxCost > 0)
        {
            qSeed = qSeed.Where(r => r.CostForTwo <= filters.MaxCost.Value);
        }

        switch (filters.Sort?.ToLowerInvariant())
        {
            case "cost_asc":
            case "price_asc":
                qSeed = qSeed.OrderBy(r => r.CostForTwo);
                break;
            case "cost_desc":
            case "price_desc":
                qSeed = qSeed.OrderByDescending(r => r.CostForTwo);
                break;
            case "rating_desc":
                qSeed = qSeed.OrderByDescending(r => r.Rating).ThenByDescending(r => r.Reviews);
                break;
            default:
                qSeed = qSeed.OrderByDescending(r => r.Featured).ThenByDescending(r => r.Popular).ThenByDescending(r => r.Rating);
                break;
        }

        var p = filters.Page < 1 ? 1 : filters.Page;
        var ps = filters.PageSize < 1 ? 20 : filters.PageSize;
        var list = qSeed.ToList();

        return new RestaurantPagedResult
        {
            Items = list.Skip((p - 1) * ps).Take(ps).ToList(),
            Total = list.Count,
            Page = p,
            PageSize = ps
        };
    }

    public async Task<Restaurant?> GetRestaurantBySlugAsync(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;
        var clean = slug.Trim().ToLowerInvariant();
        try
        {
            var r = await _restaurants.Find(r => r.Slug == clean && r.Status == "Active").FirstOrDefaultAsync();
            if (r != null) return r;
        }
        catch
        {
        }

        return GetDiskCatalog().FirstOrDefault(r => r.Slug != null && r.Slug.ToLower() == clean);
    }

    public async Task<Restaurant?> GetRestaurantByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;

        try
        {
            var builder = Builders<Restaurant>.Filter;
            FilterDefinition<Restaurant> filter = builder.Eq(r => r.RestaurantId, id);

            if (int.TryParse(id, out var numId))
            {
                filter = filter | builder.Eq(r => r.RestaurantNumericId, numId);
            }

            if (ObjectId.TryParse(id, out _))
            {
                filter = filter | builder.Eq(r => r.Id, id);
            }

            var r = await _restaurants.Find(filter).FirstOrDefaultAsync();
            if (r != null) return r;
        }
        catch
        {
        }

        int.TryParse(id, out var parsedNum);
        return GetDiskCatalog().FirstOrDefault(r =>
            r.RestaurantId == id ||
            (parsedNum > 0 && r.RestaurantNumericId == parsedNum) ||
            r.Id == id ||
            r.Slug == id);
    }

    public async Task<List<string>> AutocompleteCitiesAsync(string query, int limit = 8)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                var cities = await _restaurants.Distinct<string>("City", Builders<Restaurant>.Filter.Empty).ToListAsync();
                if (cities != null && cities.Count > 0) return cities.Take(limit).ToList();
            }
            else
            {
                var regex = new BsonRegularExpression(query.Trim(), "i");
                var filter = Builders<Restaurant>.Filter.Regex(r => r.City, regex);
                var matches = await _restaurants.Distinct<string>("City", filter).ToListAsync();
                if (matches != null && matches.Count > 0) return matches.Take(limit).ToList();
            }
        }
        catch
        {
        }

        var seedCities = GetDiskCatalog()
            .Select(r => r.City)
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLowerInvariant();
            seedCities = seedCities.Where(c => c.ToLower().Contains(q));
        }

        return seedCities.Take(limit).ToList();
    }

    public async Task<List<string>> AutocompleteNamesAsync(string query, int limit = 8)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                var names = await _restaurants.Distinct<string>("Title", Builders<Restaurant>.Filter.Empty).ToListAsync();
                if (names != null && names.Count > 0) return names.Take(limit).ToList();
            }
            else
            {
                var regex = new BsonRegularExpression(query.Trim(), "i");
                var filter = Builders<Restaurant>.Filter.Regex(r => r.Title, regex);
                var matches = await _restaurants.Distinct<string>("Title", filter).ToListAsync();
                if (matches != null && matches.Count > 0) return matches.Take(limit).ToList();
            }
        }
        catch
        {
        }

        var seedNames = GetDiskCatalog()
            .Select(r => r.Title)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLowerInvariant();
            seedNames = seedNames.Where(n => n.ToLower().Contains(q));
        }

        return seedNames.Take(limit).ToList();
    }

    public async Task CreateRestaurantAsync(Restaurant restaurant)
    {
        if (string.IsNullOrEmpty(restaurant.Id))
        {
            restaurant.Id = ObjectId.GenerateNewId().ToString();
        }
        try
        {
            await _restaurants.InsertOneAsync(restaurant);
        }
        catch
        {
        }
    }

    public async Task<bool> UpdateRestaurantAsync(string id, Restaurant restaurant)
    {
        try
        {
            var filter = Builders<Restaurant>.Filter.Eq(r => r.Id, id);
            var result = await _restaurants.ReplaceOneAsync(filter, restaurant);
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteRestaurantAsync(string id)
    {
        try
        {
            var filter = Builders<Restaurant>.Filter.Eq(r => r.Id, id);
            var result = await _restaurants.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }
        catch
        {
            return false;
        }
    }
}
