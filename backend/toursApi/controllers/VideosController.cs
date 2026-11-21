using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VideosController : ControllerBase
{
    private readonly ITravelVideoRepository _repo;
    private readonly IWebsiteContext _websiteContext;

    public VideosController(ITravelVideoRepository repo, IWebsiteContext websiteContext)
    {
        _repo = repo;
        _websiteContext = websiteContext;
    }

    private bool ValidateTenantAccess(out IActionResult? forbiddenResult)
    {
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;
        var tokenWebsiteId = User.FindFirst("websiteId")?.Value;

        if (!string.Equals(tokenWebsiteId, currentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            forbiddenResult = StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                error = "Access denied: session belongs to a different website tenant."
            });
            return false;
        }

        forbiddenResult = null;
        return true;
    }

    [HttpGet]
    public async Task<IActionResult> GetVideos([FromQuery] string? module, [FromQuery] string? destination, [FromQuery] bool? activeOnly)
    {
        var active = activeOnly ?? !User.IsInRole("Admin");
        var videos = await _repo.GetVideosAsync(module, destination, active);
        return Ok(new
        {
            success = true,
            count = videos.Count,
            data = videos
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var video = await _repo.GetByIdAsync(id);
        if (video == null) return NotFound(new { success = false, error = "Video not found." });
        return Ok(new { success = true, data = video });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Create([FromBody] TravelVideo video)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        if (string.IsNullOrWhiteSpace(video.Title) || string.IsNullOrWhiteSpace(video.VideoUrl))
        {
            return BadRequest(new { success = false, error = "Title and VideoUrl are required." });
        }

        video.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var created = await _repo.CreateAsync(video);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new { success = true, data = created });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] TravelVideo video)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        video.Id = id;
        video.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var updated = await _repo.UpdateAsync(id, video);
        if (!updated) return NotFound(new { success = false, error = "Video not found." });

        return Ok(new { success = true, message = "Video updated successfully.", data = video });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var deleted = await _repo.DeleteAsync(id);
        if (!deleted) return NotFound(new { success = false, error = "Video not found." });

        return Ok(new { success = true, message = "Video deleted successfully." });
    }

    [HttpPut("{id}/toggle-active")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> ToggleActive(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var toggled = await _repo.ToggleActiveAsync(id);
        if (!toggled) return NotFound(new { success = false, error = "Video not found." });

        return Ok(new { success = true, message = "Video active status toggled." });
    }
}
