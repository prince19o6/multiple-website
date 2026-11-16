using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Nodes;
using ToursApi.Configuration;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogGatewayController : ControllerBase
{
    private readonly IWebsiteContext _websiteContext;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<CatalogGatewayController> _logger;
    private static readonly Dictionary<string, (DateTime ExpiresAt, JsonNode Data)> Cache = new();
    private static readonly object CacheLock = new();

    public CatalogGatewayController(
        IWebsiteContext websiteContext,
        IWebHostEnvironment env,
        ILogger<CatalogGatewayController> logger)
    {
        _websiteContext = websiteContext;
        _env = env;
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

    private JsonArray LoadRawBanners(string siteId)
    {
        string filename = siteId switch
        {
            "website2" => "tripgoasia_banners.json",
            "tripgoasia" => "tripgoasia_banners.json",
            "website3" => "technoheaven_banners.json",
            "technoheaven" => "technoheaven_banners.json",
            _ => "gujjutours_banners.json"
        };

        var cacheKey = $"banners:{filename}";
        lock (CacheLock)
        {
            if (Cache.TryGetValue(cacheKey, out var entry) && entry.ExpiresAt > DateTime.UtcNow)
            {
                return entry.Data.AsArray();
            }
        }

        var path = Path.Combine(_env.ContentRootPath, "Catalog", "Fixtures", filename);
        if (!System.IO.File.Exists(path))
        {
            _logger.LogWarning("Catalog fixture not found at {Path}, returning empty array", path);
            return new JsonArray();
        }

        var json = System.IO.File.ReadAllText(path);
        var parsed = JsonNode.Parse(json)?.AsArray() ?? new JsonArray();

        lock (CacheLock)
        {
            Cache[cacheKey] = (DateTime.UtcNow.AddMinutes(15), parsed);
        }

        return parsed;
    }

    [HttpGet("banners")]
    public IActionResult GetBanners([FromQuery] string? site = null)
    {
        var resolvedSiteId = ResolveSiteId(site);
        var banners = LoadRawBanners(resolvedSiteId);
        return Ok(new
        {
            success = true,
            site = resolvedSiteId,
            count = banners.Count,
            data = banners
        });
    }

    [HttpGet("destinations")]
    public IActionResult GetDestinations([FromQuery] string? site = null)
    {
        var resolvedSiteId = ResolveSiteId(site);
        var banners = LoadRawBanners(resolvedSiteId);
        var destinationMap = new Dictionary<string, JsonObject>(StringComparer.OrdinalIgnoreCase);

        foreach (var banner in banners)
        {
            if (banner?["productDetails"] is JsonArray products)
            {
                foreach (var prod in products)
                {
                    var cityName = prod?["city"]?["cityName"]?.ToString();
                    if (!string.IsNullOrWhiteSpace(cityName) && !destinationMap.ContainsKey(cityName))
                    {
                        var country = prod?["country"]?["countryName"]?.ToString() ?? "Asia";
                        var img = prod?["imagePath"]?.ToString() ?? "";
                        destinationMap[cityName] = new JsonObject
                        {
                            ["id"] = prod?["id"]?.GetValue<int>() ?? 0,
                            ["name"] = cityName,
                            ["countryName"] = country,
                            ["image"] = img,
                            ["weather"] = prod?["weatherDetails"]?.DeepClone()
                        };
                    }
                }
            }
        }

        return Ok(new
        {
            success = true,
            count = destinationMap.Count,
            data = destinationMap.Values
        });
    }

    [HttpGet("hotels")]
    public IActionResult GetHotels([FromQuery] string? site = null, [FromQuery] string? city = null)
    {
        var resolvedSiteId = ResolveSiteId(site);
        var banners = LoadRawBanners(resolvedSiteId);
        var hotels = new JsonArray();

        foreach (var banner in banners)
        {
            var serviceType = banner?["serviceType"]?["code"]?.ToString() ?? "";
            if (serviceType.Contains("HOTEL", StringComparison.OrdinalIgnoreCase) && banner?["productDetails"] is JsonArray products)
            {
                foreach (var prod in products)
                {
                    if (prod != null)
                    {
                        var cityName = prod["city"]?["cityName"]?.ToString() ?? "";
                        if (string.IsNullOrWhiteSpace(city) || cityName.Contains(city, StringComparison.OrdinalIgnoreCase))
                        {
                            hotels.Add(prod.DeepClone());
                        }
                    }
                }
            }
        }

        return Ok(new
        {
            success = true,
            count = hotels.Count,
            data = hotels
        });
    }

    [HttpGet("tours")]
    public IActionResult GetTours([FromQuery] string? site = null, [FromQuery] string? destination = null)
    {
        var resolvedSiteId = ResolveSiteId(site);
        var banners = LoadRawBanners(resolvedSiteId);
        var tours = new JsonArray();

        foreach (var banner in banners)
        {
            var serviceType = banner?["serviceType"]?["code"]?.ToString() ?? "";
            if (!serviceType.Contains("HOTEL", StringComparison.OrdinalIgnoreCase) && banner?["productDetails"] is JsonArray products)
            {
                foreach (var prod in products)
                {
                    if (prod != null)
                    {
                        var cityName = prod["city"]?["cityName"]?.ToString() ?? "";
                        if (string.IsNullOrWhiteSpace(destination) || cityName.Contains(destination, StringComparison.OrdinalIgnoreCase))
                        {
                            tours.Add(prod.DeepClone());
                        }
                    }
                }
            }
        }

        return Ok(new
        {
            success = true,
            count = tours.Count,
            data = tours
        });
    }
}

