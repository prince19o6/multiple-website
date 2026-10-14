using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Bson.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using ToursApi.Configuration;
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

    private async Task<string?> GetMongoWebsiteConfigurationRawJsonAsync(string hostname)
    {
        try
        {
            var configDoc = await _websiteConfigRepo.GetByHostnameAsync(hostname);
            if (configDoc == null) return null;

            return configDoc.Config.ToJson(new JsonWriterSettings
            {
                OutputMode = JsonOutputMode.RelaxedExtendedJson
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Mongo websiteConfig read failed for {Hostname}", hostname);
            return null;
        }
    }

    private (string baseUrl, string targetHost) ResolveExternalTarget(WebsiteConfig site, string normalizedHostname)
    {
        var baseUri = _configuration[$"ExternalConfig:BaseUrls:{site.WebsiteId}"]
            ?? _configuration[$"{site.WebsiteId.ToUpperInvariant()}_API_URL"]
            ?? _configuration["ExternalConfig:BaseUrl"];

        if (string.IsNullOrWhiteSpace(baseUri))
        {
            baseUri = site.WebsiteId switch
            {
                "technoheaven" => "https://stagingapi.technoheaven.com",
                "tripgoasia" => "https://stagingapi.tripgoasia.com",
                _ => "https://stagingapi.gujjutours.com"
            };
        }

        var targetHost = site.CanonicalHostname;
        return (baseUri.TrimEnd('/'), targetHost);
    }

    [HttpGet]
    [HttpGet("{hostname}")]
    public async Task<IActionResult> GetByHostname(string? hostname = null, [FromQuery] string lang = "en")
    {
        var site = _websiteContext.CurrentSite;
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

        var mongoConfigRawJson = await GetMongoWebsiteConfigurationRawJsonAsync(queryHost);

        var externalEnabled = _configuration.GetValue("ExternalConfig:Enabled", true);
        var (baseUrl, targetHost) = ResolveExternalTarget(site, queryHost);

        if (externalEnabled && !string.IsNullOrEmpty(baseUrl))
        {
            try
            {
                var client = _httpClientFactory.CreateClient("ExternalConfig");
                var url = $"{baseUrl}/api/core/v1/config/{targetHost}?lang={Uri.EscapeDataString(lang)}";
                using var response = await client.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync();
                    var node = JsonNode.Parse(text);

                    var externalIsSuccess = node?["isSuccess"]?.GetValue<bool?>() ?? false;
                    var hasRealWebsite = node?["result"]?["website"] is JsonObject;

                    if (externalIsSuccess && hasRealWebsite)
                    {
                        if (mongoConfigRawJson != null && node!["result"] is JsonObject resultObj)
                        {
                            resultObj["websiteConfiguration"] = JsonNode.Parse(mongoConfigRawJson);
                        }

                        return Content(node!.ToJsonString(), "application/json");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "External config API failed for {Hostname}", queryHost);
            }
        }

        var callerIp = HttpContext.Connection.RemoteIpAddress?.ToString();

        object? websiteConfiguration = mongoConfigRawJson != null
            ? JsonSerializer.Deserialize<object>(mongoConfigRawJson)
            : null;

        var result = new
        {
            recommendations = new[] { new { isEnabled = 1, favService = "TOUR" } },
            theme = new { },
            websiteConfiguration,
            websiteContact = new { contact = Array.Empty<object>(), email = Array.Empty<object>() },
            websiteLaunguage = Array.Empty<object>(),
            websiteLinks = new { headerType = Array.Empty<object>(), footerTypes = Array.Empty<object>() },
            font = (object?)null,
            colors = new
            {
                primary = site.PrimaryColor,
                secondary = site.SecondaryColor,
            },
            websiteRights = Array.Empty<object>(),
            website = new
            {
                id = site.WebsiteId,
                name = site.SiteName,
                logoUrl = site.LogoUrl,
            },
            websiteModules = Array.Empty<object>(),
            websiteExtra = new { social = Array.Empty<object>(), cardInfo = Array.Empty<object>() },
            socialMediaScript = Array.Empty<object>(),
            websiteCurrency = new[] { new { currency = site.Currency, symbol = site.CurrencySymbol } },
            socialMediaConfig = Array.Empty<object>(),
            geo = new { country = (string?)null, city = (string?)null, ip = callerIp },
        };

        return Ok(new
        {
            result,
            error = (string?)null,
            isSuccess = true,
        });
    }
}