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
public class ReviewsController : ControllerBase
{
    private readonly IReviewRepository _repo;
    private readonly IWebsiteContext _websiteContext;

    public ReviewsController(IReviewRepository repo, IWebsiteContext websiteContext)
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
    public async Task<IActionResult> GetReviews([FromQuery] string? module, [FromQuery] string? targetId, [FromQuery] bool? activeOnly)
    {
        var active = activeOnly ?? !User.IsInRole("Admin");
        var reviews = await _repo.GetReviewsAsync(module, targetId, active);
        return Ok(new
        {
            success = true,
            count = reviews.Count,
            data = reviews
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var review = await _repo.GetByIdAsync(id);
        if (review == null) return NotFound(new { success = false, error = "Review not found." });
        return Ok(new { success = true, data = review });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Review review)
    {
        if (string.IsNullOrWhiteSpace(review.Author) || string.IsNullOrWhiteSpace(review.Comment))
        {
            return BadRequest(new { success = false, error = "Author and Comment are required." });
        }

        review.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        // If submitted by regular user, verified = false unless submitted by Admin
        if (!User.IsInRole("Admin"))
        {
            review.Verified = false;
        }

        var created = await _repo.CreateAsync(review);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new { success = true, data = created });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] Review review)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        review.Id = id;
        review.WebsiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";
        var updated = await _repo.UpdateAsync(id, review);
        if (!updated) return NotFound(new { success = false, error = "Review not found." });

        return Ok(new { success = true, message = "Review updated successfully.", data = review });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var deleted = await _repo.DeleteAsync(id);
        if (!deleted) return NotFound(new { success = false, error = "Review not found." });

        return Ok(new { success = true, message = "Review deleted successfully." });
    }

    [HttpPut("{id}/toggle-active")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> ToggleActive(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var toggled = await _repo.ToggleActiveAsync(id);
        if (!toggled) return NotFound(new { success = false, error = "Review not found." });

        return Ok(new { success = true, message = "Review active status toggled." });
    }
}
