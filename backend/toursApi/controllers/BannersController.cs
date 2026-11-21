using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BannersController : ControllerBase
{
    private readonly IBannerRepository _repo;
    private readonly IWebsiteContext _websiteContext;

    public BannersController(IBannerRepository repo, IWebsiteContext websiteContext)
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
    public async Task<IActionResult> GetBanners([FromQuery] string? module, [FromQuery] bool? activeOnly)
    {
        var active = activeOnly ?? !User.IsInRole("Admin");
        var banners = await _repo.GetBannersAsync(module, active);
        return Ok(new
        {
            success = true,
            count = banners.Count,
            data = banners
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var banner = await _repo.GetByIdAsync(id);
        if (banner == null) return NotFound(new { success = false, error = "Banner not found." });
        return Ok(new { success = true, data = banner });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Create([FromBody] Banner banner)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        if (string.IsNullOrWhiteSpace(banner.Title))
        {
            return BadRequest(new { success = false, error = "Title is required." });
        }

        banner.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var created = await _repo.CreateAsync(banner);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new { success = true, data = created });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] Banner banner)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        banner.Id = id;
        banner.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var updated = await _repo.UpdateAsync(id, banner);
        if (!updated) return NotFound(new { success = false, error = "Banner not found." });

        return Ok(new { success = true, message = "Banner updated successfully.", data = banner });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var deleted = await _repo.DeleteAsync(id);
        if (!deleted) return NotFound(new { success = false, error = "Banner not found." });

        return Ok(new { success = true, message = "Banner deleted successfully." });
    }

    [HttpPut("{id}/toggle-active")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> ToggleActive(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var toggled = await _repo.ToggleActiveAsync(id);
        if (!toggled) return NotFound(new { success = false, error = "Banner not found." });

        return Ok(new { success = true, message = "Banner active status toggled." });
    }

    [HttpPut("reorder")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Reorder([FromBody] List<string> orderedIds)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        await _repo.ReorderAsync(orderedIds);
        return Ok(new { success = true, message = "Banners reordered successfully." });
    }
}
