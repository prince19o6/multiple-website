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
public class PagesController : ControllerBase
{
    private readonly IStaticPageRepository _repo;
    private readonly IWebsiteContext _websiteContext;

    public PagesController(IStaticPageRepository repo, IWebsiteContext websiteContext)
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
    public async Task<IActionResult> GetAllPages([FromQuery] bool? activeOnly)
    {
        var active = activeOnly ?? !User.IsInRole("Admin");
        var pages = await _repo.GetAllPagesAsync(active);
        return Ok(new
        {
            success = true,
            count = pages.Count,
            data = pages
        });
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var page = await _repo.GetBySlugAsync(slug);
        if (page == null) return NotFound(new { success = false, error = $"Page '{slug}' not found." });
        return Ok(new { success = true, data = page });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Create([FromBody] StaticPage page)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        if (string.IsNullOrWhiteSpace(page.Slug) || string.IsNullOrWhiteSpace(page.Title))
        {
            return BadRequest(new { success = false, error = "Slug and Title are required." });
        }

        page.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var created = await _repo.CreateAsync(page);
        return CreatedAtAction(nameof(GetBySlug), new { slug = created.Slug }, new { success = true, data = created });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] StaticPage page)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        page.Id = id;
        page.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var updated = await _repo.UpdateAsync(id, page);
        if (!updated) return NotFound(new { success = false, error = "Page not found." });

        return Ok(new { success = true, message = "Page updated successfully.", data = page });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var deleted = await _repo.DeleteAsync(id);
        if (!deleted) return NotFound(new { success = false, error = "Page not found." });

        return Ok(new { success = true, message = "Page deleted successfully." });
    }
}
