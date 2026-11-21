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
public class OffersController : ControllerBase
{
    private readonly ISpecialOfferRepository _repo;
    private readonly IWebsiteContext _websiteContext;

    public OffersController(ISpecialOfferRepository repo, IWebsiteContext websiteContext)
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
    public async Task<IActionResult> GetOffers([FromQuery] string? module, [FromQuery] bool? activeOnly)
    {
        var active = activeOnly ?? !User.IsInRole("Admin");
        var offers = await _repo.GetOffersAsync(module, active);
        return Ok(new
        {
            success = true,
            count = offers.Count,
            data = offers
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var offer = await _repo.GetByIdAsync(id);
        if (offer == null) return NotFound(new { success = false, error = "Offer not found." });
        return Ok(new { success = true, data = offer });
    }

    [HttpGet("code/{code}")]
    public async Task<IActionResult> GetByCode(string code)
    {
        var offer = await _repo.GetByCodeAsync(code);
        if (offer == null || !offer.IsActive)
        {
            return NotFound(new { success = false, error = "Promo code is invalid or expired." });
        }
        if (offer.ExpiryDate.HasValue && offer.ExpiryDate.Value < DateTime.UtcNow)
        {
            return BadRequest(new { success = false, error = "Promo code has expired." });
        }
        return Ok(new { success = true, data = offer });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Create([FromBody] SpecialOffer offer)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        if (string.IsNullOrWhiteSpace(offer.Title) || string.IsNullOrWhiteSpace(offer.Code))
        {
            return BadRequest(new { success = false, error = "Title and Code are required." });
        }

        offer.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var created = await _repo.CreateAsync(offer);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new { success = true, data = created });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] SpecialOffer offer)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        offer.Id = id;
        offer.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var updated = await _repo.UpdateAsync(id, offer);
        if (!updated) return NotFound(new { success = false, error = "Offer not found." });

        return Ok(new { success = true, message = "Offer updated successfully.", data = offer });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var deleted = await _repo.DeleteAsync(id);
        if (!deleted) return NotFound(new { success = false, error = "Offer not found." });

        return Ok(new { success = true, message = "Offer deleted successfully." });
    }

    [HttpPut("{id}/toggle-active")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> ToggleActive(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var toggled = await _repo.ToggleActiveAsync(id);
        if (!toggled) return NotFound(new { success = false, error = "Offer not found." });

        return Ok(new { success = true, message = "Offer active status toggled." });
    }
}
