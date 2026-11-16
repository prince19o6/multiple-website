using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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
[Route("api/admin/hotels")]
[Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
public class AdminHotelsController : ControllerBase
{
    private readonly IHotelRepository _hotelRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IWebsiteContext _websiteContext;

    public AdminHotelsController(
        IHotelRepository hotelRepository,
        ICategoryRepository categoryRepository,
        IWebsiteContext websiteContext)
    {
        _hotelRepository = hotelRepository;
        _categoryRepository = categoryRepository;
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
    public async Task<IActionResult> GetHotels(
        [FromQuery] string? destination,
        [FromQuery] string? propertyType,
        [FromQuery] string? collection,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var result = await _hotelRepository.GetHotelsAsync(new HotelFilterParams
        {
            Destination = destination,
            PropertyType = propertyType,
            Collection = collection,
            Page = page,
            PageSize = pageSize
        });

        return Ok(new
        {
            success = true,
            data = result.Items,
            meta = new { total = result.Total, page = result.Page, pageSize = result.PageSize, totalPages = result.TotalPages }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetHotelById(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var hotel = await _hotelRepository.GetHotelByIdAsync(id)
            ?? await _hotelRepository.GetHotelBySlugAsync(id);

        if (hotel == null)
        {
            return NotFound(new { success = false, error = "Hotel not found on this website." });
        }

        return Ok(new { success = true, data = hotel });
    }

    [HttpPost]
    public async Task<IActionResult> CreateHotel([FromBody] Hotel hotel)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        if (string.IsNullOrWhiteSpace(hotel.Title))
        {
            return BadRequest(new { success = false, error = "Hotel title is required." });
        }

        hotel.WebsiteId = _websiteContext.CurrentWebsiteId;

        if (string.IsNullOrWhiteSpace(hotel.Slug))
        {
            hotel.Slug = hotel.Title.ToLowerInvariant().Replace(" ", "-");
        }

        await _hotelRepository.CreateHotelAsync(hotel);
        return StatusCode(201, new { success = true, data = hotel, message = "Hotel created successfully." });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateHotel(string id, [FromBody] Hotel hotel)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var existing = await _hotelRepository.GetHotelByIdAsync(id);
        if (existing == null)
        {
            return NotFound(new { success = false, error = "Hotel not found." });
        }

        hotel.Id = id;
        hotel.WebsiteId = _websiteContext.CurrentWebsiteId;
        var updated = await _hotelRepository.UpdateHotelAsync(id, hotel);

        return Ok(new { success = true, data = hotel, message = "Hotel updated successfully." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHotel(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        var deleted = await _hotelRepository.DeleteHotelAsync(id);
        if (!deleted)
        {
            return NotFound(new { success = false, error = "Hotel not found." });
        }

        return Ok(new { success = true, message = "Hotel deleted successfully." });
    }
}
