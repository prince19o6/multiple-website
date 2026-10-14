using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Bson.IO;
using System.Security.Claims;
using System.Text.Json;
using ToursApi.Configuration;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/admin/website-config")]
[Authorize(Roles = "Admin")]
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
}