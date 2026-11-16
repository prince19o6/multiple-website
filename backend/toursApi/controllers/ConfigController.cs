using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Bson.IO;
using MongoDB.Bson.Serialization;
using System.Text.Json;
using System.Text.Json.Nodes;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/core/v1/config")]
public class ConfigController : ControllerBase
{
    private readonly IWebsiteConfigRepository _websiteConfigRepo;
    private readonly IWebsiteContext _websiteContext;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ConfigController> _logger;

    public ConfigController(
        IWebsiteConfigRepository websiteConfigRepo,
        IWebsiteContext websiteContext,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ConfigController> logger)
    {
        _websiteConfigRepo = websiteConfigRepo;
        _websiteContext = websiteContext;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet]
    [HttpGet("{hostname}")]
    public async Task<IActionResult> GetByHostname(string? hostname = null, [FromQuery] string lang = "en")
    {
        var site = _websiteContext.CurrentSite;
        if (site == null && !string.IsNullOrWhiteSpace(hostname))
        {
            site = WebsiteRegistry.Resolve(hostname);
        }

        if (site == null)
        {
            return NotFound(new
            {
                result = (object?)null,
                error = "Unknown website tenant",
                isSuccess = false,
            });
        }

        var queryHost = !string.IsNullOrWhiteSpace(hostname)
            ? WebsiteRegistry.NormalizeHostname(hostname)
            : site.CanonicalHostname;

        // 1. Ensure tenant database has seeded config if empty
        try
        {
            await _websiteConfigRepo.SeedDefaultsIfMissingAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ConfigController] Non-fatal seed failure for {Hostname}", queryHost);
        }

        // 2. Read full typed SiteConfig document from MongoDB or disk seed
        try
        {
            var mongoDoc = await _websiteConfigRepo.GetConfigAsync(queryHost);
            if (mongoDoc != null)
            {
                var jsonString = mongoDoc.ToJson(new JsonWriterSettings
                {
                    OutputMode = JsonOutputMode.RelaxedExtendedJson
                });

                var jsonNode = JsonNode.Parse(jsonString);

                // Backward compatibility envelope: provide both top-level and result envelope
                return Ok(new
                {
                    result = jsonNode,
                    error = (string?)null,
                    isSuccess = true,
                    version = jsonNode?["version"]?.ToString() ?? "1.0.0",
                    updatedAt = jsonNode?["updatedAt"]?.ToString() ?? DateTime.UtcNow.ToString("o")
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[ConfigController] Non-fatal Mongo config read exception for {Hostname}. Using default fallback.", queryHost);
        }

        // 3. Fallback to external proxy if enabled and no mongo document yet
        var externalEnabled = _configuration.GetValue("ExternalConfig:Enabled", false);
        var baseUri = _configuration[$"ExternalConfig:BaseUrls:{site.WebsiteId}"]
            ?? _configuration[$"{site.WebsiteId.ToUpperInvariant()}_API_URL"];

        if (externalEnabled && !string.IsNullOrEmpty(baseUri))
        {
            try
            {
                var client = _httpClientFactory.CreateClient("ExternalConfig");
                var url = $"{baseUri.TrimEnd('/')}/api/core/v1/config/{site.CanonicalHostname}?lang={Uri.EscapeDataString(lang)}";
                using var response = await client.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync();
                    return Content(text, "application/json");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ConfigController] External config proxy failed for {Hostname}", queryHost);
            }
        }

        // 4. Default comprehensive fallback matching SiteConfigResult expectations
        return Ok(new
        {
            result = new
            {
                website = new
                {
                    id = site.WebsiteId,
                    name = site.SiteName,
                    canonicalHostname = site.CanonicalHostname,
                    logoUrl = site.LogoUrl,
                    currency = new { code = site.Currency, symbol = site.CurrencySymbol, name = site.Currency, decimalPlaces = 2 }
                },
                site = new
                {
                    id = site.WebsiteId,
                    name = site.SiteName,
                    canonicalHostname = site.CanonicalHostname,
                    logoUrl = site.LogoUrl,
                    currency = new { code = site.Currency, symbol = site.CurrencySymbol, name = site.Currency, decimalPlaces = 2 }
                },
                colors = new
                {
                    primary = site.PrimaryColor,
                    secondary = site.SecondaryColor,
                    brandPrimary = site.PrimaryColor,
                    brandSecondary = site.SecondaryColor,
                    accent = site.SecondaryColor,
                },
                theme = new
                {
                    defaultMode = site.DefaultMode,
                    colors = new
                    {
                        primary = site.PrimaryColor,
                        secondary = site.SecondaryColor,
                        brandPrimary = site.PrimaryColor,
                        brandSecondary = site.SecondaryColor,
                        background = "#ffffff",
                        surface = "#ffffff",
                        text = "#0f172a"
                    }
                },
                modules = new
                {
                    hotels = true,
                    tours = true,
                    packages = true,
                    flights = true,
                    transfers = true,
                    visas = true,
                    restaurants = true,
                    buildpackage = true
                },
                websiteModules = new object[]
                {
                    new { module = "hotels", isEnabled = true },
                    new { module = "tours", isEnabled = true },
                    new { module = "packages", isEnabled = true },
                    new { module = "flights", isEnabled = true },
                    new { module = "transfers", isEnabled = true },
                    new { module = "visas", isEnabled = true },
                    new { module = "restaurants", isEnabled = true },
                    new { module = "buildpackage", isEnabled = true }
                },
                websiteCurrency = new object[]
                {
                    new { currencyCode = site.Currency, symbol = site.CurrencySymbol, name = site.Currency }
                }
            },
            error = (string?)null,
            isSuccess = true
        });
    }

    /// <summary>
    /// Admin endpoint to read or update SiteConfig with validation and audit logging.
    /// </summary>
    [HttpPut]
    [HttpPut("{hostname}")]
    [Authorize]
    public async Task<IActionResult> UpdateConfig(string? hostname, [FromBody] JsonElement rawPayload)
    {
        var site = _websiteContext.CurrentSite;
        if (site == null && !string.IsNullOrWhiteSpace(hostname))
        {
            site = WebsiteRegistry.Resolve(hostname);
        }

        if (site == null)
        {
            return NotFound(new { success = false, error = "Unknown website tenant." });
        }

        var targetHost = !string.IsNullOrWhiteSpace(hostname)
            ? WebsiteRegistry.NormalizeHostname(hostname)
            : site.CanonicalHostname;

        var jsonString = rawPayload.GetRawText();
        if (string.IsNullOrWhiteSpace(jsonString))
        {
            return BadRequest(new { success = false, error = "Payload cannot be empty." });
        }

        try
        {
            var bsonDoc = BsonSerializer.Deserialize<BsonDocument>(jsonString);
            var updatedBy = User.Identity?.Name ?? "admin";

            // Save and audit log
            await _websiteConfigRepo.SaveConfigAsync(targetHost, bsonDoc, updatedBy);
            _logger.LogInformation("[ConfigController] Admin audit: {User} updated SiteConfig for {Host} at {Time}",
                updatedBy, targetHost, DateTime.UtcNow);

            return Ok(new
            {
                success = true,
                message = $"Site configuration for '{targetHost}' successfully updated and published.",
                updatedAt = DateTime.UtcNow.ToString("o"),
                updatedBy
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ConfigController] Failed to deserialize or save SiteConfig for {Host}", targetHost);
            return BadRequest(new { success = false, error = $"Invalid SiteConfig format: {ex.Message}" });
        }
    }
}
