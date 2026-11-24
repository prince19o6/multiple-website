using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
public class CoreHomeController : ControllerBase
{
    private readonly IWebsiteContext _websiteContext;
    private readonly IWebHostEnvironment _env;
    private readonly IMongoDatabase _database;
    private readonly ILogger<CoreHomeController> _logger;

    private static readonly Dictionary<string, (DateTime ExpiresAt, JsonNode Data)> Cache = new();
    private static readonly object CacheLock = new();

    private static readonly string[] HotelPhotos = new[]
    {
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=85",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=85",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=85",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=85",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=85",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85"
    };

    private static readonly string[] TourPhotos = new[]
    {
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85",
        "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&q=85",
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85",
        "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=1200&q=85",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=85",
        "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=85",
        "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&q=85",
        "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&q=85"
    };

    private static readonly string[] PackagePhotos = new[]
    {
        "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=85",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85",
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85",
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85",
        "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?w=1200&q=85",
        "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=85",
        "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=85",
        "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1200&q=85"
    };

    private static readonly string[] FlightPhotos = new[]
    {
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85",
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85",
        "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1200&q=85",
        "https://images.unsplash.com/photo-1520437358207-323b43b50729?w=1200&q=85"
    };

    private static readonly string[] TransferPhotos = new[]
    {
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85",
        "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&q=85",
        "https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=1200&q=85"
    };

    private static readonly string[] VisaPhotos = new[]
    {
        "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85",
        "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=85",
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
        "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=85"
    };

    private static readonly string[] RestaurantPhotos = new[]
    {
        "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=85",
        "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200&q=85",
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&q=85"
    };

    private static readonly string[] BuildPackagePhotos = new[]
    {
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85",
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=85"
    };

    private static string ResolveActualPhoto(string? raw, string module, int index)
    {
        if (!string.IsNullOrWhiteSpace(raw))
        {
            if (raw.StartsWith("/seed-images/", StringComparison.OrdinalIgnoreCase) ||
                raw.StartsWith("/assets/", StringComparison.OrdinalIgnoreCase))
            {
                return raw;
            }

            if (raw.StartsWith("http", StringComparison.OrdinalIgnoreCase) &&
                !raw.EndsWith(".svg", StringComparison.OrdinalIgnoreCase) &&
                !raw.Contains("/seed-images/"))
            {
                return raw;
            }
        }

        var pool = module.ToLowerInvariant() switch
        {
            "hotels" => HotelPhotos,
            "tours" => TourPhotos,
            "packages" => PackagePhotos,
            "flights" => FlightPhotos,
            "transfers" => TransferPhotos,
            "visas" => VisaPhotos,
            "restaurants" => RestaurantPhotos,
            "buildpackage" => BuildPackagePhotos,
            _ => HotelPhotos
        };

        return pool[Math.Abs(index) % pool.Length];
    }

    private static double AsDouble(JsonNode? node, double fallback = 0.0)
    {
        if (node == null) return fallback;
        if (node is JsonValue val)
        {
            if (val.TryGetValue<double>(out var d)) return d;
            if (val.TryGetValue<int>(out var i)) return (double)i;
            if (val.TryGetValue<long>(out var l)) return (double)l;
            if (val.TryGetValue<decimal>(out var m)) return (double)m;
        }
        var s = node.ToString();
        if (double.TryParse(s, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsed))
            return parsed;
        return fallback;
    }

    private static int AsInt(JsonNode? node, int fallback = 0)
    {
        if (node == null) return fallback;
        if (node is JsonValue val)
        {
            if (val.TryGetValue<int>(out var i)) return i;
            if (val.TryGetValue<double>(out var d)) return (int)Math.Round(d);
            if (val.TryGetValue<long>(out var l)) return (int)l;
        }
        var s = node.ToString();
        if (int.TryParse(s, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsed))
            return parsed;
        if (double.TryParse(s, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsedD))
            return (int)Math.Round(parsedD);
        return fallback;
    }

    public CoreHomeController(
        IWebsiteContext websiteContext,
        IWebHostEnvironment env,
        IMongoDatabase database,
        ILogger<CoreHomeController> logger)
    {
        _websiteContext = websiteContext;
        _env = env;
        _database = database;
        _logger = logger;
    }

    private string ResolveSiteId(string? siteQuery)
    {
        if (!string.IsNullOrWhiteSpace(siteQuery))
        {
            var matched = WebsiteRegistry.Resolve(siteQuery);
            if (matched != null) return matched.WebsiteId;
            if (siteQuery.Equals("gujjutours", StringComparison.OrdinalIgnoreCase)) return "website1";
            if (siteQuery.Equals("tripgoasia", StringComparison.OrdinalIgnoreCase)) return "website2";
            if (siteQuery.Equals("technoheaven", StringComparison.OrdinalIgnoreCase)) return "website3";
        }

        var current = _websiteContext.CurrentSite;
        return current?.WebsiteId ?? "website1";
    }

    private string NormalizeSiteName(string siteId)
    {
        return siteId switch
        {
            "website2" => "tripgoasia",
            "tripgoasia" => "tripgoasia",
            "website3" => "technoheaven",
            "technoheaven" => "technoheaven",
            _ => "gujjutours"
        };
    }

    private string NormalizeModule(string? module)
    {
        if (string.IsNullOrWhiteSpace(module)) return "hotels";
        var m = module.Trim().ToLowerInvariant();
        return m switch
        {
            "hotel" or "hotels" => "hotels",
            "tour" or "tours" or "activities" or "activity" => "tours",
            "package" or "packages" or "holiday" or "holidays" => "packages",
            "flight" or "flights" => "flights",
            "transfer" or "transfers" => "transfers",
            "visa" or "visas" => "visas",
            "restaurant" or "restaurants" or "dining" => "restaurants",
            "buildpackage" or "build-package" or "custompackage" => "buildpackage",
            _ => "hotels"
        };
    }

