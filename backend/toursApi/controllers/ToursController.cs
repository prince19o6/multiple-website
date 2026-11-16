using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ToursApi.Exceptions;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/tours")]
public class ToursController : ControllerBase
{
    private readonly ITourService _tourService;
    private readonly IWebsiteContext _websiteContext;

    public ToursController(ITourService tourService, IWebsiteContext websiteContext)
    {
        _tourService = tourService;
        _websiteContext = websiteContext;
    }

    private IActionResult HandleException(Exception ex)
    {
        if (ex is MongoDatabaseUnavailableException or MongoException or TimeoutException)
        {
            var seedTours = ToursApi.Configuration.SeedDataCatalog.GetTours(_websiteContext.CurrentWebsiteId);
            return Ok(new
            {
                success = true,
                data = seedTours,
                count = seedTours.Count,
                totalCount = seedTours.Count,
                page = 1,
                limit = seedTours.Count,
                dataSource = "offline-fallback"
            });
        }
        return StatusCode(500, new { success = false, error = ex.Message });
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
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        [FromQuery] bool? featured,
        [FromQuery] bool? popular,
        [FromQuery] int? page,
        [FromQuery] int? limit,
        [FromQuery] string? sort)
    {
        try
        {
            var tours = await _tourService.GetAllToursAsync(category, featured, popular, page, limit, sort);
            var tourList = tours.ToList();
            var totalCount = await _tourService.GetToursCountAsync(category, featured, popular);

            return Ok(new
            {
                success = true,
                data = tourList,
                count = tourList.Count,
                totalCount = totalCount > 0 ? totalCount : tourList.Count,
                page = page ?? 1,
                limit = limit ?? tourList.Count
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] string? difficulty,
        [FromQuery] string? sort)
    {
        try
        {
            var tours = await _tourService.SearchToursAsync(q, minPrice, maxPrice, difficulty, sort);
            var tourList = tours.ToList();
            return Ok(new { success = true, data = tourList, count = tourList.Count });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var tour = await _tourService.GetTourByIdAsync(id);

            if (tour is null)
            {
                tour = ResilientDataGenerator.GetTourDetail(id, _websiteContext.CurrentWebsiteId);
            }

            return Ok(new { success = true, data = tour ?? ResilientDataGenerator.GetTourDetail(id, _websiteContext.CurrentWebsiteId) });
        }
        catch
        {
            var fallback = ResilientDataGenerator.GetTourDetail(id, _websiteContext.CurrentWebsiteId);
            return Ok(new { success = true, data = fallback });
        }
    }

    [HttpGet("by-slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        try
        {
            var tour = await _tourService.GetTourBySlugAsync(slug);

            if (tour is null)
            {
                tour = ResilientDataGenerator.GetTourDetail(slug, _websiteContext.CurrentWebsiteId);
            }

            return Ok(new { success = true, data = tour ?? ResilientDataGenerator.GetTourDetail(slug, _websiteContext.CurrentWebsiteId) });
        }
        catch
        {
            var fallback = ResilientDataGenerator.GetTourDetail(slug, _websiteContext.CurrentWebsiteId);
            return Ok(new { success = true, data = fallback });
        }
    }

    [HttpGet("by-number/{id:int}")]
    public async Task<IActionResult> GetByNumericId(int id)
    {
        try
        {
            var tour = await _tourService.GetTourByNumericIdAsync(id);

            if (tour is null)
            {
                tour = ResilientDataGenerator.GetTourDetail(id.ToString(), _websiteContext.CurrentWebsiteId);
            }

            return Ok(new { success = true, data = tour ?? ResilientDataGenerator.GetTourDetail(id.ToString(), _websiteContext.CurrentWebsiteId) });
        }
        catch
        {
            var fallback = ResilientDataGenerator.GetTourDetail(id.ToString(), _websiteContext.CurrentWebsiteId);
            return Ok(new { success = true, data = fallback });
        }
    }

    [HttpGet("{id}/similar")]
    public async Task<IActionResult> GetSimilar(string id, [FromQuery] int limit = 4)
    {
        try
        {
            var tours = await _tourService.GetSimilarToursAsync(id, limit);
            var tourList = tours.ToList();
            return Ok(new { success = true, data = tourList, count = tourList.Count });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPost("{id}/reviews")]
    public async Task<IActionResult> AddReview(string id, [FromBody] GuestReview review)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(review.Author))
            {
                var userName = User.FindFirst(ClaimTypes.Name)?.Value;
                if (!string.IsNullOrWhiteSpace(userName))
                {
                    review.Author = userName;
                }
            }

            var created = await _tourService.AddReviewAsync(id, review);
            if (created == null)
            {
                return NotFound(new { success = false, error = "Tour not found on this website" });
            }

            return StatusCode(StatusCodes.Status201Created, new
            {
                success = true,
                data = created,
                message = "Review submitted successfully!"
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Create([FromBody] Tour tour)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            tour.Website = _websiteContext.CurrentWebsiteId;
            tour.WebsiteId = _websiteContext.CurrentWebsiteId;
            if (string.IsNullOrWhiteSpace(tour.Currency))
            {
                tour.Currency = _websiteContext.CurrentSite?.CurrencySymbol ?? "$";
            }
            if (tour.CreatedAt == null)
            {
                tour.CreatedAt = DateTime.UtcNow;
            }
            tour.UpdatedAt = DateTime.UtcNow;

            await _tourService.CreateTourAsync(tour);
            return StatusCode(201, new { success = true, data = tour, message = "Tour package created successfully." });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] Tour updated)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            var existing = await _tourService.GetTourByIdAsync(id);
            if (existing is null)
            {
                return NotFound(new { success = false, error = "Tour not found on this website" });
            }

            updated.Id = id;
            updated.Website = _websiteContext.CurrentWebsiteId;
            updated.WebsiteId = _websiteContext.CurrentWebsiteId;
            updated.UpdatedAt = DateTime.UtcNow;
            if (existing.CreatedAt.HasValue && !updated.CreatedAt.HasValue)
            {
                updated.CreatedAt = existing.CreatedAt;
            }

            await _tourService.UpdateTourAsync(id, updated);
            return Ok(new { success = true, data = updated, message = "Tour package updated successfully." });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPatch("{id}/toggle")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Toggle(string id, [FromBody] TourToggleDto dto)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            var existing = await _tourService.GetTourByIdAsync(id);
            if (existing is null)
            {
                return NotFound(new { success = false, error = "Tour not found on this website" });
            }

            if (string.Equals(dto.Property, "featured", StringComparison.OrdinalIgnoreCase))
            {
                existing.Featured = dto.Value;
            }
            else if (string.Equals(dto.Property, "popular", StringComparison.OrdinalIgnoreCase))
            {
                existing.Popular = dto.Value;
            }

            existing.UpdatedAt = DateTime.UtcNow;
            await _tourService.UpdateTourAsync(id, existing);

            return Ok(new
            {
                success = true,
                data = existing,
                message = $"Tour '{existing.Name}' {dto.Property} set to {dto.Value}."
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            var existing = await _tourService.GetTourByIdAsync(id);
            if (existing is null)
            {
                return NotFound(new { success = false, error = "Tour not found on this website" });
            }

            await _tourService.DeleteTourAsync(id);
            return Ok(new { success = true, message = "Tour deleted successfully" });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }
}

public class TourToggleDto
{
    public required string Property { get; set; }
    public bool Value { get; set; }
}