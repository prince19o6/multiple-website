using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using ToursApi.Repositories;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityRepository _activityRepository;

    public ActivitiesController(IActivityRepository activityRepository)
    {
        _activityRepository = activityRepository;
    }

    /// <summary>
    /// Search & filter activities with pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetActivities(
        [FromQuery] string? search,
        [FromQuery] string? q,
        [FromQuery] string? category,
        [FromQuery] string? destination,
        [FromQuery] string? city,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] bool? pureVeg,
        [FromQuery] bool? jain,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filterParams = new ActivityFilterParams
        {
            Search = search ?? q,
            Category = category,
            Destination = destination,
            City = city,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            PureVegOnly = pureVeg,
            JainOnly = jain,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        var result = await _activityRepository.GetActivitiesAsync(filterParams);
        return Ok(new
        {
            items = result.Items,
            total = result.Total,
            page = result.Page,
            pageSize = result.PageSize,
            totalPages = result.TotalPages,
            success = true,
            data = result.Items
        });
    }

    /// <summary>
    /// Get activity categories.
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _activityRepository.GetCategoriesAsync();
        return Ok(new
        {
            success = true,
            data = categories
        });
    }

    /// <summary>
    /// Get single activity by slug or ID.
    /// </summary>
    [HttpGet("{idOrSlug}")]
    public async Task<IActionResult> GetActivity(string idOrSlug)
    {
        var activity = await _activityRepository.GetActivityByIdOrSlugAsync(idOrSlug);
        if (activity == null)
        {
            return NotFound(new
            {
                success = false,
                message = $"Activity '{idOrSlug}' not found."
            });
        }

        return Ok(new
        {
            success = true,
            data = activity
        });
    }
}
