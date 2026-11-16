using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Bson.IO;
using MongoDB.Bson.Serialization;
using System.Security.Claims;
using System.Text.Json;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/admin/website-config")]
[Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
public class WebsiteConfigAdminController : ControllerBase
{
    private readonly IWebsiteConfigRepository _repo;
    private readonly IWebsiteContext _websiteContext;

    public WebsiteConfigAdminController(IWebsiteConfigRepository repo, IWebsiteContext websiteContext)
    {
        _repo = repo;
        _websiteContext = websiteContext;
    }

    private bool ValidateTenantAndHostname(string hostname, out IActionResult? errorResult)
    {
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;
        var tokenWebsiteId = User.FindFirst("websiteId")?.Value;

        if (!string.Equals(tokenWebsiteId, currentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            errorResult = StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                error = "Access denied: session belongs to a different website tenant."
            });
            return false;
        }

        var normalized = WebsiteRegistry.NormalizeHostname(hostname);
        var currentSite = _websiteContext.CurrentSite;

        if (currentSite == null || !currentSite.AllowedHostnames.Any(h => WebsiteRegistry.NormalizeHostname(h).Equals(normalized, StringComparison.OrdinalIgnoreCase)))
        {
            errorResult = StatusCode(StatusCodes.Status400BadRequest, new
            {
                success = false,
                error = $"Hostname '{hostname}' does not belong to the active website tenant '{currentWebsiteId}'."
            });
            return false;
        }

        errorResult = null;
        return true;
    }

    [HttpGet("{hostname}")]
    public async Task<IActionResult> Get(string hostname)
    {
        if (!ValidateTenantAndHostname(hostname, out var errorResult))
        {
            return errorResult!;
        }

        var normalized = WebsiteRegistry.NormalizeHostname(hostname);
        var doc = await _repo.GetByHostnameAsync(normalized);

        if (doc == null)
        {
            return NotFound(new { success = false, error = $"No dynamic config stored yet for \"{hostname}\"" });
        }

        var json = doc.Config.ToJson(new JsonWriterSettings { OutputMode = JsonOutputMode.RelaxedExtendedJson });
        var config = JsonSerializer.Deserialize<object>(json);

        return Ok(new { success = true, hostname = normalized, config, updatedAt = doc.UpdatedAt });
    }

    [HttpPut("{hostname}")]
    public async Task<IActionResult> Upsert(string hostname, [FromBody] JsonElement config)
    {
        if (!ValidateTenantAndHostname(hostname, out var errorResult))
        {
            return errorResult!;
        }

        if (config.ValueKind != JsonValueKind.Object)
        {
            return BadRequest(new { success = false, error = "Request body must be a JSON object." });
        }

        var normalized = WebsiteRegistry.NormalizeHostname(hostname);
        BsonDocument bson;
        try
        {
            bson = BsonDocument.Parse(config.GetRawText());
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, error = $"Invalid JSON: {ex.Message}" });
        }

        await _repo.UpsertAsync(normalized, bson);
        return Ok(new { success = true, hostname = normalized });
    }

    [HttpGet("{hostname}/features")]
    public async Task<IActionResult> GetFeatures(string hostname)
    {
        if (!ValidateTenantAndHostname(hostname, out var errorResult))
        {
            return errorResult!;
        }

        var normalized = WebsiteRegistry.NormalizeHostname(hostname);
        var doc = await _repo.GetByHostnameAsync(normalized);
        if (doc == null || doc.Config == null)
        {
            await _repo.SeedDefaultsIfMissingAsync();
            doc = await _repo.GetByHostnameAsync(normalized);
        }

        if (doc == null || doc.Config == null)
        {
            return NotFound(new { success = false, error = $"Config not found for '{hostname}'" });
        }

        var config = doc.Config;
        var featuresList = new List<FeatureItemContract>();

        if (config.Contains("featureRegistry") && config["featureRegistry"].IsBsonArray)
        {
            var json = config["featureRegistry"].ToJson(new JsonWriterSettings { OutputMode = JsonOutputMode.RelaxedExtendedJson });
            featuresList = JsonSerializer.Deserialize<List<FeatureItemContract>>(json) ?? new();
        }

        var resolved = FeatureDependencyResolver.Resolve(featuresList);

        return Ok(new
        {
            success = true,
            hostname = normalized,
            version = config.Contains("version") ? config["version"].AsString : "1.0.0",
            updatedAt = doc.UpdatedAt,
            features = resolved
        });
    }

    [HttpPut("{hostname}/features")]
    public async Task<IActionResult> UpdateFeatures(string hostname, [FromBody] List<FeatureItemContract> features)
    {
        if (!ValidateTenantAndHostname(hostname, out var errorResult))
        {
            return errorResult!;
        }

        if (features == null || features.Count == 0)
        {
            return BadRequest(new { success = false, error = "Feature list cannot be empty." });
        }

        var normalized = WebsiteRegistry.NormalizeHostname(hostname);
        var doc = await _repo.GetByHostnameAsync(normalized);
        if (doc == null || doc.Config == null)
        {
            await _repo.SeedDefaultsIfMissingAsync();
            doc = await _repo.GetByHostnameAsync(normalized);
        }

        if (doc == null || doc.Config == null)
        {
            return NotFound(new { success = false, error = $"Config not found for '{hostname}'" });
        }

        var config = doc.Config;

        // 1. Resolve dependencies cascading
        var resolved = FeatureDependencyResolver.Resolve(features);

        // 2. Bump version patch (e.g. 1.0.0 -> 1.0.1)
        var currentVersion = config.Contains("version") ? config["version"].AsString : "1.0.0";
        var parts = currentVersion.Split('.');
        if (parts.Length >= 3 && int.TryParse(parts[2], out var patch))
        {
            config["version"] = $"{parts[0]}.{parts[1]}.{patch + 1}";
        }
        else
        {
            config["version"] = "1.0.1";
        }

        // 3. Serialize and attach featureRegistry
        var serializedFeatures = JsonSerializer.Serialize(resolved);
        config["featureRegistry"] = BsonSerializer.Deserialize<BsonArray>(serializedFeatures);

        // 4. Sync backward compatible features map
        if (config.Contains("features") && config["features"].IsBsonDocument)
        {
            var legacyFeatures = config["features"].AsBsonDocument;
            foreach (var item in resolved)
            {
                var key = item.Id.Replace("-", "");
                if (legacyFeatures.Contains(key))
                {
                    legacyFeatures[key] = item.Enabled;
                }
            }
        }

        var updatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name ?? "admin";
        await _repo.SaveConfigAsync(normalized, config, updatedBy);

        return Ok(new
        {
            success = true,
            hostname = normalized,
            version = config["version"].AsString,
            updatedAt = DateTime.UtcNow,
            updatedBy,
            features = resolved
        });
    }
}