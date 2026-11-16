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

public class HotelRepository : IHotelRepository
{
    private readonly IMongoCollection<Hotel> _hotels;
    private static readonly ConcurrentDictionary<string, List<Hotel>> _diskCatalogCache = new(StringComparer.OrdinalIgnoreCase);

    public HotelRepository(IMongoDatabase database)
    {
        _hotels = database.GetCollection<Hotel>("hotels");
    }

    private string GetDatabaseName() =>
        _hotels.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Hotel> GetDiskCatalog()
    {
        var siteId = GetWebsiteId();

        return _diskCatalogCache.GetOrAdd(siteId, key =>
        {
            var fileName = "hotels.json";
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
                        var list = JsonSerializer.Deserialize<List<Hotel>>(json, opts);
                        if (list != null && list.Count > 0) return list;
                    }
                    catch
                    {
                    }
                }
            }

            return new List<Hotel>();
        });
    }

    public async Task<HotelPagedResult> GetHotelsAsync(HotelFilterParams filters)
    {
        try
        {
            var builder = Builders<Hotel>.Filter;
            var filter = builder.Eq(h => h.Status, "active");

            if (!string.IsNullOrWhiteSpace(filters.Destination))
            {
                var dest = filters.Destination.Trim();
                var regex = new BsonRegularExpression(dest, "i");
                filter = filter & (
                    builder.Regex(h => h.Destination.CityName, regex) |
                    builder.Regex(h => h.Destination.Country, regex) |
                    builder.Regex(h => h.Destination.Address, regex) |
                    builder.Regex(h => h.Title, regex)
                );
            }

            if (!string.IsNullOrWhiteSpace(filters.PropertyType) && !filters.PropertyType.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var pTypeRegex = new BsonRegularExpression($"^{filters.PropertyType.Trim()}$", "i");
                filter = filter & builder.Regex(h => h.PropertyType, pTypeRegex);
            }

            if (!string.IsNullOrWhiteSpace(filters.Collection) && !filters.Collection.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var collSlug = filters.Collection.Trim().ToLowerInvariant();
                filter = filter & builder.AnyEq(h => h.Collections, collSlug);
            }

            if (filters.StarRating.HasValue && filters.StarRating > 0)
            {
                filter = filter & builder.Gte(h => h.StarRating, filters.StarRating.Value);
            }

            if (filters.MinPrice.HasValue && filters.MinPrice > 0)
            {
                filter = filter & builder.Gte(h => h.PricePerNight, filters.MinPrice.Value);
            }

            if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
            {
                filter = filter & builder.Lte(h => h.PricePerNight, filters.MaxPrice.Value);
            }

            if (filters.Amenities != null && filters.Amenities.Count > 0)
            {
                foreach (var am in filters.Amenities)
                {
                    filter = filter & builder.AnyEq(h => h.Amenities, am);
                }
            }

            var total = await _hotels.CountDocumentsAsync(filter);

            if (total > 0)
            {
                var query = _hotels.Find(filter);

                switch (filters.Sort?.ToLowerInvariant())
                {
                    case "price_asc":
                        query = query.SortBy(h => h.PricePerNight);
                        break;
                    case "price_desc":
                        query = query.SortByDescending(h => h.PricePerNight);
                        break;
                    case "rating_desc":
                        query = query.SortByDescending(h => h.Rating).ThenByDescending(h => h.ReviewCount);
                        break;
                    case "popular":
                    default:
                        query = query.SortByDescending(h => h.Rating);
                        break;
                }

                var page = filters.Page < 1 ? 1 : filters.Page;
                var pageSize = filters.PageSize < 1 ? 20 : filters.PageSize;

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                return new HotelPagedResult
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
            var d = filters.Destination.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(h =>
                (h.Destination != null && h.Destination.CityName != null && h.Destination.CityName.ToLower().Contains(d)) ||
                (h.Destination != null && h.Destination.Country != null && h.Destination.Country.ToLower().Contains(d)) ||
                (h.Title != null && h.Title.ToLower().Contains(d)));
        }

        if (filters.StarRating.HasValue && filters.StarRating > 0)
        {
            qSeed = qSeed.Where(h => h.StarRating >= filters.StarRating.Value);
        }

        if (filters.MinPrice.HasValue && filters.MinPrice > 0)
        {
            qSeed = qSeed.Where(h => h.PricePerNight >= filters.MinPrice.Value);
        }

        if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
        {
            qSeed = qSeed.Where(h => h.PricePerNight <= filters.MaxPrice.Value);
        }

        switch (filters.Sort?.ToLowerInvariant())
        {
            case "price_asc":
                qSeed = qSeed.OrderBy(h => h.PricePerNight);
                break;
            case "price_desc":
                qSeed = qSeed.OrderByDescending(h => h.PricePerNight);
                break;
            case "rating_desc":
                qSeed = qSeed.OrderByDescending(h => h.Rating);
                break;
            default:
                qSeed = qSeed.OrderByDescending(h => h.Rating);
                break;
        }

        var p = filters.Page < 1 ? 1 : filters.Page;
        var ps = filters.PageSize < 1 ? 20 : filters.PageSize;
        var list = qSeed.ToList();

        return new HotelPagedResult
        {
            Items = list.Skip((p - 1) * ps).Take(ps).ToList(),
            Total = list.Count,
            Page = p,
            PageSize = ps
        };
    }

    public async Task<Hotel?> GetHotelByIdAsync(string id)
    {
        try
        {
            var h = await _hotels.Find(h => h.Id == id).FirstOrDefaultAsync();
            if (h != null) return h;
        }
        catch
        {
        }

        return GetDiskCatalog().FirstOrDefault(h => h.Id == id || h.Slug == id);
    }

    public async Task<Hotel?> GetHotelBySlugAsync(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;
        var cleanSlug = slug.Trim().ToLowerInvariant();

        try
        {
            var h = await _hotels.Find(h => h.Slug == cleanSlug).FirstOrDefaultAsync();
            if (h != null) return h;
        }
        catch
        {
        }

        return GetDiskCatalog().FirstOrDefault(h => h.Slug != null && h.Slug.ToLower() == cleanSlug);
    }

    public async Task<HotelCollectionsResponse> GetCollectionsAsync()
    {
        List<Hotel> hotels;
        try
        {
            hotels = await _hotels.Find(h => h.Status == "active").ToListAsync();
            if (hotels == null || hotels.Count == 0) hotels = GetDiskCatalog();
        }
        catch
        {
            hotels = GetDiskCatalog();
        }

        var topCities = hotels
            .Where(h => h.Destination != null && !string.IsNullOrWhiteSpace(h.Destination.CityName))
            .GroupBy(h => h.Destination.CityName)
            .OrderByDescending(g => g.Count())
            .Take(6)
            .Select(g => new CityHotelCount
            {
                CityName = g.Key,
                Country = g.First().Destination.Country,
                Count = g.Count(),
                ImageUrl = g.First().CoverImage,
                StartingPrice = g.Min(h => h.PricePerNight),
                Currency = g.First().Currency
            })
            .ToList();

        var collectionsMap = new Dictionary<string, List<Hotel>>();
        foreach (var h in hotels)
        {
            if (h.Collections != null)
            {
                foreach (var c in h.Collections)
                {
                    if (!collectionsMap.ContainsKey(c)) collectionsMap[c] = new List<Hotel>();
                    if (collectionsMap[c].Count < 6) collectionsMap[c].Add(h);
                }
            }
        }

        return new HotelCollectionsResponse
        {
            TopCities = topCities,
            Collections = collectionsMap
        };
    }

    public async Task<List<string>> AutocompleteAsync(string query, int limit = 8)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new List<string>();
        }

        List<Hotel> hotels;
        try
        {
            var regex = new BsonRegularExpression(query.Trim(), "i");
            var filter = Builders<Hotel>.Filter.And(
                Builders<Hotel>.Filter.Eq(h => h.Status, "active"),
                Builders<Hotel>.Filter.Or(
                    Builders<Hotel>.Filter.Regex(h => h.Title, regex),
                    Builders<Hotel>.Filter.Regex(h => h.Destination.CityName, regex),
                    Builders<Hotel>.Filter.Regex(h => h.Destination.Country, regex)
                )
            );

            hotels = await _hotels
                .Find(filter)
                .Limit(limit * 2)
                .ToListAsync();

            if (hotels == null || hotels.Count == 0) hotels = GetDiskCatalog();
        }
        catch
        {
            hotels = GetDiskCatalog();
        }

        var suggestions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var h in hotels)
        {
            if (h.Destination?.CityName != null && h.Destination.CityName.Contains(query, StringComparison.OrdinalIgnoreCase))
            {
                suggestions.Add($"{h.Destination.CityName}, {h.Destination.Country}");
            }
        }

        foreach (var h in hotels)
        {
            if (h.Title != null && h.Title.Contains(query, StringComparison.OrdinalIgnoreCase))
            {
                suggestions.Add(h.Title);
            }
        }

        return suggestions.Take(limit).ToList();
    }

    public async Task CreateHotelAsync(Hotel hotel)
    {
        hotel.CreatedAt = DateTime.UtcNow;
        hotel.Slug = hotel.Slug.Trim().ToLowerInvariant();
        try
        {
            await _hotels.InsertOneAsync(hotel);
        }
        catch
        {
        }
    }

    public async Task<bool> UpdateHotelAsync(string id, Hotel hotel)
    {
        hotel.Slug = hotel.Slug.Trim().ToLowerInvariant();
        try
        {
            var result = await _hotels.ReplaceOneAsync(h => h.Id == id, hotel);
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteHotelAsync(string id)
    {
        try
        {
            var result = await _hotels.DeleteOneAsync(h => h.Id == id);
            return result.DeletedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task UpsertHotelBySlugAsync(Hotel hotel)
    {
        hotel.Slug = hotel.Slug.Trim().ToLowerInvariant();
        try
        {
            var filter = Builders<Hotel>.Filter.Eq(h => h.Slug, hotel.Slug);
            await _hotels.ReplaceOneAsync(filter, hotel, new ReplaceOptions { IsUpsert = true });
        }
        catch
        {
        }
    }

    public async Task<long> DeleteDemoHotelsAsync()
    {
        try
        {
            var result = await _hotels.DeleteManyAsync(h => h.IsDemo == true);
            return result.DeletedCount;
        }
        catch
        {
            return 0;
        }
    }
}
