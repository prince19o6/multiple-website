using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RestaurantsController : ControllerBase
{
    private readonly IRestaurantRepository _restaurantRepository;

    public RestaurantsController(IRestaurantRepository restaurantRepository)
    {
        _restaurantRepository = restaurantRepository;
    }

    /// <summary>
    /// Search and filter dining venues with dietary preferences and pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetRestaurants(
        [FromQuery] string? query,
        [FromQuery] string? city,
        [FromQuery] string? cuisine,
        [FromQuery] bool? pureVeg,
        [FromQuery] bool? jain,
        [FromQuery] bool? halal,
        [FromQuery] string? priceRange,
        [FromQuery] double? minCost,
        [FromQuery] double? maxCost,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filterParams = new RestaurantFilterParams
        {
            Query = query,
            City = city,
            Cuisine = cuisine,
            PureVegOnly = pureVeg,
            JainOnly = jain,
            HalalOnly = halal,
            PriceRange = priceRange,
            MinCost = minCost,
            MaxCost = maxCost,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        var result = await _restaurantRepository.GetRestaurantsAsync(filterParams);
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
    /// Get restaurant details by slug or numeric ID.
    /// </summary>
    [HttpGet("{slugOrId}")]
    public async Task<IActionResult> GetRestaurantBySlugOrId(string slugOrId)
    {
        var restaurant = await _restaurantRepository.GetRestaurantBySlugAsync(slugOrId);
        if (restaurant == null)
        {
            restaurant = await _restaurantRepository.GetRestaurantByIdAsync(slugOrId);
        }

        if (restaurant == null)
        {
            return NotFound(new { success = false, message = $"Restaurant '{slugOrId}' not found" });
        }

        return Ok(new
        {
            success = true,
            data = restaurant
        });
    }

    /// <summary>
    /// Autocomplete city destinations.
    /// </summary>
    [HttpGet("autocomplete/cities")]
    public async Task<IActionResult> AutocompleteCities([FromQuery] string? query, [FromQuery] int limit = 8)
    {
        var suggestions = await _restaurantRepository.AutocompleteCitiesAsync(query ?? string.Empty, limit);
        return Ok(new
        {
            success = true,
            data = suggestions
        });
    }

    /// <summary>
    /// Autocomplete restaurant titles.
    /// </summary>
    [HttpGet("autocomplete/names")]
    public async Task<IActionResult> AutocompleteNames([FromQuery] string? query, [FromQuery] int limit = 8)
    {
        var suggestions = await _restaurantRepository.AutocompleteNamesAsync(query ?? string.Empty, limit);
        return Ok(new
        {
            success = true,
            data = suggestions
        });
    }
}