    private JsonArray LoadSeedJson(string siteName, string filename)
    {
        var cacheKey = $"seed:{siteName}:{filename}";
        lock (CacheLock)
        {
            if (Cache.TryGetValue(cacheKey, out var entry) && entry.ExpiresAt > DateTime.UtcNow)
            {
                return entry.Data.AsArray();
            }
        }

        var candidatePaths = new[]
        {
            Path.Combine(_env.ContentRootPath, "seed", siteName, filename),
            Path.Combine(_env.ContentRootPath, "backend", "toursApi", "seed", siteName, filename),
            Path.Combine(AppContext.BaseDirectory, "seed", siteName, filename),
            Path.Combine(AppContext.BaseDirectory, "backend", "toursApi", "seed", siteName, filename),
            Path.Combine(Directory.GetCurrentDirectory(), "seed", siteName, filename),
            Path.Combine(Directory.GetCurrentDirectory(), "backend", "toursApi", "seed", siteName, filename),
            Path.Combine(_env.ContentRootPath, "Catalog", "Fixtures", filename),
            Path.Combine(Directory.GetCurrentDirectory(), "Catalog", "Fixtures", filename)
        };

        foreach (var path in candidatePaths)
        {
            if (System.IO.File.Exists(path))
            {
                try
                {
                    var json = System.IO.File.ReadAllText(path);
                    var parsed = JsonNode.Parse(json)?.AsArray();
                    if (parsed != null && parsed.Count > 0)
                    {
                        lock (CacheLock)
                        {
                            Cache[cacheKey] = (DateTime.UtcNow.AddMinutes(15), parsed);
                        }
                        return parsed;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to read seed file {Path}", path);
                }
            }
        }

        return new JsonArray();
    }

    /// <summary>
    /// GET /api/home?module={module}&site={site}
    /// GET /api/core/v1/home?module={module}&site={site}
    /// Returns unified home page structure driven strictly by the active module.
    /// </summary>
    [HttpGet("api/home")]
    [HttpGet("api/core/v1/home")]
    public async Task<IActionResult> GetHome([FromQuery] string? module, [FromQuery] string? site)
    {
        var siteId = ResolveSiteId(site);
        var siteName = NormalizeSiteName(siteId);
        var activeModule = NormalizeModule(module);

        var response = await BuildHomePayload(siteName, activeModule);
        return Ok(response);
    }

    /// <summary>
    /// GET /api/core/v1/{module}/categories
    /// </summary>
    [HttpGet("api/core/v1/{module}/categories")]
    public IActionResult GetCategories(string module, [FromQuery] string? site)
    {
        var siteId = ResolveSiteId(site);
        var siteName = NormalizeSiteName(siteId);
        var activeModule = NormalizeModule(module);

        var categories = FetchCategoriesForModule(siteName, activeModule);
        return Ok(new
        {
            success = true,
            site = siteName,
            module = activeModule,
            count = categories.Count,
            data = categories
        });
    }

    /// <summary>
    /// GET /api/core/v1/{module}/featured
    /// </summary>
    [HttpGet("api/core/v1/{module}/featured")]
    public IActionResult GetFeatured(string module, [FromQuery] string? site, [FromQuery] int limit = 6)
    {
        var siteId = ResolveSiteId(site);
        var siteName = NormalizeSiteName(siteId);
        var activeModule = NormalizeModule(module);

        var featured = FetchFeaturedForModule(siteName, activeModule, limit);
        return Ok(new
        {
            success = true,
            site = siteName,
            module = activeModule,
            count = featured.Count,
            data = featured
        });
    }

    /// <summary>
    /// GET /api/core/v1/{module}/destinations
    /// </summary>
    [HttpGet("api/core/v1/{module}/destinations")]
    public IActionResult GetDestinations(string module, [FromQuery] string? site)
    {
        var siteId = ResolveSiteId(site);
        var siteName = NormalizeSiteName(siteId);
        var activeModule = NormalizeModule(module);

        var destinations = FetchDestinationsForModule(siteName, activeModule);
        return Ok(new
        {
            success = true,
            site = siteName,
            module = activeModule,
            count = destinations.Count,
            data = destinations
        });
    }

    /// <summary>
    /// GET /api/core/v1/search/suggest?type=hotel|tour|airport|city|all&q=...
    /// </summary>
    [HttpGet("api/core/v1/search/suggest")]
    public async Task<IActionResult> GetSearchSuggestions(
        [FromQuery] string? type,
        [FromQuery] string? q,
        [FromQuery] string? site,
        [FromQuery] int limit = 10)
    {
        var cleanQ = (q ?? "").Trim();
        var targetType = (type ?? "all").Trim().ToLowerInvariant();
        var results = new List<object>();

        var airports = new[]
        {
            new { code = "STV", name = "Surat Gujarat Airport", city = "Surat", country = "India" },
            new { code = "BOM", name = "Chhatrapati Shivaji Maharaj Intl", city = "Mumbai", country = "India" },
            new { code = "DEL", name = "Indira Gandhi International Airport", city = "Delhi", country = "India" },
            new { code = "AMD", name = "Sardar Vallabhbhai Patel Intl", city = "Ahmedabad", country = "India" },
            new { code = "DXB", name = "Dubai International Airport", city = "Dubai", country = "UAE" },
            new { code = "BLR", name = "Kempegowda International Airport", city = "Bengaluru", country = "India" },
            new { code = "GOI", name = "Goa Dabolim Airport", city = "Goa", country = "India" },
            new { code = "BKK", name = "Suvarnabhumi Airport", city = "Bangkok", country = "Thailand" },
            new { code = "SIN", name = "Singapore Changi Airport", city = "Singapore", country = "Singapore" },
            new { code = "LHR", name = "London Heathrow Airport", city = "London", country = "United Kingdom" },
            new { code = "JFK", name = "John F Kennedy International", city = "New York", country = "United States" },
            new { code = "CDG", name = "Charles de Gaulle Airport", city = "Paris", country = "France" },
            new { code = "DPS", name = "Ngurah Rai International Airport", city = "Bali", country = "Indonesia" },
            new { code = "KUL", name = "Kuala Lumpur International Airport", city = "Kuala Lumpur", country = "Malaysia" }
        };

        try
        {
            // 1. Airports
            if (targetType == "airport" || targetType == "flight" || targetType == "all")
            {
                var matchedAirports = airports
                    .Where(a => string.IsNullOrWhiteSpace(cleanQ) ||
                                a.code.Contains(cleanQ, StringComparison.OrdinalIgnoreCase) ||
                                a.name.Contains(cleanQ, StringComparison.OrdinalIgnoreCase) ||
                                a.city.Contains(cleanQ, StringComparison.OrdinalIgnoreCase) ||
                                a.country.Contains(cleanQ, StringComparison.OrdinalIgnoreCase))
                    .Take(targetType == "airport" ? limit : Math.Min(limit, 5))
                    .Select(a => new
                    {
                        id = a.code,
                        name = $"{a.city} ({a.code})",
                        type = "airport",
                        code = a.code,
                        city = a.city,
                        country = a.country,
                        subtitle = a.name,
                        image = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=150&q=80"
                    });
                results.AddRange(matchedAirports);
            }

            // 2. Hotels
            if ((targetType == "hotel" || targetType == "hotels" || targetType == "all") && results.Count < limit)
            {
                var filterBuilder = Builders<Hotel>.Filter;
                var filter = filterBuilder.Ne(h => h.Status, "inactive");
                if (!string.IsNullOrWhiteSpace(cleanQ))
                {
                    filter &= (filterBuilder.Regex(h => h.Title, new MongoDB.Bson.BsonRegularExpression(cleanQ, "i")) |
                               filterBuilder.Regex("destination.cityName", new MongoDB.Bson.BsonRegularExpression(cleanQ, "i")) |
                               filterBuilder.Regex("destination.country", new MongoDB.Bson.BsonRegularExpression(cleanQ, "i")));
                }

                var hotels = await _database.GetCollection<Hotel>("hotels")
                    .Find(filter)
                    .Limit(limit - results.Count)
                    .ToListAsync();

                foreach (var h in hotels)
                {
                    var city = h.Destination?.CityName ?? "Destination";
                    var country = h.Destination?.Country ?? "";
                    results.Add(new
                    {
                        id = h.Id ?? h.Slug,
                        name = h.Title,
                        type = "hotel",
                        city = city,
                        country = country,
                        subtitle = string.IsNullOrWhiteSpace(country) ? city : $"{city}, {country}",
                        image = h.Images?.FirstOrDefault() ?? "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=150&q=80",
                        count = h.StarRating > 0 ? (int)h.StarRating : 4
                    });
                }
            }

            // 3. Tours / Sightseeing
            if ((targetType == "tour" || targetType == "tours" || targetType == "activity" || targetType == "sightseeing" || targetType == "all") && results.Count < limit)
            {
                var filterBuilder = Builders<Tour>.Filter;
                var filter = filterBuilder.Empty;
                if (!string.IsNullOrWhiteSpace(cleanQ))
                {
                    filter = filterBuilder.Regex(t => t.Title, new MongoDB.Bson.BsonRegularExpression(cleanQ, "i")) |
                             filterBuilder.Regex(t => t.Name, new MongoDB.Bson.BsonRegularExpression(cleanQ, "i")) |
                             filterBuilder.Regex(t => t.Destination, new MongoDB.Bson.BsonRegularExpression(cleanQ, "i")) |
                             filterBuilder.Regex(t => t.Country, new MongoDB.Bson.BsonRegularExpression(cleanQ, "i"));
                }

                var tours = await _database.GetCollection<Tour>("tours")
                    .Find(filter)
                    .Limit(limit - results.Count)
                    .ToListAsync();

                foreach (var t in tours)
                {
                    var tourTitle = !string.IsNullOrWhiteSpace(t.Title) ? t.Title : t.Name;
                    var city = t.Destination ?? "";
                    var country = t.Country ?? "";
                    results.Add(new
                    {
                        id = t.Id ?? t.Slug,
                        name = tourTitle,
                        type = "tour",
                        city = city,
                        country = country,
                        subtitle = string.IsNullOrWhiteSpace(country) ? city : $"{city}, {country}",
                        image = t.Images?.FirstOrDefault() ?? "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=150&q=80",
                        count = t.DurationDays > 0 ? t.DurationDays : 1
                    });
                }
            }

            // 4. Cities / Destinations
            if ((targetType == "city" || targetType == "destination" || targetType == "all") && results.Count < limit)
            {
                var filterBuilder = Builders<Destination>.Filter;
                var filter = filterBuilder.Empty;
                if (!string.IsNullOrWhiteSpace(cleanQ))
                {
                    filter = filterBuilder.Regex(d => d.Name, new MongoDB.Bson.BsonRegularExpression(cleanQ, "i")) |
                             filterBuilder.Regex(d => d.Country, new MongoDB.Bson.BsonRegularExpression(cleanQ, "i"));
                }

                var destinations = await _database.GetCollection<Destination>("destinations")
                    .Find(filter)
                    .Limit(limit - results.Count)
                    .ToListAsync();

                foreach (var d in destinations)
                {
                    results.Add(new
                    {
                        id = d.Id ?? d.Name.ToLowerInvariant(),
                        name = d.Name,
                        type = "city",
                        city = d.Name,
                        country = d.Country ?? "",
                        subtitle = string.IsNullOrWhiteSpace(d.Country) ? d.Name : $"{d.Name}, {d.Country}",
                        image = !string.IsNullOrWhiteSpace(d.Image) ? d.Image : "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&q=80",
                        count = d.Tours > 0 ? d.Tours : 10
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load database suggestions, returning local fallback.");
        }

        // Fallback default list if DB was empty or failed
        if (results.Count == 0)
        {
            var fallback = new[]
            {
                new { id = "dubai", name = "Dubai", type = "city", subtitle = "United Arab Emirates", city = "Dubai", country = "United Arab Emirates", count = 4684, image = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=150&q=80" },
                new { id = "goa", name = "Goa", type = "city", subtitle = "India", city = "Goa", country = "India", count = 2750, image = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=150&q=80" },
                new { id = "bangkok", name = "Bangkok", type = "city", subtitle = "Thailand", city = "Bangkok", country = "Thailand", count = 2663, image = "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=150&q=80" },
                new { id = "singapore", name = "Singapore", type = "city", subtitle = "Singapore", city = "Singapore", country = "Singapore", count = 709, image = "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=150&q=80" },
                new { id = "jaipur", name = "Jaipur", type = "city", subtitle = "Rajasthan, India", city = "Jaipur", country = "India", count = 1117, image = "https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?w=150&q=80" },
                new { id = "kashmir", name = "Srinagar & Kashmir", type = "city", subtitle = "India", city = "Srinagar", country = "India", count = 420, image = "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=150&q=80" },
            };

            var filteredFallback = fallback
                .Where(f => string.IsNullOrWhiteSpace(cleanQ) ||
                            f.name.Contains(cleanQ, StringComparison.OrdinalIgnoreCase) ||
                            f.country.Contains(cleanQ, StringComparison.OrdinalIgnoreCase))
                .Take(limit);

            results.AddRange(filteredFallback);
        }

        return Ok(new
        {
            success = true,
            query = cleanQ,
            type = targetType,
            count = results.Count,
            data = results
        });
    }

    private async Task<List<object>> FetchDynamicFeaturedFromDbAsync(string module, int limit = 6)
    {
        var items = new List<object>();
        try
        {
            switch (module.ToLowerInvariant())
            {
                case "hotels":
                    var hotels = await _database.GetCollection<Hotel>("hotels")
                        .Find(h => h.Status != "inactive")
                        .Limit(limit)
                        .ToListAsync();
                    foreach (var h in hotels)
                    {
                        var img = h.Images?.FirstOrDefault() ?? ResolveActualPhoto(null, "hotels", 0);
                        items.Add(new
                        {
                            id = h.Id ?? h.Slug,
                            slug = h.Slug,
                            title = h.Title,
                            name = h.Title,
                            rating = h.StarRating > 0 ? (double)h.StarRating : 4.8,
                            reviewsCount = 42,
                            price = h.Rooms?.FirstOrDefault()?.PricePerNight ?? 150.0,
                            currency = h.Currency ?? "USD",
                            image = img,
                            location = h.Destination?.Address ?? h.Destination?.CityName ?? "City Center",
                            badge = h.Featured ? "FEATURED STAY" : "POPULAR",
                            amenities = h.Amenities ?? new List<string>()
                        });
                    }
                    break;

                case "tours":
                    var tours = await _database.GetCollection<Tour>("tours")
                        .Find(t => t.Status != "Inactive" && t.Status != "inactive")
                        .Limit(limit)
                        .ToListAsync();
                    foreach (var t in tours)
                    {
                        var img = !string.IsNullOrWhiteSpace(t.Image) ? t.Image : (t.Gallery?.FirstOrDefault() ?? ResolveActualPhoto(null, "tours", 0));
                        items.Add(new
                        {
                            id = t.Id ?? t.Slug,
                            slug = t.Slug,
                            title = t.Name,
                            name = t.Name,
                            rating = t.Rating > 0 ? t.Rating : 4.9,
                            reviewsCount = t.Reviews > 0 ? t.Reviews : 85,
                            price = t.Price,
                            duration = t.Duration ?? "Half Day",
                            image = img,
                            location = t.Location ?? t.Destination ?? "Dubai",
                            badge = t.Featured ? "TOP PICK" : "POPULAR",
                            category = t.Category ?? "Adventure"
                        });
                    }
                    break;

                case "packages":
                    var pkgs = await _database.GetCollection<Package>("packages")
                        .Find(p => p.Status != "Inactive" && p.Status != "inactive")
                        .Limit(limit)
                        .ToListAsync();
                    foreach (var p in pkgs)
                    {
                        var img = !string.IsNullOrWhiteSpace(p.Image) ? p.Image : (p.Images?.FirstOrDefault() ?? ResolveActualPhoto(null, "packages", 0));
                        items.Add(new
                        {
                            id = p.Id ?? p.Slug,
                            slug = p.Slug,
                            title = p.Title,
                            name = p.Title,
                            rating = p.Rating > 0 ? p.Rating : 4.9,
                            reviewsCount = 50,
                            price = p.Price,
                            duration = p.Duration ?? "4 Nights / 5 Days",
                            image = img,
                            location = p.Destination ?? "Exotic Destination",
                            badge = "CURATED COMBO"
                        });
                    }
                    break;

                case "flights":
                    var flights = await _database.GetCollection<Flight>("flights")
                        .Find(f => f.Status != "Inactive" && f.Status != "inactive")
                        .Limit(limit)
                        .ToListAsync();
                    foreach (var f in flights)
                    {
                        var origin = f.FromAirport?.City ?? f.FromAirport?.Code ?? "Origin";
                        var destination = f.ToAirport?.City ?? f.ToAirport?.Code ?? "Destination";
                        items.Add(new
                        {
                            id = f.Id ?? f.Slug,
                            slug = f.Slug,
                            title = $"{f.Airline} - {origin} to {destination}",
                            airline = f.Airline,
                            flightNumber = f.FlightNumber,
                            origin = origin,
                            destination = destination,
                            departureTime = f.DepartureTime,
                            arrivalTime = f.ArrivalTime,
                            price = f.Price,
                            currency = f.Currency,
                            airlineLogo = f.AirlineLogo ?? ResolveActualPhoto(null, "flights", 0),
                            badge = "DIRECT FLIGHT"
                        });
                    }
                    break;

                case "transfers":
                    var transfers = await _database.GetCollection<Transfer>("transfers")
                        .Find(t => t.Status != "Inactive" && t.Status != "inactive")
                        .Limit(limit)
                        .ToListAsync();
                    foreach (var t in transfers)
                    {
                        var img = !string.IsNullOrWhiteSpace(t.Image) ? t.Image : ResolveActualPhoto(null, "transfers", 0);
                        items.Add(new
                        {
                            id = t.Id ?? t.Slug,
                            slug = t.Slug,
                            title = t.Name,
                            vehicleType = t.VehicleType,
                            capacity = t.MaxPassengers,
                            luggageCapacity = t.MaxLuggage,
                            price = t.Price,
                            currency = t.Currency,
                            image = img,
                            badge = "PRIVATE CHAUFFEUR"
                        });
                    }
                    break;

                case "visas":
                    var visas = await _database.GetCollection<Visa>("visas")
                        .Find(v => v.Status != "Inactive" && v.Status != "inactive")
                        .Limit(limit)
                        .ToListAsync();
                    foreach (var v in visas)
                    {
                        var img = !string.IsNullOrWhiteSpace(v.Image) ? v.Image : ResolveActualPhoto(null, "visas", 0);
                        items.Add(new
                        {
                            id = v.Id ?? v.Slug,
                            slug = v.Slug,
                            title = $"{v.Country} {v.VisaType}",
                            country = v.Country,
                            visaType = v.VisaType,
                            processingTime = v.ProcessingTime,
                            price = v.Price,
                            currency = v.Currency,
                            image = img,
                            badge = "FAST TRACK VISA"
                        });
                    }
                    break;

                case "restaurants":
                    var restaurants = await _database.GetCollection<Restaurant>("restaurants")
                        .Find(r => r.Status != "Inactive" && r.Status != "inactive")
                        .Limit(limit)
                        .ToListAsync();
                    foreach (var r in restaurants)
                    {
                        var img = !string.IsNullOrWhiteSpace(r.Image) ? r.Image : ResolveActualPhoto(null, "restaurants", 0);
                        items.Add(new
                        {
                            id = r.Id ?? r.Slug,
                            slug = r.Slug,
                            title = r.Name,
                            cuisine = r.Cuisine,
                            rating = r.Rating > 0 ? r.Rating : 4.8,
                            priceRange = r.PriceRange,
                            price = r.CostForTwo > 0 ? r.CostForTwo : 0,
                            costForTwo = r.CostForTwo > 0 ? r.CostForTwo : 0,
                            image = img,
                            address = r.Address,
                            city = r.City,
                            reviewCount = r.Reviews > 0 ? r.Reviews : 100,
                            pureVeg = r.IsPureVeg,
                            jainAvailable = r.IsJainAvailable,
                            halalCertified = r.IsHalalCertified,
                            badge = r.IsPureVeg ? "PURE VEG & JAIN" : "GOURMET DINING"
                        });
                    }
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch dynamic featured items from DB for module {Module}", module);
        }
        return items;
    }

    private async Task<object> BuildHomePayload(string siteName, string module)
    {
        try
        {
            var meta = GetModuleMeta(siteName, module);

            // 1. Dynamic Hero Banners from MongoDB
            var bannersCol = _database.GetCollection<Banner>("hero_banners");
            var dbBanners = await bannersCol.Find(b => b.IsActive && (b.Module == module || b.Module == "home" || b.Module == "all"))
                .SortBy(b => b.SortOrder)
                .ToListAsync();

            // 2. Dynamic Categories from MongoDB
            var categoriesCol = _database.GetCollection<Category>("categories");
            var dbCategories = await categoriesCol.Find(c => c.Enabled && (c.Module == module || c.Module == "all"))
                .SortBy(c => c.Order)
                .ToListAsync();

            // 3. Dynamic Special Offers from MongoDB
            var offersCol = _database.GetCollection<SpecialOffer>("special_offers");
            var dbOffers = await offersCol.Find(o => o.IsActive && (o.Module == module || o.Module == "all"))
                .SortBy(o => o.SortOrder)
                .ToListAsync();

            // 4. Dynamic Videos from MongoDB
            var videosCol = _database.GetCollection<TravelVideo>("travel_videos");
            var dbVideos = await videosCol.Find(v => v.IsActive && (v.Module == module || v.Module == "all"))
                .SortBy(v => v.SortOrder)
                .ToListAsync();

            // 5. Dynamic Reviews from MongoDB
            var reviewsCol = _database.GetCollection<Review>("reviews");
            var dbReviews = await reviewsCol.Find(r => r.IsActive && (r.Module == module || r.Module == "all"))
                .SortBy(r => r.SortOrder)
                .ToListAsync();

            // 6. Dynamic FAQs from MongoDB
            var faqsCol = _database.GetCollection<FaqItem>("faqs");
            var dbFaqs = await faqsCol.Find(f => f.IsActive)
                .SortBy(f => f.SortOrder)
                .ToListAsync();

            // 7. Dynamic Partners from MongoDB
            var partnersCol = _database.GetCollection<Partner>("partners");
            var dbPartners = await partnersCol.Find(p => p.IsActive)
                .SortBy(p => p.SortOrder)
                .ToListAsync();

            // 8. Dynamic Destinations from MongoDB
            var destsCol = _database.GetCollection<Destination>("destinations");
            var dbDestinations = await destsCol.Find(_ => true)
                .SortBy(d => d.SortOrder)
                .ToListAsync();

            // 9. Dynamic Curated Packages from MongoDB
            var packagesCol = _database.GetCollection<Package>("packages");
            var dbPackages = await packagesCol.Find(p => p.Status != "Inactive" && p.Status != "inactive")
                .Limit(8)
                .ToListAsync();

            // 10. Dynamic Featured Items from Active Module Collection in MongoDB
            var featured = await FetchDynamicFeaturedFromDbAsync(module, 6);
            if (featured == null || featured.Count == 0)
            {
                var fallbackFeatured = FetchFeaturedForModule(siteName, module, 6);
                if (fallbackFeatured != null && fallbackFeatured.Count > 0)
                {
                    featured = fallbackFeatured.Cast<object>().ToList();
                }
                else
                {
                    featured = ResilientDataGenerator.GetItemsForModule(module, 6, siteName).Cast<object>().ToList();
                }
            }

            // Categories fallback if DB collection has 0
            object categoriesData = dbCategories.Count > 0
                ? (object)dbCategories.Select(c => new
                {
                    id = c.Id ?? c.Slug,
                    slug = c.Slug,
                    name = c.Name.TryGetValue("en", out var n) ? n : c.Slug,
                    icon = c.Icon,
                    order = c.Order,
                    module = c.Module
                }).ToList()
                : FetchCategoriesForModule(siteName, module);

            // Banners / Offers
            object bannersData = dbBanners.Count > 0
                ? (object)dbBanners
                : (dbOffers.Count > 0 ? (object)dbOffers : GetOfferBanners(siteName, module));

            // Offers
            object offersData = dbOffers.Count > 0
                ? (object)dbOffers
                : GetOfferBanners(siteName, module);

            // Destinations
            object destinationsData = dbDestinations.Count > 0
                ? (object)dbDestinations
                : FetchDestinationsForModule(siteName, module);

            // Packages
            object packagesData = dbPackages.Count > 0
                ? (object)dbPackages
                : FetchCuratedPackages(siteName, module);

            // Videos
            object videosData = dbVideos.Count > 0
                ? (object)dbVideos
                : GetVideoExperiences(siteName, module);

            // Reviews
            object reviewsData = dbReviews.Count > 0
                ? (object)dbReviews
                : GetReviews(siteName, module);

            // FAQ
            object faqData = dbFaqs.Count > 0
                ? (object)dbFaqs
                : GetFaqAccordion(siteName, module);

            // Partners
            object partnersData = dbPartners.Count > 0
                ? (object)dbPartners
                : SeedDataCatalog.GetPartners(siteName);

            // 11. Website config for theme, stats, trust badges
            var configCol = _database.GetCollection<WebsiteConfigDocument>("website_configs");
            var siteDoc = await configCol.Find(c => true).FirstOrDefaultAsync();

            object result = new
            {
                success = true,
                websiteId = siteName,
                module = module,
                meta = meta,
                banners = bannersData,
                heroBanners = dbBanners,
                offers = offersData,
                featured = featured,
                destinations = destinationsData,
                categories = categoriesData,
                packages = packagesData,
                videos = videosData,
                reviews = reviewsData,
                faq = faqData,
                partners = partnersData,
                siteConfig = siteDoc != null ? siteDoc.Config.ToDictionary() : null
            };

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed building dynamic home payload for module {Module}. Falling back to resilient generator.", module);
            return ResilientDataGenerator.BuildSafeHomePayload(siteName, module);
        }
    }

    private object GetModuleMeta(string siteName, string module)
    {
        var isGujju = siteName == "gujjutours";
        var isTripGo = siteName == "tripgoasia";

        return module switch
        {
            "hotels" => new
            {
                title = isGujju ? "Perfect Stays in Dubai & Worldwide" : isTripGo ? "Tropical Resorts & Stays" : "Wholesale Hotel Inventory",
                subtitle = isGujju ? "Handpicked luxury resorts, beachside villas, and city center hotels with Pure Veg & Jain dining options." : "Verified star hotels, beachfront villas, and executive suites across top destinations.",
                badge = "VERIFIED STAYS & RESORTS",
                searchModule = "HOTEL",
                citySectionTitle = isGujju ? "Find Top Stays in Popular Cities" : "Top Destination Stays",
                collectionTitle = "Featured Hotel Collections & Stays",
                collectionSubtitle = "Handpicked 5-star properties, beachfront villas, and luxury city center stays.",
                viewMoreUrl = "/en/hotels"
            },
            "tours" => new
            {
                title = isGujju ? "Top Activities & Desert Safaris in Dubai" : isTripGo ? "Exciting Island Excursions & Tours" : "B2B Excursions & Sightseeing",
                subtitle = isGujju ? "Discover dune bashing, Burj Khalifa observation decks, luxury yacht cruises, and theme parks." : "Top-rated cultural tours, island hopping, adventure parks, and guided expeditions.",
                badge = "EXPERIENCES & EXCURSIONS",
                searchModule = "TOUR",
                citySectionTitle = "Top Activities in Destinations",
                collectionTitle = "Top Tour Combos & Multi-Day Experiences",
                collectionSubtitle = "Best-value bundled excursions, desert safaris, and attraction fast-track passes.",
                viewMoreUrl = "/en/tours"
            },
            "packages" => new
            {
                title = isGujju ? "Curated Holiday Packages with Jain Meals" : isTripGo ? "All-Inclusive Southeast Asia Packages" : "Dynamic Wholesale Holiday Packages",
                subtitle = isGujju ? "All-inclusive family getaways, honeymoon packages, and domestic holiday tours." : "Carefully crafted vacations with flights, luxury hotels, transfers, and daily sightseeing included.",
                badge = "HANDCRAFTED HOLIDAYS",
                searchModule = "PACKAGE",
                citySectionTitle = "Popular Package Destinations",
                collectionTitle = "Curated Holiday Packages",
                collectionSubtitle = "Dubai, Jain-friendly domestic, and international holiday escapes.",
                viewMoreUrl = "/en/holidays"
            },
            "flights" => new
            {
                title = isGujju ? "Popular Flight Routes & Best Airfares" : "Top Domestic & International Flights",
                subtitle = "Compare low airfares across leading domestic and global airlines with meal selections and instant booking.",
                badge = "EXCLUSIVE AIRFARES",
                searchModule = "FLIGHT",
                citySectionTitle = "Trending Flight Routes",
                collectionTitle = "Trending Flight Routes & Airfares",
                collectionSubtitle = "Direct flight tickets with complimentary vegetarian and Jain meal confirmation.",
                viewMoreUrl = "/en/flights"
            },
            "transfers" => new
            {
                title = "Seamless Airport & City Transfers",
                subtitle = "Private executive sedans, spacious SUVs, and luxury coaches with verified, punctual English-speaking chauffeurs.",
                badge = "SAFE & ON-TIME TRANSFERS",
                searchModule = "TRANSFER",
                citySectionTitle = "Top Transfer Locations & Airport Hubs",
                collectionTitle = "Popular Airport & Intercity Transfer Routes",
                collectionSubtitle = "Fixed-rate private executive sedans, spacious SUVs, and airport meet & greet.",
                viewMoreUrl = "/en/transfers"
            },
            "visas" => new
            {
                title = isGujju ? "Fast & Reliable Visa Services" : "International Tourist & Express Visas",
                subtitle = "Tourist, express, and business visas with end-to-end documentation support and high approval rates.",
                badge = "EXPRESS VISA PROCESSING",
                searchModule = "VISA",
                citySectionTitle = "Popular Visa Countries",
                collectionTitle = "Fast-Track Visa Types & Express Services",
                collectionSubtitle = "Official tourist and express visas with rapid document pre-verification and 99.4% approval.",
                viewMoreUrl = "/en/visas"
            },
            "restaurants" => new
            {
                title = isGujju ? "Top Dining & Pure Veg Restaurants" : "Finest Dining & Culinary Experiences",
                subtitle = isGujju ? "Verified 100% Pure Veg and Jain friendly restaurants serving Gujarati, North Indian, and international delicacies." : "Top-rated restaurants, rooftop lounges, and authentic culinary dining.",
                badge = "CULINARY EXPERIENCES",
                searchModule = "RESTAURANT",
                citySectionTitle = "Top Dining Destinations",
                collectionTitle = "Special Dining Packages & Thali Passes",
                collectionSubtitle = "Pre-booked pure veg thali experiences, dinner cruises, and family buffets.",
                viewMoreUrl = "/en/restaurants"
            },
            "buildpackage" => new
            {
                title = "Custom Tailor-Made Holidays",
                subtitle = "Mix and match hotels, private transfers, daily activities, and flights into a personalized dream itinerary.",
                badge = "TAILOR-MADE ITINERARIES",
                searchModule = "BUILDPACKAGE",
                citySectionTitle = "Custom Package Hubs",
                collectionTitle = "Popular Custom Itinerary Templates",
                collectionSubtitle = "Pre-designed customizable itineraries ready to modify and book instantly.",
                viewMoreUrl = "/en/buildpackage"
            },
            _ => new
            {
                title = "Explore World-Class Travel Services",
                subtitle = "Book hotels, tours, transfers, flights, and visas with guaranteed lowest rates.",
                badge = "TRAVEL SUITE",
                searchModule = "HOTEL",
                citySectionTitle = "Top Cities",
                collectionTitle = "Curated Travel Collections",
                collectionSubtitle = "Best travel offerings across the globe.",
                viewMoreUrl = "/en/hotels"
            }
        };
    }

    private List<JsonObject> FetchCategoriesForModule(string siteName, string module)
    {
        var results = new List<JsonObject>();

        var rawCategories = LoadSeedJson(siteName, "categories.json");
        foreach (var cat in rawCategories)
        {
            var catModule = cat?["module"]?.ToString()?.ToLowerInvariant();
            if (string.Equals(catModule, module, StringComparison.OrdinalIgnoreCase) ||
                (module == "tours" && (catModule == "activities" || catModule == "tours")) ||
                (module == "packages" && (catModule == "packages" || catModule == "holidays")))
            {
                var nameObj = cat?["name"];
                var title = nameObj?["en"]?.ToString() ?? cat?["title"]?.ToString() ?? cat?["slug"]?.ToString() ?? "Category";
                results.Add(new JsonObject
                {
                    ["slug"] = cat?["slug"]?.ToString() ?? "",
                    ["name"] = title,
                    ["title"] = title,
                    ["icon"] = cat?["icon"]?.ToString() ?? "grid-outline",
                    ["order"] = AsInt(cat?["order"], 0),
                    ["module"] = module
                });
            }
        }

        if (results.Count == 0)
        {
            var defaults = module switch
            {
                "transfers" => new[]
                {
                    ("airport-pickup", "Airport Pickup", "airplane-outline"),
                    ("private-sedan", "Private Sedan", "car-outline"),
                    ("family-suv", "Family SUV / Van", "car-sport-outline"),
                    ("intercity", "Intercity Chauffeur", "navigate-outline"),
                    ("luxury-limo", "Luxury Limousine", "sparkles-outline"),
                    ("hourly", "Hourly Rental", "time-outline")
                },
                "visas" => new[]
                {
                    ("tourist-30", "Tourist Visa (30 Days)", "card-outline"),
                    ("tourist-60", "Tourist Visa (60 Days)", "document-text-outline"),
                    ("express-24h", "Express 24h Visa", "flash-outline"),
                    ("multiple-entry", "Multiple Entry Visa", "repeat-outline"),
                    ("transit", "Transit Visa", "swap-horizontal-outline"),
                    ("business-visa", "Business Visa", "briefcase-outline")
                },
                "flights" => new[]
                {
                    ("direct", "Direct Flights", "airplane-outline"),
                    ("international", "International Airlines", "globe-outline"),
                    ("domestic", "Domestic Routes", "map-outline"),
                    ("family", "Family Fares", "people-outline"),
                    ("business-class", "Business Class", "briefcase-outline"),
                    ("low-fare", "Low Airfare Deals", "pricetag-outline")
                },
                "restaurants" => new[]
                {
                    ("pure-veg", "100% Pure Veg", "leaf-outline"),
                    ("gujarati-thali", "Gujarati Thali", "restaurant-outline"),
                    ("jain-friendly", "Jain Friendly Dining", "nutrition-outline"),
                    ("buffet", "Dinner Buffets", "fast-food-outline"),
                    ("rooftop", "Rooftop Lounges", "wine-outline"),
                    ("fine-dining", "Fine Dining", "sparkles-outline")
                },
                _ => new[]
                {
                    ("all", "All Selections", "grid-outline"),
                    ("popular", "Popular Picks", "star-outline"),
                    ("recommended", "Recommended", "thumbs-up-outline")
                }
            };

            var ord = 1;
            foreach (var d in defaults)
            {
                results.Add(new JsonObject
                {
                    ["slug"] = d.Item1,
                    ["name"] = d.Item2,
                    ["title"] = d.Item2,
                    ["icon"] = d.Item3,
                    ["order"] = ord++,
                    ["module"] = module
                });
            }
        }

        return results.Take(10).ToList();
    }

    private static string ExtractCity(JsonNode? node)
    {
        if (node == null) return "Dubai";
        var cityVal = node["city"]?.ToString();
        if (!string.IsNullOrWhiteSpace(cityVal)) return cityVal;

        var dest = node["destination"];
        if (dest is JsonObject destObj)
        {
            var c = destObj["cityName"]?.ToString() ?? destObj["city"]?.ToString() ?? destObj["name"]?.ToString();
            if (!string.IsNullOrWhiteSpace(c)) return c;
        }
        else if (dest is JsonValue)
        {
            var s = dest.ToString();
            if (!string.IsNullOrWhiteSpace(s)) return s;
        }

        var toAirport = node["toAirport"];
        if (toAirport is JsonObject tObj)
        {
            var c = tObj["city"]?.ToString();
            if (!string.IsNullOrWhiteSpace(c)) return c;
        }

        var fromAirport = node["fromAirport"];
        if (fromAirport is JsonObject fObj)
        {
            var c = fObj["city"]?.ToString();
            if (!string.IsNullOrWhiteSpace(c)) return c;
        }

        return "Dubai";
    }

    private static string ExtractCountry(JsonNode? node)
    {
        if (node == null) return "United Arab Emirates";
        var countryVal = node["country"]?.ToString();
        if (!string.IsNullOrWhiteSpace(countryVal)) return countryVal;

        var dest = node["destination"];
        if (dest is JsonObject destObj)
        {
            var c = destObj["country"]?.ToString();
            if (!string.IsNullOrWhiteSpace(c)) return c;
        }

        var toAirport = node["toAirport"];
        if (toAirport is JsonObject tObj)
        {
            var c = tObj["country"]?.ToString();
            if (!string.IsNullOrWhiteSpace(c)) return c;
        }

        var city = ExtractCity(node);
        if (city.Equals("Dubai", StringComparison.OrdinalIgnoreCase) || city.Equals("Abu Dhabi", StringComparison.OrdinalIgnoreCase))
            return "United Arab Emirates";
        if (city.Equals("Singapore", StringComparison.OrdinalIgnoreCase))
            return "Singapore";
        if (city.Equals("Bangkok", StringComparison.OrdinalIgnoreCase) || city.Equals("Phuket", StringComparison.OrdinalIgnoreCase))
            return "Thailand";
        if (city.Equals("London", StringComparison.OrdinalIgnoreCase))
            return "United Kingdom";

        return "India";
    }

    private List<JsonObject> FetchFeaturedForModule(string siteName, string module, int limit = 6)
    {
        var items = new List<JsonObject>();
        var isGujju = siteName.Equals("gujjutours", StringComparison.OrdinalIgnoreCase) || siteName.Equals("website1", StringComparison.OrdinalIgnoreCase);
        var siteCurrency = isGujju ? "INR" : siteName.Equals("technoheaven", StringComparison.OrdinalIgnoreCase) ? "AED" : "USD";

        switch (module)
        {
            case "hotels":
            {
                var hotelsJson = LoadSeedJson(siteName, "hotels.json");
                var idx = 0;
                foreach (var h in hotelsJson.Take(limit))
                {
                    var slug = h?["slug"]?.ToString() ?? h?["id"]?.ToString() ?? "hotel";
                    var cityName = ExtractCity(h);
                    var countryName = ExtractCountry(h);
                    var images = h?["images"]?.AsArray();
                    var rawImg = images?.Count > 0 ? images[0]?.ToString() : null;
                    var actualImg = ResolveActualPhoto(rawImg, "hotels", idx++);

                    items.Add(new JsonObject
                    {
                        ["id"] = h?["id"]?.ToString() ?? slug,
                        ["slug"] = slug,
                        ["title"] = h?["title"]?.ToString() ?? "Luxury Hotel",
                        ["city"] = cityName,
                        ["country"] = countryName,
                        ["price"] = AsDouble(h?["pricePerNight"], 6500),
                        ["originalPrice"] = AsDouble(h?["compareAtPrice"], 8500),
                        ["rating"] = AsDouble(h?["rating"], 4.8),
                        ["reviewCount"] = AsInt(h?["reviewCount"], 320),
                        ["starRating"] = AsInt(h?["starRating"], 5),
                        ["imageUrl"] = actualImg,
                        ["propertyType"] = h?["propertyType"]?.ToString() ?? "Hotel",
                        ["badge"] = "Best Seller",
                        ["detailUrl"] = $"/en/hotels/{cityName.ToLowerInvariant().Replace(" ", "-")}/{slug}",
                        ["features"] = new JsonArray { "Free Wifi", "Pure Veg Option", "Swimming Pool", "Breakfast Included" }
                    });
                }
                break;
            }

            case "tours":
            {
                var actJson = LoadSeedJson(siteName, "activities.json");
                var idx = 0;
                foreach (var t in actJson.Take(limit))
                {
                    var slug = t?["slug"]?.ToString() ?? t?["id"]?.ToString() ?? "tour";
                    var cityName = ExtractCity(t);
                    var countryName = ExtractCountry(t);
                    var images = t?["images"]?.AsArray();
                    var rawImg = images?.Count > 0 ? images[0]?.ToString() : t?["image"]?.ToString();
                    var actualImg = ResolveActualPhoto(rawImg, "tours", idx++);
                    var price = AsDouble(t?["price"], 3200);

                    items.Add(new JsonObject
                    {
                        ["id"] = t?["id"]?.ToString() ?? slug,
                        ["slug"] = slug,
                        ["title"] = t?["title"]?.ToString() ?? "Desert Safari & City Tour",
                        ["city"] = cityName,
                        ["country"] = countryName,
                        ["price"] = price,
                        ["originalPrice"] = Math.Round(price * 1.25),
                        ["rating"] = AsDouble(t?["rating"], 4.9),
                        ["reviewCount"] = AsInt(t?["reviewCount"], 450),
                        ["imageUrl"] = actualImg,
                        ["duration"] = t?["duration"]?.ToString() ?? "6 Hours",
                        ["badge"] = "Top Attraction",
                        ["detailUrl"] = $"/en/tours/{slug}",
                        ["features"] = new JsonArray { "Hotel Pickup", "Guided Tour", "Jain Meal Available", "Instant Confirmation" }
                    });
                }
                break;
            }

            case "packages":
            {
                var pkgJson = LoadSeedJson(siteName, "packages.json");
                var idx = 0;
                foreach (var p in pkgJson.Take(limit))
                {
                    var slug = p?["slug"]?.ToString() ?? p?["id"]?.ToString() ?? "package";
                    var cityName = ExtractCity(p);
                    var countryName = ExtractCountry(p);
                    var images = p?["images"]?.AsArray();
                    var rawImg = images?.Count > 0 ? images[0]?.ToString() : p?["image"]?.ToString();
                    var actualImg = ResolveActualPhoto(rawImg, "packages", idx++);
                    var price = AsDouble(p?["price"], AsDouble(p?["startingPrice"], 35000));

                    items.Add(new JsonObject
                    {
                        ["id"] = p?["id"]?.ToString() ?? slug,
                        ["slug"] = slug,
                        ["title"] = p?["title"]?.ToString() ?? "Exotic Holiday Package",
                        ["city"] = cityName,
                        ["country"] = countryName,
                        ["duration"] = p?["duration"]?.ToString() ?? "5 Days / 4 Nights",
                        ["price"] = price,
                        ["originalPrice"] = Math.Round(price * 1.2),
                        ["rating"] = AsDouble(p?["rating"], 4.8),
                        ["reviewCount"] = 210,
                        ["imageUrl"] = actualImg,
                        ["badge"] = "All Inclusive",
                        ["detailUrl"] = $"/en/holidays/{slug}",
                        ["features"] = new JsonArray { "Flights Included", "4-Star Hotel", "Daily Gujarati Meals", "Visa Support" }
                    });
                }
                break;
            }

            case "flights":
            {
                var fltJson = LoadSeedJson(siteName, "flights.json");
                var idx = 0;
                foreach (var f in fltJson.Take(limit))
                {
                    var slug = f?["slug"]?.ToString() ?? f?["id"]?.ToString() ?? "flight";
                    var fromCity = f?["fromAirport"]?["city"]?.ToString() ?? f?["from"]?.ToString() ?? "Delhi";
                    var toCity = f?["toAirport"]?["city"]?.ToString() ?? f?["to"]?.ToString() ?? "Mumbai";
                    var toCountry = f?["toAirport"]?["country"]?.ToString() ?? "India";
                    var airline = f?["airline"]?.ToString() ?? "AeroBharat Express";
                    var flightNum = f?["flightNumber"]?.ToString() ?? "AB-101";
                    var duration = f?["duration"]?.ToString() ?? "2h 15m";
                    var actualImg = ResolveActualPhoto(null, "flights", idx++);

                    items.Add(new JsonObject
                    {
                        ["id"] = f?["id"]?.ToString() ?? slug,
                        ["slug"] = slug,
                        ["title"] = $"{airline} {flightNum}: {fromCity} → {toCity}",
                        ["city"] = toCity,
                        ["country"] = toCountry,
                        ["airline"] = airline,
                        ["flightNumber"] = flightNum,
                        ["duration"] = duration,
                        ["price"] = AsDouble(f?["price"], 3880),
                        ["originalPrice"] = AsDouble(f?["originalPrice"], 4600),
                        ["rating"] = AsDouble(f?["rating"], 4.7),
                        ["reviewCount"] = AsInt(f?["reviews"], 180),
                        ["imageUrl"] = actualImg,
                        ["badge"] = "Direct Flight",
                        ["detailUrl"] = $"/en/flights/{slug}",
                        ["features"] = new JsonArray { "Pure Veg Meal", "15kg Check-in", "Free Cancellation", "Instant Confirmation" }
                    });
                }
                break;
            }

            case "transfers":
            {
                var trfJson = LoadSeedJson(siteName, "transfers.json");
                var idx = 0;
                var seenCities = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var selectedTransfers = new List<JsonNode>();
                foreach (var tr in trfJson)
                {
                    if (tr == null) continue;
                    var c = tr["city"]?.ToString() ?? "Dubai";
                    if (!seenCities.Contains(c))
                    {
                        seenCities.Add(c);
                        selectedTransfers.Add(tr);
                        if (selectedTransfers.Count >= limit) break;
                    }
                }
                if (selectedTransfers.Count < limit)
                {
                    foreach (var tr in trfJson)
                    {
                        if (tr != null && !selectedTransfers.Contains(tr))
                        {
                            selectedTransfers.Add(tr);
                            if (selectedTransfers.Count >= limit) break;
                        }
                    }
                }

                foreach (var tr in selectedTransfers.Take(limit))
                {
                    var slug = tr?["slug"]?.ToString() ?? tr?["id"]?.ToString() ?? "transfer";
                    var vehicleLabel = tr?["vehicleLabel"]?.ToString() ?? tr?["vehicleType"]?.ToString() ?? "Executive Sedan";
                    var city = tr?["city"]?.ToString() ?? "Goa";
                    var country = tr?["country"]?.ToString() ?? "India";
                    var title = tr?["title"]?.ToString() ?? $"{city}: {vehicleLabel} Transfer";
                    var actualImg = ResolveActualPhoto(null, "transfers", idx++);

                    items.Add(new JsonObject
                    {
                        ["id"] = tr?["id"]?.ToString() ?? slug,
                        ["slug"] = slug,
                        ["title"] = title,
                        ["city"] = city,
                        ["country"] = country,
                        ["price"] = AsDouble(tr?["price"], 2180),
                        ["originalPrice"] = AsDouble(tr?["originalPrice"], 2600),
                        ["rating"] = AsDouble(tr?["rating"], 4.9),
                        ["reviewCount"] = AsInt(tr?["reviews"], 95),
                        ["imageUrl"] = actualImg,
                        ["badge"] = "Private Transfer",
                        ["detailUrl"] = $"/en/transfers/{slug}",
                        ["features"] = new JsonArray { "Meet & Greet", "Flight Tracking", "AC Vehicle", "Free Waiting Time" }
                    });
                }
                break;
            }

            case "visas":
            {
                var visaJson = LoadSeedJson(siteName, "visas.json");
                var idx = 0;
                var seenCountries = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var selectedVisas = new List<JsonNode>();
                foreach (var v in visaJson)
                {
                    if (v == null) continue;
                    var c = v["country"]?.ToString() ?? "United Arab Emirates";
                    if (!seenCountries.Contains(c))
                    {
                        seenCountries.Add(c);
                        selectedVisas.Add(v);
                        if (selectedVisas.Count >= limit) break;
                    }
                }
                if (selectedVisas.Count < limit)
                {
                    foreach (var v in visaJson)
                    {
                        if (v != null && !selectedVisas.Contains(v))
                        {
                            selectedVisas.Add(v);
                            if (selectedVisas.Count >= limit) break;
                        }
                    }
                }

                foreach (var v in selectedVisas.Take(limit))
                {
                    var slug = v?["slug"]?.ToString() ?? v?["id"]?.ToString() ?? "visa";
                    var country = v?["country"]?.ToString() ?? "United Arab Emirates";
                    var title = v?["title"]?.ToString() ?? $"{country} Tourist eVisa";
                    var actualImg = ResolveActualPhoto(null, "visas", idx++);

                    items.Add(new JsonObject
                    {
                        ["id"] = v?["id"]?.ToString() ?? slug,
                        ["slug"] = slug,
                        ["title"] = title,
                        ["city"] = country,
                        ["country"] = country,
                        ["price"] = AsDouble(v?["price"], 6730),
                        ["originalPrice"] = AsDouble(v?["originalPrice"], 8650),
                        ["rating"] = AsDouble(v?["rating"], 4.9),
                        ["reviewCount"] = AsInt(v?["reviews"], 420),
                        ["imageUrl"] = actualImg,
                        ["badge"] = "Fast Approval",
                        ["detailUrl"] = $"/en/visas/{slug}",
                        ["features"] = new JsonArray { "24-48h Processing", "No Embassy Visit", "Document Verification", "Express Service" }
                    });
                }
                break;
            }

            case "restaurants":
            {
                var restJson = LoadSeedJson(siteName, "restaurants.json");
                var idx = 0;
                var seenCities = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var selectedRests = new List<JsonNode>();
                foreach (var r in restJson)
                {
                    if (r == null) continue;
                    var c = r["city"]?.ToString() ?? "Jaipur";
                    if (!seenCities.Contains(c))
                    {
                        seenCities.Add(c);
                        selectedRests.Add(r);
                        if (selectedRests.Count >= limit) break;
                    }
                }
                if (selectedRests.Count < limit)
                {
                    foreach (var r in restJson)
                    {
                        if (r != null && !selectedRests.Contains(r))
                        {
                            selectedRests.Add(r);
                            if (selectedRests.Count >= limit) break;
                        }
                    }
                }

                foreach (var r in selectedRests.Take(limit))
                {
                    var slug = r?["slug"]?.ToString() ?? r?["id"]?.ToString() ?? "restaurant";
                    var city = r?["city"]?.ToString() ?? "Jaipur";
                    var country = r?["country"]?.ToString() ?? "India";
                    var cuisine = r?["cuisineLabel"]?.ToString() ?? r?["cuisine"]?.ToString() ?? "Indian Cuisine";
                    var title = r?["title"]?.ToString() ?? r?["name"]?.ToString() ?? "Saffron Clay Tandoor";
                    var cost = AsDouble(r?["costForTwo"], AsDouble(r?["averageCost"], 1710));
                    var rawImg = r?["image"]?.ToString() ?? r?["imageUrl"]?.ToString();
                    var actualImg = ResolveActualPhoto(rawImg, "restaurants", idx++);
                    var itemCurr = r?["currency"]?.ToString();
                    if (string.IsNullOrWhiteSpace(itemCurr)) itemCurr = siteCurrency;

                    items.Add(new JsonObject
                    {
                        ["id"] = r?["id"]?.ToString() ?? slug,
                        ["slug"] = slug,
                        ["title"] = title,
                        ["city"] = city,
                        ["country"] = country,
                        ["cuisine"] = cuisine,
                        ["price"] = cost,
                        ["costForTwo"] = cost,
                        ["currency"] = itemCurr,
                        ["originalPrice"] = Math.Round(cost * 1.25),
                        ["rating"] = AsDouble(r?["rating"], 4.8),
                        ["reviewCount"] = AsInt(r?["reviews"], AsInt(r?["reviewCount"], 120)),
                        ["imageUrl"] = actualImg,
                        ["badge"] = r?["isPureVeg"]?.GetValue<bool>() == true ? "100% Pure Veg" : "Jain Friendly",
                        ["detailUrl"] = $"/en/restaurants/{slug}",
                        ["features"] = new JsonArray { "Pure Veg Options", "Jain Meals Available", "Family Seating", "AC Dining" }
                    });
                }
                break;
            }

            case "buildpackage":
            {
                var bldJson = LoadSeedJson(siteName, "build-package-options.json");
                var idx = 0;
                foreach (var b in bldJson.Take(limit))
                {
                    var slug = b?["destinationSlug"]?.ToString() ?? b?["slug"]?.ToString() ?? b?["id"]?.ToString() ?? "custom";
                    var dest = b?["destinationName"]?.ToString() ?? b?["title"]?.ToString() ?? "Dubai & Abu Dhabi";
                    var country = b?["country"]?.ToString() ?? "United Arab Emirates";
                    var startPrice = AsDouble(b?["startingPrice"], AsDouble(b?["basePrice"], 42000));
                    var actualImg = ResolveActualPhoto(null, "buildpackage", idx++);

                    items.Add(new JsonObject
                    {
                        ["id"] = b?["id"]?.ToString() ?? slug,
                        ["slug"] = slug,
                        ["title"] = $"Custom {dest} Vacation Plan",
                        ["city"] = dest,
                        ["country"] = country,
                        ["price"] = startPrice,
                        ["originalPrice"] = Math.Round(startPrice * 1.2),
                        ["rating"] = AsDouble(b?["rating"], 4.9),
                        ["reviewCount"] = AsInt(b?["reviews"], 411),
                        ["imageUrl"] = actualImg,
                        ["badge"] = b?["badge"]?.ToString() ?? "Customizable",
                        ["detailUrl"] = "/en/buildpackage",
                        ["features"] = new JsonArray { "Pick Your Hotels", "Choose Tours", "Add Private Cabs", "Instant Cost Calculator" }
                    });
                }
                break;
            }
        }

        foreach (var itm in items)
        {
            if (itm != null)
            {
                if (!itm.ContainsKey("currency") || string.IsNullOrWhiteSpace(itm["currency"]?.ToString()))
                {
                    itm["currency"] = siteCurrency;
                }
                if (module == "restaurants" && !itm.ContainsKey("costForTwo") && itm.ContainsKey("price"))
                {
                    itm["costForTwo"] = AsDouble(itm["price"], 1710);
                }
            }
        }

        if (items.Count == 0)
        {
            items = GenerateFallbackFeaturedForModule(siteName, module, limit);
        }

        return items;
    }

    private List<JsonObject> GenerateFallbackPackages(string siteName, string module)
    {
        return GenerateFallbackFeaturedForModule(siteName, "packages", 6);
    }

    private List<JsonObject> GenerateFallbackFeaturedForModule(string siteName, string module, int limit = 6)
    {
        var list = new List<JsonObject>();

        switch (module)
        {
            case "hotels":
                list.Add(new JsonObject
                {
                    ["id"] = "h-burj-al-arab",
                    ["slug"] = "burj-al-arab-jumeirah-dubai",
                    ["title"] = "Burj Al Arab Jumeirah",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 68500,
                    ["originalPrice"] = 82000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1250,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[0],
                    ["propertyType"] = "Ultra Luxury Resort",
                    ["badge"] = "7-Star Luxury",
                    ["detailUrl"] = "/en/hotels/dubai/burj-al-arab-jumeirah-dubai",
                    ["features"] = new JsonArray { "Private Beach", "Butler Service", "Pure Veg & Jain Meals", "Helipad Transfers" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-atlantis-palm",
                    ["slug"] = "atlantis-the-palm-dubai",
                    ["title"] = "Atlantis The Palm Resort & Waterpark",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 42000,
                    ["originalPrice"] = 51000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 2400,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[1],
                    ["propertyType"] = "Beach Resort",
                    ["badge"] = "Aquaventure Access",
                    ["detailUrl"] = "/en/hotels/dubai/atlantis-the-palm-dubai",
                    ["features"] = new JsonArray { "Free Waterpark Entry", "Private Beach", "Jain Food Counter", "Kids Club" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-marina-bay-sands",
                    ["slug"] = "marina-bay-sands-singapore",
                    ["title"] = "Marina Bay Sands Hotel",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["price"] = 39500,
                    ["originalPrice"] = 46000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 3100,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[2],
                    ["propertyType"] = "City Center Luxury",
                    ["badge"] = "Infinity Pool",
                    ["detailUrl"] = "/en/hotels/singapore/marina-bay-sands-singapore",
                    ["features"] = new JsonArray { "Rooftop Infinity Pool", "SkyPark Observation Deck", "Luxury Mall Access", "Subway Station" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-oberoi-amarvilas",
                    ["slug"] = "the-oberoi-amarvilas-agra",
                    ["title"] = "The Oberoi Amarvilas",
                    ["city"] = "Agra",
                    ["country"] = "India",
                    ["price"] = 29800,
                    ["originalPrice"] = 36000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 880,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[3],
                    ["propertyType"] = "Heritage Palace",
                    ["badge"] = "Taj Mahal View",
                    ["detailUrl"] = "/en/hotels/agra/the-oberoi-amarvilas-agra",
                    ["features"] = new JsonArray { "Unobstructed Taj Views", "Royal Mughal Spa", "Pure Veg Gourmet", "Private Buggy" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-w-bali-seminyak",
                    ["slug"] = "w-bali-seminyak-resort",
                    ["title"] = "W Bali - Seminyak Beachfront Resort",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["price"] = 34200,
                    ["originalPrice"] = 41000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 1420,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[4],
                    ["propertyType"] = "Tropical Beach Villa",
                    ["badge"] = "Private Pool",
                    ["detailUrl"] = "/en/hotels/bali/w-bali-seminyak-resort",
                    ["features"] = new JsonArray { "Sunset Beach Bar", "Private Plunge Pool", "24/7 Concierge", "Vegetarian Kitchen" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-taj-mahal-mumbai",
                    ["slug"] = "the-taj-mahal-palace-mumbai",
                    ["title"] = "The Taj Mahal Palace",
                    ["city"] = "Mumbai",
                    ["country"] = "India",
                    ["price"] = 26500,
                    ["originalPrice"] = 32000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1950,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[5],
                    ["propertyType"] = "Heritage Luxury Hotel",
                    ["badge"] = "Gateway View",
                    ["detailUrl"] = "/en/hotels/mumbai/the-taj-mahal-palace-mumbai",
                    ["features"] = new JsonArray { "Harbour Views", "Sea Lounge High Tea", "Jain Food Friendly", "Historic Elegance" }
                });
                break;

            case "tours":
                list.Add(new JsonObject
                {
                    ["id"] = "t-desert-safari",
                    ["slug"] = "dubai-red-dune-desert-safari-bbq",
                    ["title"] = "Red Dune Desert Safari & BBQ Dinner",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 3200,
                    ["originalPrice"] = 4200,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 2840,
                    ["imageUrl"] = TourPhotos[0],
                    ["duration"] = "6 Hours",
                    ["badge"] = "Best Seller",
                    ["detailUrl"] = "/en/tours/dubai-red-dune-desert-safari-bbq",
                    ["features"] = new JsonArray { "4x4 Land Cruiser", "Dune Bashing", "Pure Veg & Jain BBQ", "Tanoura & Fire Show" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-burj-khalifa",
                    ["slug"] = "burj-khalifa-at-the-top-tickets",
                    ["title"] = "Burj Khalifa At the Top (124th & 125th Floor)",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 4150,
                    ["originalPrice"] = 4900,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 3520,
                    ["imageUrl"] = TourPhotos[1],
                    ["duration"] = "2 Hours",
                    ["badge"] = "Must Visit",
                    ["detailUrl"] = "/en/tours/burj-khalifa-at-the-top-tickets",
                    ["features"] = new JsonArray { "Fast-Track Elevator", "Panoramic 360° View", "Outdoor Terrace", "Digital Souvenir Photo" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-bali-waterfalls",
                    ["slug"] = "bali-ubud-waterfalls-rice-terraces",
                    ["title"] = "Bali Ubud Waterfalls & Tegalalang Rice Terraces",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["price"] = 2850,
                    ["originalPrice"] = 3600,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 980,
                    ["imageUrl"] = TourPhotos[2],
                    ["duration"] = "8 Hours",
                    ["badge"] = "Top Experience",
                    ["detailUrl"] = "/en/tours/bali-ubud-waterfalls-rice-terraces",
                    ["features"] = new JsonArray { "Private Chauffeur", "Jungle Swing", "Sacred Monkey Forest", "Coffee Plantation" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-singapore-safari",
                    ["slug"] = "singapore-night-safari-tram-tour",
                    ["title"] = "Singapore Night Safari & Guided Tram Adventure",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["price"] = 3600,
                    ["originalPrice"] = 4400,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 1640,
                    ["imageUrl"] = TourPhotos[3],
                    ["duration"] = "4 Hours",
                    ["badge"] = "Family Favorite",
                    ["detailUrl"] = "/en/tours/singapore-night-safari-tram-tour",
                    ["features"] = new JsonArray { "Night Tram Ride", "Creatures of the Night Show", "Walking Trail Access", "Hotel Transfer Available" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-statue-of-unity",
                    ["slug"] = "statue-of-unity-guided-day-tour",
                    ["title"] = "Statue of Unity & Valley of Flowers Guided Tour",
                    ["city"] = "Kevadia",
                    ["country"] = "India",
                    ["price"] = 2450,
                    ["originalPrice"] = 3100,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1120,
                    ["imageUrl"] = TourPhotos[4],
                    ["duration"] = "Full Day",
                    ["badge"] = "World's Tallest",
                    ["detailUrl"] = "/en/tours/statue-of-unity-guided-day-tour",
                    ["features"] = new JsonArray { "Viewing Gallery Ticket", "Laser Light Show", "Gujarati Thali Lunch", "AC Bus Tour" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-bangkok-palace",
                    ["slug"] = "bangkok-grand-palace-floating-market",
                    ["title"] = "Bangkok Grand Palace & Floating Market Expedition",
                    ["city"] = "Bangkok",
                    ["country"] = "Thailand",
                    ["price"] = 3100,
                    ["originalPrice"] = 3900,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 870,
                    ["imageUrl"] = TourPhotos[5],
                    ["duration"] = "7 Hours",
                    ["badge"] = "Cultural Tour",
                    ["detailUrl"] = "/en/tours/bangkok-grand-palace-floating-market",
                    ["features"] = new JsonArray { "Temple of Emerald Buddha", "Longtail Boat Ride", "Indian Lunch Option", "English Speaking Guide" }
                });
                break;

            case "packages":
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-dubai-5d4n",
                    ["slug"] = "dubai-5d4n-grand-vacation-package",
                    ["title"] = "5D/4N Dubai Grand Vacation Package",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 48500,
                    ["originalPrice"] = 58000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 620,
                    ["imageUrl"] = PackagePhotos[0],
                    ["duration"] = "5 Days / 4 Nights",
                    ["days"] = 5,
                    ["nights"] = 4,
                    ["badge"] = "All Inclusive",
                    ["detailUrl"] = "/en/holidays/dubai-5d4n-grand-vacation-package",
                    ["features"] = new JsonArray { "4-Star Hotel Stay", "Desert Safari & Cruise", "Daily Jain & Veg Breakfast", "Private Airport Transfers" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-bali-6d5n",
                    ["slug"] = "bali-6d5n-tropical-pool-villa-escape",
                    ["title"] = "6D/5N Bali Tropical Pool Villa Holiday",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["price"] = 52000,
                    ["originalPrice"] = 62500,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 480,
                    ["imageUrl"] = PackagePhotos[1],
                    ["duration"] = "6 Days / 5 Nights",
                    ["days"] = 6,
                    ["nights"] = 5,
                    ["badge"] = "Honeymoon Special",
                    ["detailUrl"] = "/en/holidays/bali-6d5n-tropical-pool-villa-escape",
                    ["features"] = new JsonArray { "Private Pool Villa", "Floating Breakfast", "Nusa Penida Speedboat", "Full Sightseeing Cabs" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-rajasthan-4d3n",
                    ["slug"] = "royal-rajasthan-4d3n-heritage-tour",
                    ["title"] = "4D/3N Royal Rajasthan Heritage Tour",
                    ["city"] = "Jaipur & Udaipur",
                    ["country"] = "India",
                    ["price"] = 28900,
                    ["originalPrice"] = 35000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 730,
                    ["imageUrl"] = PackagePhotos[2],
                    ["duration"] = "4 Days / 3 Nights",
                    ["days"] = 4,
                    ["nights"] = 3,
                    ["badge"] = "Heritage Plan",
                    ["detailUrl"] = "/en/holidays/royal-rajasthan-4d3n-heritage-tour",
                    ["features"] = new JsonArray { "Palace Hotels", "Private Chauffeur Sedan", "Amer Fort Elephant/Jeep", "Kathiyawadi & Jain Dining" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-singapore-5d4n",
                    ["slug"] = "singapore-malaysia-duo-6d5n",
                    ["title"] = "6D/5N Singapore & Kuala Lumpur Twin Explorer",
                    ["city"] = "Singapore & Kuala Lumpur",
                    ["country"] = "Singapore & Malaysia",
                    ["price"] = 58900,
                    ["originalPrice"] = 71000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 390,
                    ["imageUrl"] = PackagePhotos[3],
                    ["duration"] = "6 Days / 5 Nights",
                    ["days"] = 6,
                    ["nights"] = 5,
                    ["badge"] = "Twin Country",
                    ["detailUrl"] = "/en/holidays/singapore-malaysia-duo-6d5n",
                    ["features"] = new JsonArray { "Universal Studios Pass", "Genting Cable Car", "Cross-Border Coach", "Indian Veg Meals" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-kashmir-7d6n",
                    ["slug"] = "kashmir-paradise-valley-7d6n",
                    ["title"] = "7D/6N Kashmir Paradise Valley with Dal Lake",
                    ["city"] = "Srinagar & Gulmarg",
                    ["country"] = "India",
                    ["price"] = 36500,
                    ["originalPrice"] = 44000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 850,
                    ["imageUrl"] = PackagePhotos[4],
                    ["duration"] = "7 Days / 6 Nights",
                    ["days"] = 7,
                    ["nights"] = 6,
                    ["badge"] = "Deluxe Houseboat",
                    ["detailUrl"] = "/en/holidays/kashmir-paradise-valley-7d6n",
                    ["features"] = new JsonArray { "Shikara Ride", "Gulmarg Gondola Phase 1", "Pahalgam Valley Tour", "Jain Meals Guaranteed" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-thailand-5d4n",
                    ["slug"] = "thailand-highlights-5d4n-bangkok-pattaya",
                    ["title"] = "5D/4N Thailand Highlights: Bangkok & Coral Island",
                    ["city"] = "Bangkok & Pattaya",
                    ["country"] = "Thailand",
                    ["price"] = 39800,
                    ["originalPrice"] = 48000,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 540,
                    ["imageUrl"] = PackagePhotos[5],
                    ["duration"] = "5 Days / 4 Nights",
                    ["days"] = 5,
                    ["nights"] = 4,
                    ["badge"] = "Beach & City",
                    ["detailUrl"] = "/en/holidays/thailand-highlights-5d4n-bangkok-pattaya",
                    ["features"] = new JsonArray { "Speedboat Coral Island", "Alcazar Show VIP", "Bangkok City Temple Tour", "Private Cabs" }
                });
                break;

            case "flights":
                list.Add(new JsonObject
                {
                    ["id"] = "flt-stv-dxb-6e204",
                    ["slug"] = "stv-dxb-indigo-6e204",
                    ["title"] = "IndiGo 6E-204: STV → DXB",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["airline"] = "IndiGo",
                    ["flightNumber"] = "6E-204",
                    ["duration"] = "3h 45m",
                    ["price"] = 12850,
                    ["originalPrice"] = 15200,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 840,
                    ["imageUrl"] = TourPhotos[2],
                    ["badge"] = "Direct Flight",
                    ["detailUrl"] = "/en/flights/stv-dxb-indigo-6e204",
                    ["features"] = new JsonArray { "Direct Route", "Surat Departure", "Jain Meal Option", "Cabin + Check-in Baggage" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "flt-bom-dxb-ai995",
                    ["slug"] = "bom-dxb-airindia-ai995",
                    ["title"] = "Air India AI-995: BOM → DXB",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["airline"] = "Air India",
                    ["flightNumber"] = "AI-995",
                    ["duration"] = "3h 20m",
                    ["price"] = 14200,
                    ["originalPrice"] = 17500,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 1210,
                    ["imageUrl"] = TourPhotos[1],
                    ["badge"] = "Complimentary Meal",
                    ["detailUrl"] = "/en/flights/bom-dxb-airindia-ai995",
                    ["features"] = new JsonArray { "Non-Stop", "25kg Baggage", "Complimentary Hot Meal", "Free Seat Selection" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "flt-del-sin-sq403",
                    ["slug"] = "del-sin-singaporeair-sq403",
                    ["title"] = "Singapore Airlines SQ-403: DEL → SIN",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["airline"] = "Singapore Airlines",
                    ["flightNumber"] = "SQ-403",
                    ["duration"] = "5h 30m",
                    ["price"] = 22400,
                    ["originalPrice"] = 26500,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 980,
                    ["imageUrl"] = TourPhotos[3],
                    ["badge"] = "5-Star Experience",
                    ["detailUrl"] = "/en/flights/del-sin-singaporeair-sq403",
                    ["features"] = new JsonArray { "In-flight Entertainment", "Gourmet Dining", "30kg Check-in", "Top Global Airline" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "flt-amd-bkk-sg15",
                    ["slug"] = "amd-bkk-spicejet-sg15",
                    ["title"] = "SpiceJet SG-15: AMD → BKK",
                    ["city"] = "Bangkok",
                    ["country"] = "Thailand",
                    ["airline"] = "SpiceJet",
                    ["flightNumber"] = "SG-15",
                    ["duration"] = "4h 10m",
                    ["price"] = 15600,
                    ["originalPrice"] = 18800,
                    ["rating"] = 4.6,
                    ["reviewCount"] = 490,
                    ["imageUrl"] = TourPhotos[5],
                    ["badge"] = "Non-Stop Route",
                    ["detailUrl"] = "/en/flights/amd-bkk-spicejet-sg15",
                    ["features"] = new JsonArray { "Ahmedabad Departure", "Direct Route", "Vegetarian Sandwich", "Instant E-Ticket" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "flt-bom-lhr-ek501",
                    ["slug"] = "bom-lhr-emirates-ek501",
                    ["title"] = "Emirates EK-501: BOM → LHR",
                    ["city"] = "London",
                    ["country"] = "United Kingdom",
                    ["airline"] = "Emirates",
                    ["flightNumber"] = "EK-501",
                    ["duration"] = "9h 45m",
                    ["price"] = 48900,
                    ["originalPrice"] = 57000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1890,
                    ["imageUrl"] = TourPhotos[4],
                    ["badge"] = "Luxury Flight",
                    ["detailUrl"] = "/en/flights/bom-lhr-emirates-ek501",
                    ["features"] = new JsonArray { "A380 Aircraft", "Onboard Wi-Fi", "Pure Veg & Jain Special", "Spacious Seating" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "flt-del-doh-qr557",
                    ["slug"] = "del-doh-qatar-qr557",
                    ["title"] = "Qatar Airways QR-557: DEL → DOH",
                    ["city"] = "Doha",
                    ["country"] = "Qatar",
                    ["airline"] = "Qatar Airways",
                    ["flightNumber"] = "QR-557",
                    ["duration"] = "4h 00m",
                    ["price"] = 18900,
                    ["originalPrice"] = 22500,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1150,
                    ["imageUrl"] = TourPhotos[0],
                    ["badge"] = "World's Best Airline",
                    ["detailUrl"] = "/en/flights/del-doh-qatar-qr557",
                    ["features"] = new JsonArray { "Direct Flight", "Oryx One Entertainment", "Multi-Course Dining", "25kg Baggage" }
                });
                break;

            case "transfers":
                list.Add(new JsonObject
                {
                    ["id"] = "tr-dxb-downtown-sedan",
                    ["slug"] = "dxb-downtown-executive-sedan",
                    ["title"] = "DXB Airport to Downtown Executive Sedan",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 2400,
                    ["originalPrice"] = 3000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1820,
                    ["vehicleType"] = "Lexus ES / Camry Hybrid",
                    ["capacity"] = "3 Passengers · 2 Bags",
                    ["imageUrl"] = TourPhotos[2],
                    ["badge"] = "Airport Pickup",
                    ["detailUrl"] = "/en/transfers/dxb-downtown-executive-sedan",
                    ["features"] = new JsonArray { "Flight Tracking", "60 Mins Free Waiting", "Meet & Greet Inside", "Toll & Parking Included" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "tr-dxb-palm-suv",
                    ["slug"] = "dxb-palm-family-suv",
                    ["title"] = "DXB Airport to Palm Jumeirah Family SUV",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 3800,
                    ["originalPrice"] = 4600,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 940,
                    ["vehicleType"] = "GMC Yukon / Land Cruiser",
                    ["capacity"] = "6 Passengers · 5 Bags",
                    ["imageUrl"] = TourPhotos[0],
                    ["badge"] = "Family SUV",
                    ["detailUrl"] = "/en/transfers/dxb-palm-family-suv",
                    ["features"] = new JsonArray { "Spacious Luggage Boot", "Child Seat on Request", "Chilled Mineral Water", "Fixed Fare" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "tr-bom-chauffeur-sedan",
                    ["slug"] = "bom-south-mumbai-chauffeur",
                    ["title"] = "Mumbai Airport (BOM) to South Mumbai Sedan",
                    ["city"] = "Mumbai",
                    ["country"] = "India",
                    ["price"] = 2100,
                    ["originalPrice"] = 2600,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 680,
                    ["vehicleType"] = "Swift Dzire / Honda City",
                    ["capacity"] = "4 Passengers · 3 Bags",
                    ["imageUrl"] = TourPhotos[4],
                    ["badge"] = "Fixed Rate",
                    ["detailUrl"] = "/en/transfers/bom-south-mumbai-chauffeur",
                    ["features"] = new JsonArray { "Sea Link Toll Included", "Uniformed Driver", "Sanitized AC Cab", "24/7 Availability" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "tr-dps-ubud-van",
                    ["slug"] = "dps-ubud-private-van",
                    ["title"] = "Bali Airport (DPS) to Ubud Hotel Private Van",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["price"] = 1850,
                    ["originalPrice"] = 2300,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 490,
                    ["vehicleType"] = "Toyota Innova / HiAce",
                    ["capacity"] = "5 Passengers · 4 Bags",
                    ["imageUrl"] = TourPhotos[2],
                    ["badge"] = "Private Van",
                    ["detailUrl"] = "/en/transfers/dps-ubud-private-van",
                    ["features"] = new JsonArray { "English Speaking Driver", "Arrival Name Board", "Fuel & Toll Included", "Scenic Route" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "tr-sin-marina-limo",
                    ["slug"] = "sin-marina-bay-limo",
                    ["title"] = "Changi Airport (SIN) to Marina Bay VIP Transfer",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["price"] = 2600,
                    ["originalPrice"] = 3200,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 730,
                    ["vehicleType"] = "Mercedes-Benz E-Class",
                    ["capacity"] = "3 Passengers · 3 Bags",
                    ["imageUrl"] = TourPhotos[3],
                    ["badge"] = "VIP Limo",
                    ["detailUrl"] = "/en/transfers/sin-marina-bay-limo",
                    ["features"] = new JsonArray { "Luxury Leather Interior", "Electronic Road Tolls Included", "Flight Monitored", "Executive Chauffeur" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "tr-bkk-pattaya-cab",
                    ["slug"] = "bkk-pattaya-intercity-cab",
                    ["title"] = "Bangkok (BKK) to Pattaya Resort Intercity Cab",
                    ["city"] = "Bangkok & Pattaya",
                    ["country"] = "Thailand",
                    ["price"] = 3200,
                    ["originalPrice"] = 4000,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 510,
                    ["vehicleType"] = "Toyota Commuter / Camry",
                    ["capacity"] = "4 Passengers · 3 Bags",
                    ["imageUrl"] = TourPhotos[5],
                    ["badge"] = "Intercity Fixed Rate",
                    ["detailUrl"] = "/en/transfers/bkk-pattaya-intercity-cab",
                    ["features"] = new JsonArray { "Expressway Tolls Included", "Door-to-Door Service", "Free Rest Stops", "Non-Smoking Cab" }
                });
                break;

            case "visas":
                list.Add(new JsonObject
                {
                    ["id"] = "v-uae-30-days",
                    ["slug"] = "uae-30-days-tourist-evisa",
                    ["title"] = "UAE 30 Days Single Entry Tourist eVisa",
                    ["city"] = "United Arab Emirates",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 6850,
                    ["originalPrice"] = 8500,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 4200,
                    ["imageUrl"] = TourPhotos[1],
                    ["badge"] = "Express 24h",
                    ["detailUrl"] = "/en/visas/uae-30-days-tourist-evisa",
                    ["features"] = new JsonArray { "24-48 Hours Processing", "No Embassy Visit", "Pre-Checked Documents", "99.4% Approval Rate" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "v-uae-60-days",
                    ["slug"] = "uae-60-days-multiple-entry",
                    ["title"] = "UAE 60 Days Multiple Entry Tourist eVisa",
                    ["city"] = "United Arab Emirates",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 12400,
                    ["originalPrice"] = 14800,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1890,
                    ["imageUrl"] = TourPhotos[0],
                    ["badge"] = "Multiple Entry",
                    ["detailUrl"] = "/en/visas/uae-60-days-multiple-entry",
                    ["features"] = new JsonArray { "Valid for 60 Days", "Unlimited Re-entries", "Travel Insurance Included", "Fast Approval" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "v-singapore-30-days",
                    ["slug"] = "singapore-30-days-tourist-visa",
                    ["title"] = "Singapore 30 Days Tourist eVisa",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["price"] = 3250,
                    ["originalPrice"] = 4100,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1450,
                    ["imageUrl"] = TourPhotos[3],
                    ["badge"] = "Online Submission",
                    ["detailUrl"] = "/en/visas/singapore-30-days-tourist-visa",
                    ["features"] = new JsonArray { "2-3 Working Days", "Digital Visa PDF", "Official ICA Submission", "Document Review" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "v-indonesia-b1",
                    ["slug"] = "indonesia-b1-tourist-evisa",
                    ["title"] = "Indonesia (Bali) B1 Tourist eVisa",
                    ["city"] = "Indonesia",
                    ["country"] = "Indonesia",
                    ["price"] = 3600,
                    ["originalPrice"] = 4500,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 980,
                    ["imageUrl"] = TourPhotos[2],
                    ["badge"] = "Instant / 24h",
                    ["detailUrl"] = "/en/visas/indonesia-b1-tourist-evisa",
                    ["features"] = new JsonArray { "Instant eVisa", "Skip Airport Lines", "Extendable for 30 Days", "Official QR Code" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "v-thailand-voa",
                    ["slug"] = "thailand-tourist-evisa",
                    ["title"] = "Thailand Tourist eVisa on Arrival",
                    ["city"] = "Thailand",
                    ["country"] = "Thailand",
                    ["price"] = 4100,
                    ["originalPrice"] = 5200,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 720,
                    ["imageUrl"] = TourPhotos[5],
                    ["badge"] = "Airport Fast Track",
                    ["detailUrl"] = "/en/visas/thailand-tourist-evisa",
                    ["features"] = new JsonArray { "Express Clearance", "Dedicated Immigration Lane", "Zero Queues", "Pre-Approved" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "v-uk-visitor",
                    ["slug"] = "uk-standard-visitor-visa",
                    ["title"] = "United Kingdom Standard 6-Month Visitor Visa",
                    ["city"] = "United Kingdom",
                    ["country"] = "United Kingdom",
                    ["price"] = 15800,
                    ["originalPrice"] = 18500,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 640,
                    ["imageUrl"] = TourPhotos[4],
                    ["badge"] = "Document Assistance",
                    ["detailUrl"] = "/en/visas/uk-standard-visitor-visa",
                    ["features"] = new JsonArray { "End-to-End File Preparation", "VFS Appointment Booking", "Financial Audit Support", "Expert Interview Prep" }
                });
                break;

            case "restaurants":
                list.Add(new JsonObject
                {
                    ["id"] = "r-rasoi-ghar",
                    ["slug"] = "rasoi-ghar-bur-dubai",
                    ["title"] = "Rasoi Ghar Pure Veg Indian Restaurant",
                    ["city"] = "Bur Dubai",
                    ["country"] = "United Arab Emirates",
                    ["cuisine"] = "Traditional Gujarati & Rajasthani Thali",
                    ["price"] = 1200,
                    ["originalPrice"] = 1500,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 2450,
                    ["imageUrl"] = RestaurantPhotos[0],
                    ["badge"] = "100% Pure Veg",
                    ["detailUrl"] = "/en/restaurants/rasoi-ghar-bur-dubai",
                    ["features"] = new JsonArray { "Unlimited Thali Servings", "Dedicated Jain Kitchen", "Live Rotis & Farsan", "Family AC Dining" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "r-rajdhani-thali",
                    ["slug"] = "rajdhani-thali-dubai",
                    ["title"] = "Rajdhani Thali Restaurant",
                    ["city"] = "Karama, Dubai",
                    ["country"] = "United Arab Emirates",
                    ["cuisine"] = "Royal Kathiyawadi & Jain Thali",
                    ["price"] = 1400,
                    ["originalPrice"] = 1750,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 1980,
                    ["imageUrl"] = RestaurantPhotos[1],
                    ["badge"] = "Jain Friendly",
                    ["detailUrl"] = "/en/restaurants/rajdhani-thali-dubai",
                    ["features"] = new JsonArray { "King of Thali Experience", "Authentic Spices", "Sweet & Savory Variety", "Complimentary Welcome Drink" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "r-little-italy",
                    ["slug"] = "little-italy-dubai-marina",
                    ["title"] = "Little Italy Ristorante",
                    ["city"] = "Dubai Marina",
                    ["country"] = "United Arab Emirates",
                    ["cuisine"] = "100% Pure Veg Italian & Woodfired Pizza",
                    ["price"] = 1800,
                    ["originalPrice"] = 2200,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 1120,
                    ["imageUrl"] = RestaurantPhotos[0],
                    ["badge"] = "Marina View",
                    ["detailUrl"] = "/en/restaurants/little-italy-dubai-marina",
                    ["features"] = new JsonArray { "Woodfired Pizza", "Eggless Pastas & Desserts", "Jain Pizza Options", "Outdoor Terrace" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "r-bombay-chowpatty",
                    ["slug"] = "bombay-chowpatty-dubai",
                    ["title"] = "Bombay Chowpatty Chaat & Sweets",
                    ["city"] = "Meena Bazaar, Dubai",
                    ["country"] = "United Arab Emirates",
                    ["cuisine"] = "Authentic Mumbai Street Food & Snacks",
                    ["price"] = 650,
                    ["originalPrice"] = 800,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 1640,
                    ["imageUrl"] = RestaurantPhotos[1],
                    ["badge"] = "Street Food",
                    ["detailUrl"] = "/en/restaurants/bombay-chowpatty-dubai",
                    ["features"] = new JsonArray { "Sev Puri & Pani Puri", "Pav Bhaji with Pure Ghee", "Jain Chaat Available", "Fresh Fruit Kulfi" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "r-rang-mahal",
                    ["slug"] = "rang-mahal-fine-dining-dubai",
                    ["title"] = "Rang Mahal by Atul Kochhar",
                    ["city"] = "Business Bay, Dubai",
                    ["country"] = "United Arab Emirates",
                    ["cuisine"] = "Indian Gourmet Fine Dining",
                    ["price"] = 3500,
                    ["originalPrice"] = 4200,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 890,
                    ["imageUrl"] = RestaurantPhotos[0],
                    ["badge"] = "Luxury Dining",
                    ["detailUrl"] = "/en/restaurants/rang-mahal-fine-dining-dubai",
                    ["features"] = new JsonArray { "Michelin Star Heritage", "Fine Dining Ambiance", "Vegetarian Tasting Menu", "Valet Parking" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "r-sukhothai-veg",
                    ["slug"] = "sukhothai-vegetarian-seminyak",
                    ["title"] = "Sukhothai Vegetarian Pavilion",
                    ["city"] = "Seminyak, Bali",
                    ["country"] = "Indonesia",
                    ["cuisine"] = "Pure Veg Thai & Asian Fusion",
                    ["price"] = 1600,
                    ["originalPrice"] = 2000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 520,
                    ["imageUrl"] = RestaurantPhotos[1],
                    ["badge"] = "Pure Veg Bali",
                    ["detailUrl"] = "/en/restaurants/sukhothai-vegetarian-seminyak",
                    ["features"] = new JsonArray { "Thai Green Curry Veg", "Organic Farm Veggies", "Jain Friendly Options", "Tropical Garden Seating" }
                });
                break;

            case "buildpackage":
            default:
                list.Add(new JsonObject
                {
                    ["id"] = "bld-dubai-abu-dhabi",
                    ["slug"] = "custom-dubai-abu-dhabi-vacation",
                    ["title"] = "Custom Dubai & Abu Dhabi Family Vacation Plan",
                    ["city"] = "Dubai & Abu Dhabi",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 42000,
                    ["originalPrice"] = 52000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1420,
                    ["imageUrl"] = TourPhotos[1],
                    ["badge"] = "Tailor Made",
                    ["detailUrl"] = "/en/buildpackage",
                    ["features"] = new JsonArray { "Pick Your 4/5 Star Hotel", "Choose Attractions", "Private Luxury Cabs", "Instant Cost Calculator" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "bld-bali-honeymoon",
                    ["slug"] = "custom-bali-romantic-pool-villa",
                    ["title"] = "Custom Bali Romantic Pool Villa Itinerary",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["price"] = 48000,
                    ["originalPrice"] = 59000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 980,
                    ["imageUrl"] = TourPhotos[2],
                    ["badge"] = "Honeymoon Builder",
                    ["detailUrl"] = "/en/buildpackage",
                    ["features"] = new JsonArray { "Private Pool Villas", "Floating Breakfasts", "Couples Spa Session", "Private Day Tours" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "bld-golden-triangle",
                    ["slug"] = "custom-golden-triangle-heritage",
                    ["title"] = "Custom Golden Triangle Heritage Journey",
                    ["city"] = "Delhi, Agra, Jaipur",
                    ["country"] = "India",
                    ["price"] = 26000,
                    ["originalPrice"] = 32000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 870,
                    ["imageUrl"] = TourPhotos[4],
                    ["badge"] = "Heritage Plan",
                    ["detailUrl"] = "/en/buildpackage",
                    ["features"] = new JsonArray { "Taj Mahal at Sunrise", "Jaipur Palace Tour", "Dedicated Chauffeur", "Jain Meals Included" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "bld-singapore-malaysia",
                    ["slug"] = "custom-singapore-malaysia-duo",
                    ["title"] = "Custom Singapore & Malaysia Duo Explorer",
                    ["city"] = "Singapore & Kuala Lumpur",
                    ["country"] = "Singapore & Malaysia",
                    ["price"] = 58000,
                    ["originalPrice"] = 69000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 650,
                    ["imageUrl"] = TourPhotos[3],
                    ["badge"] = "Twin City Plan",
                    ["detailUrl"] = "/en/buildpackage",
                    ["features"] = new JsonArray { "Universal Studios Passes", "Genting Highlands Cable", "Cross-Border Transfers", "Pure Veg Dinners" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "bld-switzerland-paris",
                    ["slug"] = "custom-switzerland-paris-grand",
                    ["title"] = "Custom Switzerland Alps & Paris Grand Explorer",
                    ["city"] = "Zurich & Paris",
                    ["country"] = "Switzerland & France",
                    ["price"] = 145000,
                    ["originalPrice"] = 175000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 430,
                    ["imageUrl"] = TourPhotos[0],
                    ["badge"] = "European Dream",
                    ["detailUrl"] = "/en/buildpackage",
                    ["features"] = new JsonArray { "Swiss Rail Pass Included", "Mt. Titlis Cable Car", "Eiffel Tower 2nd Floor", "Indian Restaurant Options" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "bld-kerala-backwaters",
                    ["slug"] = "custom-kerala-backwaters-munnar",
                    ["title"] = "Custom Kerala Backwaters & Hill Station Builder",
                    ["city"] = "Munnar & Alleppey",
                    ["country"] = "India",
                    ["price"] = 32000,
                    ["originalPrice"] = 39000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 780,
                    ["imageUrl"] = TourPhotos[5],
                    ["badge"] = "Houseboat Plan",
                    ["detailUrl"] = "/en/buildpackage",
                    ["features"] = new JsonArray { "Deluxe AC Houseboat", "Tea Plantation Walk", "Ayurvedic Massage", "Private AC Cab" }
                });
                break;
        }

        return list.Take(limit).ToList();
    }

    private List<JsonObject> FetchDestinationsForModule(string siteName, string module)
    {
        var list = new List<JsonObject>();

        var rawHotels = LoadSeedJson(siteName, "hotels.json");
        var rawActivities = LoadSeedJson(siteName, "activities.json");
        var rawPackages = LoadSeedJson(siteName, "packages.json");
        var rawTransfers = LoadSeedJson(siteName, "transfers.json");
        var rawRestaurants = LoadSeedJson(siteName, "restaurants.json");

        var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        if (module == "hotels")
        {
            foreach (var h in rawHotels)
            {
                var c = ExtractCity(h);
                counts[c] = counts.GetValueOrDefault(c, 0) + 1;
            }
        }
        else if (module == "tours")
        {
            foreach (var t in rawActivities)
            {
                var c = ExtractCity(t);
                counts[c] = counts.GetValueOrDefault(c, 0) + 1;
            }
        }
        else if (module == "transfers")
        {
            foreach (var tr in rawTransfers)
            {
                var c = ExtractCity(tr);
                counts[c] = counts.GetValueOrDefault(c, 0) + 1;
            }
        }
        else if (module == "restaurants")
        {
            foreach (var r in rawRestaurants)
            {
                var c = ExtractCity(r);
                counts[c] = counts.GetValueOrDefault(c, 0) + 1;
            }
        }
        else
        {
            foreach (var p in rawPackages)
            {
                var c = ExtractCity(p);
                counts[c] = counts.GetValueOrDefault(c, 0) + 1;
            }
        }

        var defaultCities = new[]
        {
            new { name = "Dubai", country = "United Arab Emirates", img = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80" },
            new { name = "Abu Dhabi", country = "United Arab Emirates", img = "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80" },
            new { name = "Goa", country = "India", img = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80" },
            new { name = "Singapore", country = "Singapore", img = "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80" },
            new { name = "Bangkok", country = "Thailand", img = "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80" },
            new { name = "London", country = "United Kingdom", img = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80" }
        };

        foreach (var c in defaultCities)
        {
            var count = counts.GetValueOrDefault(c.name, 12);
            var unit = module switch
            {
                "hotels" => "hotels",
                "tours" => "activities",
                "packages" => "packages",
                "flights" => "flight routes",
                "transfers" => "transfer routes",
                "visas" => "visa categories",
                "restaurants" => "dining places",
                _ => "options"
            };

            list.Add(new JsonObject
            {
                ["id"] = c.name.ToLowerInvariant(),
                ["name"] = c.name,
                ["country"] = c.country,
                ["itemCount"] = count,
                ["label"] = $"{count} {unit}",
                ["imageUrl"] = c.img,
                ["image"] = c.img,
                ["tag"] = count > 10 ? "Popular" : "Trending",
                ["detailUrl"] = $"/en/{module}?destination={Uri.EscapeDataString(c.name)}"
            });
        }

        return list;
    }

    private List<JsonObject> GetOfferBanners(string siteName, string module)
    {
        return module switch
        {
            "tours" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-tour-pass",
                    ["title"] = "Dubai Attractions Mega Pass",
                    ["subtitle"] = "Save up to 35% on top theme parks, desert safaris, and Burj Khalifa fast-track tickets.",
                    ["tag"] = "Super Saver",
                    ["buttonText"] = "Explore Top Tours",
                    ["buttonUrl"] = "/en/tours",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
                    ["bgGradient"] = "from-amber-600 via-orange-700 to-rose-800"
                },
                new JsonObject
                {
                    ["id"] = "banner-safari-deal",
                    ["title"] = "Red Dune Desert Safari & BBQ",
                    ["subtitle"] = "Enjoy 4x4 dune bashing, camel rides, sandboarding, and pure veg BBQ dinner with live shows.",
                    ["tag"] = "Best Seller",
                    ["buttonText"] = "Book Desert Safari",
                    ["buttonUrl"] = "/en/tours",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&q=85",
                    ["bgGradient"] = "from-purple-700 via-indigo-800 to-blue-900"
                }
            },
            "transfers" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-trf-roundtrip",
                    ["title"] = "Airport Roundtrip Discount: Flat 20% Off",
                    ["subtitle"] = "Book your airport arrival pickup and return transfer together for guaranteed savings.",
                    ["tag"] = "Airport Special",
                    ["buttonText"] = "Book Airport Transfer",
                    ["buttonUrl"] = "/en/transfers",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85",
                    ["bgGradient"] = "from-neutral-800 via-neutral-900 to-black"
                },
                new JsonObject
                {
                    ["id"] = "banner-trf-intercity",
                    ["title"] = "Dubai to Abu Dhabi Intercity Flat Rates",
                    ["subtitle"] = "Private luxury sedans and family SUVs with English-speaking chauffeurs and free waiting time.",
                    ["tag"] = "Fixed Fares",
                    ["buttonText"] = "Explore Cab Routes",
                    ["buttonUrl"] = "/en/transfers",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85",
                    ["bgGradient"] = "from-amber-700 via-yellow-800 to-stone-900"
                }
            },
            "visas" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-visa-express",
                    ["title"] = "Express 24-Hour UAE Visa Guaranteed",
                    ["subtitle"] = "Rapid document pre-verification and fast-track immigration submission with 99.4% approval.",
                    ["tag"] = "Express Processing",
                    ["buttonText"] = "Apply Express Visa",
                    ["buttonUrl"] = "/en/visas",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85",
                    ["bgGradient"] = "from-blue-800 via-sky-800 to-indigo-950"
                },
                new JsonObject
                {
                    ["id"] = "banner-visa-family",
                    ["title"] = "Flat ₹500 Off Family Visas",
                    ["subtitle"] = "Apply for 3 or more family tourist visas and receive free travel insurance coverage.",
                    ["tag"] = "Family Package",
                    ["buttonText"] = "Start Application",
                    ["buttonUrl"] = "/en/visas",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=85",
                    ["bgGradient"] = "from-emerald-800 via-teal-900 to-slate-900"
                }
            },
            "restaurants" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-dining-thali",
                    ["title"] = "Unlimited Gujarati Thali Dining Pass",
                    ["subtitle"] = "Pre-book authentic 100% Pure Veg and Jain thali experiences in Dubai with guaranteed table seating.",
                    ["tag"] = "Pure Veg & Jain",
                    ["buttonText"] = "View Thali Menus",
                    ["buttonUrl"] = "/en/restaurants",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
                    ["bgGradient"] = "from-amber-700 via-orange-800 to-rose-900"
                },
                new JsonObject
                {
                    ["id"] = "banner-dining-cruise",
                    ["title"] = "Dubai Marina Pure Veg Dinner Cruise",
                    ["subtitle"] = "Enjoy a lavish vegetarian buffet and live entertainment while cruising past the illuminated marina skyline.",
                    ["tag"] = "Special Evening",
                    ["buttonText"] = "Book Dinner Cruise",
                    ["buttonUrl"] = "/en/restaurants",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85",
                    ["bgGradient"] = "from-indigo-800 via-violet-900 to-purple-950"
                }
            },
            _ => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-bnpl",
                    ["title"] = "Book Now, Pay Later",
                    ["subtitle"] = "Pay only 20% now to reserve your luxury stay or holiday. Balance before travel.",
                    ["tag"] = "Flexible Booking",
                    ["buttonText"] = "Explore Stays",
                    ["buttonUrl"] = "/en/hotels",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
                    ["bgGradient"] = "from-sky-700 via-blue-800 to-indigo-900"
                },
                new JsonObject
                {
                    ["id"] = "banner-holiday",
                    ["title"] = "Save up to 30% on Curated Holidays",
                    ["subtitle"] = "All-inclusive packages with flights, 4-star stays, Jain meals, and VIP transfers.",
                    ["tag"] = "Limited Period",
                    ["buttonText"] = "View Packages",
                    ["buttonUrl"] = "/en/holidays",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85",
                    ["bgGradient"] = "from-emerald-700 via-teal-800 to-cyan-900"
                }
            }
        };
    }

    private List<JsonObject> GetVideoExperiences(string siteName, string module)
    {
        return module switch
        {
            "hotels" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "vid-h1",
                    ["title"] = "Atlantis The Palm Royal Suite & Beachfront Tour",
                    ["location"] = "Palm Jumeirah, Dubai",
                    ["duration"] = "1:20",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-hotel-room-with-a-view-of-the-city-41712-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-h2",
                    ["title"] = "Downtown Dubai Luxury Penthouse Stays",
                    ["location"] = "Downtown Dubai",
                    ["duration"] = "0:55",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-luxury-penthouse-terrace-view-41714-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-h3",
                    ["title"] = "Beachfront Infinity Pool & Sunset Suites",
                    ["location"] = "JBR Beach, Dubai",
                    ["duration"] = "1:10",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-swimming-pool-in-a-luxury-hotel-41716-large.mp4"
                }
            },
            "transfers" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "vid-tr1",
                    ["title"] = "VIP Airport Chauffeur Meet & Greet",
                    ["location"] = "Dubai Airport Arrivals",
                    ["duration"] = "0:45",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-driving-on-a-highway-at-sunset-41625-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-tr2",
                    ["title"] = "Dubai Marina to Abu Dhabi Luxury Sedan Ride",
                    ["location"] = "Sheikh Zayed Road",
                    ["duration"] = "1:15",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-41584-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-tr3",
                    ["title"] = "Executive Family Van City Sightseeing Drive",
                    ["location"] = "Dubai City Hub",
                    ["duration"] = "0:55",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4"
                }
            },
            "visas" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "vid-v1",
                    ["title"] = "24-Hour Express Visa Approval Process",
                    ["location"] = "Immigration Clearance Hub",
                    ["duration"] = "0:40",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-41584-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-v2",
                    ["title"] = "Dubai Airport Smart Gate Entry Experience",
                    ["location"] = "DXB Smart Gates",
                    ["duration"] = "0:50",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-safari-jeep-driving-through-the-desert-41123-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-v3",
                    ["title"] = "Hassle-Free Document Upload & Verification",
                    ["location"] = "Gujju Tours Digital Hub",
                    ["duration"] = "0:35",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4"
                }
            },
            "restaurants" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "vid-r1",
                    ["title"] = "Authentic Gujarati Thali & Dining in Dubai",
                    ["location"] = "Karama, Dubai",
                    ["duration"] = "1:05",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-dish-41650-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-r2",
                    ["title"] = "Dhow Dinner Cruise Pure Veg Royal Buffet",
                    ["location"] = "Dubai Marina",
                    ["duration"] = "0:50",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-r3",
                    ["title"] = "Chef's Special Jain Gourmet Kitchen",
                    ["location"] = "Rasoi Ghar Dubai",
                    ["duration"] = "1:15",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-dish-41650-large.mp4"
                }
            },
            _ => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "vid-1",
                    ["title"] = "Sunrise Dune Bashing & Camel Safari",
                    ["location"] = "Dubai Desert Reserve",
                    ["duration"] = "0:45",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-safari-jeep-driving-through-the-desert-41123-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-2",
                    ["title"] = "Burj Khalifa Top Floor Sunset View",
                    ["location"] = "Downtown Dubai",
                    ["duration"] = "1:15",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-skyscrapers-at-night-41584-large.mp4"
                },
                new JsonObject
                {
                    ["id"] = "vid-3",
                    ["title"] = "Luxury Yacht Cruise at Dubai Marina",
                    ["location"] = "Dubai Marina",
                    ["duration"] = "0:50",
                    ["thumbnail"] = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
                    ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-motorboat-speeding-in-the-sea-41566-large.mp4"
                }
            }
        };
    }

    private List<JsonObject> FetchCuratedPackages(string siteName, string module)
    {
        var list = new List<JsonObject>();

        switch (module)
        {
            case "hotels":
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-h1",
                    ["slug"] = "atlantis-the-palm-luxury-package",
                    ["title"] = "Atlantis The Palm 3N Luxury Stay + Waterpark",
                    ["category"] = "Luxury Stays",
                    ["price"] = 48000,
                    ["rating"] = 4.9,
                    ["imageUrl"] = HotelPhotos[0],
                    ["detailUrl"] = "/en/hotels/dubai/atlantis-the-palm"
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-h2",
                    ["slug"] = "burj-al-arab-royal-suite",
                    ["title"] = "Burj Al Arab Suite Experience + Chauffeur",
                    ["category"] = "Iconic Stays",
                    ["price"] = 125000,
                    ["rating"] = 5.0,
                    ["imageUrl"] = HotelPhotos[1],
                    ["detailUrl"] = "/en/hotels/dubai/burj-al-arab"
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-h3",
                    ["slug"] = "marina-beachfront-escape",
                    ["title"] = "Dubai Marina 5-Star Weekend Escape",
                    ["category"] = "Marina Stays",
                    ["price"] = 24000,
                    ["rating"] = 4.8,
                    ["imageUrl"] = HotelPhotos[2],
                    ["detailUrl"] = "/en/hotels/dubai/marina-beachfront"
                });
                break;

            case "tours":
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-t1",
                    ["slug"] = "dubai-super-saver-trio",
                    ["title"] = "Dubai 3-in-1 Combo: Safari + Dhow + Burj",
                    ["category"] = "Best Seller Combo",
                    ["price"] = 6999,
                    ["rating"] = 4.9,
                    ["imageUrl"] = TourPhotos[0],
                    ["detailUrl"] = "/en/tours/dubai-super-saver-trio"
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-t2",
                    ["slug"] = "abu-dhabi-ferrari-world-combo",
                    ["title"] = "Abu Dhabi Grand Tour & Ferrari World Pass",
                    ["category"] = "Theme Park Combo",
                    ["price"] = 8500,
                    ["rating"] = 4.8,
                    ["imageUrl"] = TourPhotos[1],
                    ["detailUrl"] = "/en/tours/abu-dhabi-ferrari-world-combo"
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-t3",
                    ["slug"] = "red-dune-safari-vip",
                    ["title"] = "Evening Red Dune Safari & VIP BBQ Dinner",
                    ["category"] = "Desert Safari",
                    ["price"] = 2499,
                    ["rating"] = 5.0,
                    ["imageUrl"] = TourPhotos[2],
                    ["detailUrl"] = "/en/tours/red-dune-safari-vip"
                });
                break;

            case "transfers":
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-tr1",
                    ["slug"] = "dxb-roundtrip-private-sedan",
                    ["title"] = "DXB Airport Roundtrip VIP Private Sedan",
                    ["category"] = "Airport Roundtrip",
                    ["price"] = 3800,
                    ["rating"] = 4.9,
                    ["imageUrl"] = TransferPhotos[0],
                    ["detailUrl"] = "/en/transfers/dxb-roundtrip-private-sedan"
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-tr2",
                    ["slug"] = "dubai-abu-dhabi-intercity-cab",
                    ["title"] = "Dubai to Abu Dhabi Intercity Chauffeur",
                    ["category"] = "Intercity Transfer",
                    ["price"] = 4500,
                    ["rating"] = 4.9,
                    ["imageUrl"] = TransferPhotos[1],
                    ["detailUrl"] = "/en/transfers/dubai-abu-dhabi-intercity-cab"
                });
                break;

            case "visas":
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-v1",
                    ["slug"] = "express-30-days-tourist-visa",
                    ["title"] = "30-Day Express Tourist Visa + Airport SIM",
                    ["category"] = "Express Visa",
                    ["price"] = 6800,
                    ["rating"] = 4.9,
                    ["imageUrl"] = VisaPhotos[0],
                    ["detailUrl"] = "/en/visas/express-30-days-tourist-visa"
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-v2",
                    ["slug"] = "multiple-entry-60-days-visa",
                    ["title"] = "60-Day Multiple Entry Tourist Visa",
                    ["category"] = "Multiple Entry",
                    ["price"] = 15500,
                    ["rating"] = 4.9,
                    ["imageUrl"] = VisaPhotos[1],
                    ["detailUrl"] = "/en/visas/multiple-entry-60-days-visa"
                });
                break;

            case "restaurants":
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-r1",
                    ["slug"] = "royal-gujarati-thali-experience",
                    ["title"] = "Unlimited Royal Gujarati Thali Feast Pass",
                    ["category"] = "Traditional Thali",
                    ["price"] = 850,
                    ["rating"] = 4.9,
                    ["imageUrl"] = RestaurantPhotos[0],
                    ["detailUrl"] = "/en/restaurants/royal-gujarati-thali-experience"
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-r2",
                    ["slug"] = "dubai-marina-pure-veg-dhow-dinner",
                    ["title"] = "Dubai Marina Dhow Pure Veg Dinner Cruise",
                    ["category"] = "Dinner Cruise",
                    ["price"] = 1800,
                    ["rating"] = 4.9,
                    ["imageUrl"] = RestaurantPhotos[1],
                    ["detailUrl"] = "/en/restaurants/dubai-marina-pure-veg-dhow-dinner"
                });
                break;

            default:
                var raw = LoadSeedJson(siteName, "packages.json");
                var pkgIdx = 0;
                foreach (var p in raw.Take(6))
                {
                    var slug = p?["slug"]?.ToString() ?? p?["id"]?.ToString() ?? "pkg";
                    var rawId = p?["id"]?.ToString() ?? slug;
                    list.Add(new JsonObject
                    {
                        ["id"] = $"curated-pkg-{rawId}",
                        ["slug"] = slug,
                        ["title"] = p?["title"]?.ToString() ?? "5D/4N Dubai Grand Tour",
                        ["category"] = p?["category"]?.ToString() ?? "Dubai Packages",
                        ["price"] = AsDouble(p?["price"], 32500),
                        ["rating"] = 4.9,
                        ["imageUrl"] = PackagePhotos[pkgIdx++ % PackagePhotos.Length],
                        ["detailUrl"] = $"/en/holidays/{slug}"
                    });
                }
                break;
        }

        var isGujjuTenant = siteName.Equals("gujjutours", StringComparison.OrdinalIgnoreCase) || siteName.Equals("website1", StringComparison.OrdinalIgnoreCase);
        var fallbackCurrency = isGujjuTenant ? "INR" : siteName.Equals("technoheaven", StringComparison.OrdinalIgnoreCase) ? "AED" : "USD";
        foreach (var itm in list)
        {
            if (itm != null)
            {
                if (!itm.ContainsKey("currency") || string.IsNullOrWhiteSpace(itm["currency"]?.ToString()))
                {
                    itm["currency"] = fallbackCurrency;
                }
                if (module == "restaurants" && !itm.ContainsKey("costForTwo") && itm.ContainsKey("price"))
                {
                    itm["costForTwo"] = AsDouble(itm["price"], 1710);
                }
            }
        }

        return list;
    }

    private List<JsonObject> GetReviews(string siteName, string module)
    {
        return module switch
        {
            "hotels" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "rev-h1",
                    ["author"] = "Pooja Shah",
                    ["city"] = "Surat, India",
                    ["rating"] = 5,
                    ["platform"] = "TripAdvisor",
                    ["date"] = "3 days ago",
                    ["text"] = "Our family hotel stay in Atlantis The Palm was handled exceptionally well. Got complimentary room upgrades, early check-in, and pure vegetarian breakfast confirmed with the chef."
                },
                new JsonObject
                {
                    ["id"] = "rev-h2",
                    ["author"] = "Harish Mehta",
                    ["city"] = "Ahmedabad, India",
                    ["rating"] = 5,
                    ["platform"] = "Google Reviews",
                    ["date"] = "1 week ago",
                    ["text"] = "Booked JW Marriott Marquis through Gujju Tours. Best rates online, zero hidden resort fees, and the 24/7 concierge was always accessible via WhatsApp."
                }
            },
            "tours" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "rev-t1",
                    ["author"] = "Rajesh Patel",
                    ["city"] = "Ahmedabad, India",
                    ["rating"] = 5,
                    ["platform"] = "Google Reviews",
                    ["date"] = "2 days ago",
                    ["text"] = "The evening red dune desert safari was the highlight of our Dubai trip! Punctual Land Cruiser pickup, thrilling dune bashing, and Jain food was specifically served at the desert camp."
                },
                new JsonObject
                {
                    ["id"] = "rev-t2",
                    ["author"] = "Ketan Trivedi",
                    ["city"] = "Rajkot, India",
                    ["rating"] = 5,
                    ["platform"] = "TripAdvisor",
                    ["date"] = "5 days ago",
                    ["text"] = "Burj Khalifa fast-track vouchers with QR codes worked like magic. No queue at the ticket counter, straight to the 124th floor elevator. Highly recommended!"
                }
            },
            "transfers" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "rev-tr1",
                    ["author"] = "Sanjay Doshi",
                    ["city"] = "Ahmedabad, India",
                    ["rating"] = 5,
                    ["platform"] = "Google Reviews",
                    ["date"] = "2 days ago",
                    ["text"] = "Our driver was waiting at DXB Terminal 3 arrivals holding a clear name sign. Assisted with 4 large suitcases, pristine Lexus sedan, and smooth drive to Palm Jumeirah."
                },
                new JsonObject
                {
                    ["id"] = "rev-tr2",
                    ["author"] = "Meera Thakkar",
                    ["city"] = "Vadodara, India",
                    ["rating"] = 5,
                    ["platform"] = "TripAdvisor",
                    ["date"] = "4 days ago",
                    ["text"] = "Booked intercity transfer from Dubai to Abu Dhabi. The vehicle was spotless, air conditioning was fantastic, and the driver was extremely polite and professional."
                }
            },
            "visas" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "rev-v1",
                    ["author"] = "Amit Desai",
                    ["city"] = "Vadodara, India",
                    ["rating"] = 5,
                    ["platform"] = "Trustpilot",
                    ["date"] = "1 day ago",
                    ["text"] = "Express UAE tourist visa was approved in less than 18 hours! Document upload was straightforward and the team double checked all passport details before submission."
                },
                new JsonObject
                {
                    ["id"] = "rev-v2",
                    ["author"] = "Priti Sanghavi",
                    ["city"] = "Ahmedabad, India",
                    ["rating"] = 5,
                    ["platform"] = "Google Reviews",
                    ["date"] = "5 days ago",
                    ["text"] = "Applied for 5 family tourist visas. All 5 were approved together without asking for unnecessary extra papers. Truly fast and reliable visa service."
                }
            },
            _ => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "rev-1",
                    ["author"] = "Rajesh Patel",
                    ["city"] = "Ahmedabad, India",
                    ["rating"] = 5,
                    ["platform"] = "Google Reviews",
                    ["date"] = "2 days ago",
                    ["text"] = "Booking Dubai trip with Gujju Tours was a seamless experience. Jain food was arranged in every restaurant, desert safari was fantastic, and private transfers were on time."
                },
                new JsonObject
                {
                    ["id"] = "rev-2",
                    ["author"] = "Pooja Shah",
                    ["city"] = "Surat, India",
                    ["rating"] = 5,
                    ["platform"] = "TripAdvisor",
                    ["date"] = "1 week ago",
                    ["text"] = "Our family hotel booking in Atlantis The Palm was handled exceptionally well. Got complimentary room upgrades and waterpark passes. 10/10 concierge support!"
                }
            }
        };
    }

    private List<JsonObject> GetFaqAccordion(string siteName, string module)
    {
        return module switch
        {
            "tours" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "faq-t1",
                    ["question"] = "What is included in the Desert Safari tour?",
                    ["answer"] = "Our desert safari includes roundtrip 4x4 Land Cruiser hotel pickup, 30 minutes red dune bashing, camel rides, sandboarding, falcon photography, live cultural shows, and a lavish BBQ dinner with verified Pure Veg & Jain food counters."
                },
                new JsonObject
                {
                    ["id"] = "faq-t2",
                    ["question"] = "How do I redeem my attraction tickets and tour vouchers?",
                    ["answer"] = "All attraction vouchers include digital QR codes delivered instantly via email and WhatsApp. Simply present the QR code on your mobile phone at the gate for fast-track entry."
                },
                new JsonObject
                {
                    ["id"] = "faq-t3",
                    ["question"] = "Can we book private sightseeing tours with Gujarati / Hindi speaking guides?",
                    ["answer"] = "Yes! We offer customized private tours with dedicated English, Gujarati, and Hindi speaking chauffeurs and licensed tour guides."
                },
                new JsonObject
                {
                    ["id"] = "faq-t4",
                    ["question"] = "What is the cancellation and refund policy for activities?",
                    ["answer"] = "Most tours and activities offer free cancellation up to 24 hours prior to scheduled departure with full refunds."
                }
            },
            "transfers" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "faq-tr1",
                    ["question"] = "Will the chauffeur meet me inside the airport terminal?",
                    ["answer"] = "Yes! Your private chauffeur will monitor your flight number, wait at the airport arrival hall holding a clear digital name sign, assist with luggage, and escort you to your vehicle."
                },
                new JsonObject
                {
                    ["id"] = "faq-tr2",
                    ["question"] = "What happens if my flight arrives late or is delayed?",
                    ["answer"] = "We track all flights in real-time. Chauffeur arrival times are automatically adjusted with complimentary 60 minutes waiting time from touchdown."
                },
                new JsonObject
                {
                    ["id"] = "faq-tr3",
                    ["question"] = "Can I request baby booster seats or child safety seats?",
                    ["answer"] = "Yes, certified child safety seats and infant booster seats are available upon request during booking at no extra surcharge."
                },
                new JsonObject
                {
                    ["id"] = "faq-tr4",
                    ["question"] = "Can I book inter-city transfers between Dubai and Abu Dhabi?",
                    ["answer"] = "Yes, we provide fixed-rate private transfers across all emirates including Dubai, Abu Dhabi, Sharjah, Ajman, and Ras Al Khaimah."
                }
            },
            "visas" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "faq-v1",
                    ["question"] = "What documents are required for a Dubai tourist visa?",
                    ["answer"] = "You only need a clear colored copy of your passport (valid for at least 6 months) and a recent passport-size photograph with white background. No physical embassy visit required."
                },
                new JsonObject
                {
                    ["id"] = "faq-v2",
                    ["question"] = "How fast is express visa processing approved?",
                    ["answer"] = "Express visa processing is typically approved within 12 to 24 hours. Standard tourist visas are processed within 2 to 3 working days."
                },
                new JsonObject
                {
                    ["id"] = "faq-v3",
                    ["question"] = "Do children and infants require a separate visa for the UAE?",
                    ["answer"] = "Yes, every individual traveler including infants requires an independent tourist visa to enter the UAE."
                },
                new JsonObject
                {
                    ["id"] = "faq-v4",
                    ["question"] = "What is your visa approval success rate?",
                    ["answer"] = "Gujju Tours maintains a 99.4% approval rate with direct immigration clearing and pre-verification of all uploaded documents."
                }
            },
            "restaurants" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "faq-r1",
                    ["question"] = "Are all listed dining places 100% Pure Vegetarian and Jain friendly?",
                    ["answer"] = "Yes, every restaurant featured in our dining section is physically verified to ensure 100% Pure Vegetarian kitchens with dedicated Jain meal preparations."
                },
                new JsonObject
                {
                    ["id"] = "faq-r2",
                    ["question"] = "Why should I pre-book dining packages through Gujju Tours?",
                    ["answer"] = "Pre-booking gives you guaranteed table reservation without standing in long queues, priority seating, and discounted pre-fixed menu rates."
                },
                new JsonObject
                {
                    ["id"] = "faq-r3",
                    ["question"] = "Can special dietary preferences like Swaminarayan meals be arranged?",
                    ["answer"] = "Yes! Mention your specific dietary preferences during reservation checkout, and our partnered chefs will prepare fresh meals adhering strictly to your requirements."
                },
                new JsonObject
                {
                    ["id"] = "faq-r4",
                    ["question"] = "Are unlimited thali refills included in meal vouchers?",
                    ["answer"] = "Yes, traditional Gujarati, Rajasthani, and Kathiyawadi thali vouchers include unlimited servings of rotis, dal, kadhi, vegetable gravies, farsan snacks, and sweets."
                }
            },
            _ => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "faq-1",
                    ["question"] = "How is post-booking care different from a basic booking portal?",
                    ["answer"] = "Unlike automated aggregators, our dedicated concierge team tracks your itinerary 24/7. From flight delays and airport pick-up coordination to special dietary meals (Pure Veg / Jain food) and voucher re-issuance, a real human is always a phone call or WhatsApp message away."
                },
                new JsonObject
                {
                    ["id"] = "faq-2",
                    ["question"] = "Are all dietary preferences like Pure Veg and Jain meals guaranteed?",
                    ["answer"] = "Yes! For Gujju Tours bookings, all partnered hotels, desert safaris, and dhow cruises offer verified 100% Pure Vegetarian and Jain meal alternatives prepared without root vegetables."
                },
                new JsonObject
                {
                    ["id"] = "faq-3",
                    ["question"] = "What happens if my travel plans change or I need to reschedule?",
                    ["answer"] = "Most hotel and tour bookings come with flexible cancellation policies. You can modify your travel dates through the My Bookings portal or contact our 24/7 support desk."
                },
                new JsonObject
                {
                    ["id"] = "faq-4",
                    ["question"] = "How do I receive my booking vouchers and e-tickets?",
                    ["answer"] = "Instantly upon confirmation, vouchers with QR codes are delivered to your email and accessible anytime inside your My Bookings dashboard and mobile app."
                }
            }
        };
    }
}
