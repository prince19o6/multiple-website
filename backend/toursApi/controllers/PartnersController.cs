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
public class PartnersController : ControllerBase
{
    private readonly IPartnerRepository _repo;
    private readonly IWebsiteContext _websiteContext;

    public PartnersController(IPartnerRepository repo, IWebsiteContext websiteContext)
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
    public async Task<IActionResult> GetPartners([FromQuery] string? category, [FromQuery] bool? activeOnly)
    {
        var active = activeOnly ?? !User.IsInRole("Admin");
        var partners = await _repo.GetPartnersAsync(category, active);
        return Ok(new
        {
            success = true,
            count = partners.Count,
            data = partners
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var partner = await _repo.GetByIdAsync(id);
        if (partner == null) return NotFound(new { success = false, error = "Partner not found." });
        return Ok(new { success = true, data = partner });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Create([FromBody] Partner partner)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        if (string.IsNullOrWhiteSpace(partner.Name) || string.IsNullOrWhiteSpace(partner.LogoUrl))
        {
            return BadRequest(new { success = false, error = "Name and LogoUrl are required." });
        }

        partner.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var created = await _repo.CreateAsync(partner);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new { success = true, data = created });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] Partner partner)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        partner.Id = id;
        partner.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var updated = await _repo.UpdateAsync(id, partner);
        if (!updated) return NotFound(new { success = false, error = "Partner not found." });

        return Ok(new { success = true, message = "Partner updated successfully.", data = partner });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var deleted = await _repo.DeleteAsync(id);
        if (!deleted) return NotFound(new { success = false, error = "Partner not found." });

        return Ok(new { success = true, message = "Partner deleted successfully." });
    }

    [HttpPut("{id}/toggle-active")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> ToggleActive(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var toggled = await _repo.ToggleActiveAsync(id);
        if (!toggled) return NotFound(new { success = false, error = "Partner not found." });

        return Ok(new { success = true, message = "Partner active status toggled." });
    }
}
