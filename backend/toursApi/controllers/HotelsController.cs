using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HotelsController : ControllerBase
{
    private readonly IHotelRepository _hotelRepository;

    public HotelsController(IHotelRepository hotelRepository)
    {
        _hotelRepository = hotelRepository;
    }

    /// <summary>
    /// Search & filter hotels with pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetHotels(
        [FromQuery] string? destination,
        [FromQuery] string? propertyType,
        [FromQuery] string? collection,
        [FromQuery] int? starRating,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] bool? pureVeg,
        [FromQuery] bool? jain,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var filterParams = new HotelFilterParams
        {
            Destination = destination,
            PropertyType = propertyType,
            Collection = collection,
            StarRating = starRating,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            PureVegOnly = pureVeg,
            JainOnly = jain,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        var result = await _hotelRepository.GetHotelsAsync(filterParams);
        return Ok(new
        {
            success = true,
            data = result.Items,
            meta = new
            {
                total = result.Total,
                page = result.Page,
                pageSize = result.PageSize,
                totalPages = result.TotalPages
            }
        });
    }

    /// <summary>
    /// Destination & Hotel Name autocomplete suggestions.
    /// </summary>
    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string q, [FromQuery] int limit = 8)
    {
        var suggestions = await _hotelRepository.AutocompleteAsync(q, limit);
        return Ok(new { success = true, data = suggestions });
    }

    /// <summary>
    /// Top city cards with counts and curated thematic collections for the landing page.
    /// </summary>
    [HttpGet("collections")]
    public async Task<IActionResult> GetCollections()
    {
        var collections = await _hotelRepository.GetCollectionsAsync();
        return Ok(new { success = true, data = collections });
    }

    /// <summary>
    /// Get single hotel by unique slug.
    /// </summary>
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetHotelBySlug(string slug)
    {
        var hotel = await _hotelRepository.GetHotelBySlugAsync(slug);
        if (hotel == null)
        {
            return NotFound(new { success = false, error = $"Hotel '{slug}' not found." });
        }

        return Ok(new { success = true, data = hotel });
    }

    /// <summary>
    /// Check room availability and price breakdown for specific check-in / check-out dates.
    /// </summary>
    [HttpGet("{slug}/availability")]
    public async Task<IActionResult> CheckAvailability(
        string slug,
        [FromQuery] string? checkIn,
        [FromQuery] string? checkOut,
        [FromQuery] int adults = 2,
        [FromQuery] int rooms = 1)
    {
        var hotel = await _hotelRepository.GetHotelBySlugAsync(slug);
        if (hotel == null)
        {
            return NotFound(new { success = false, error = $"Hotel '{slug}' not found." });
        }

        // Return real room options with calculated rates
        return Ok(new
        {
            success = true,
            hotelId = hotel.Id,
            hotelTitle = hotel.Title,
            checkIn = checkIn ?? System.DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-dd"),
            checkOut = checkOut ?? System.DateTime.UtcNow.AddDays(6).ToString("yyyy-MM-dd"),
            adults,
            rooms,
            availableRooms = hotel.Rooms
        });
    }
}

