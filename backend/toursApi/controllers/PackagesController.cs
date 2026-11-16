using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PackagesController : ControllerBase
{
    private readonly IPackageRepository _packageRepository;

    public PackagesController(IPackageRepository packageRepository)
    {
        _packageRepository = packageRepository;
    }

    /// <summary>
    /// Search & filter holiday packages with pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPackages(
        [FromQuery] string? destination,
        [FromQuery] string? category,
        [FromQuery] int? durationDays,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] bool? pureVeg,
        [FromQuery] bool? jain,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var filterParams = new PackageFilterParams
        {
            Destination = destination,
            Category = category,
            DurationDays = durationDays,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            PureVegOnly = pureVeg,
            JainOnly = jain,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        var result = await _packageRepository.GetPackagesAsync(filterParams);
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
    /// Destination & Package Name autocomplete suggestions.
    /// </summary>
    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string q, [FromQuery] int limit = 8)
    {
        var suggestions = await _packageRepository.AutocompleteAsync(q, limit);
        return Ok(new { success = true, data = suggestions });
    }

    /// <summary>
    /// Get single package by unique slug or ID.
    /// </summary>
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetPackageBySlug(string slug)
    {
        var package = await _packageRepository.GetPackageBySlugAsync(slug)
                     ?? await _packageRepository.GetPackageByIdAsync(slug);

        if (package == null)
        {
            return NotFound(new { success = false, error = $"Package '{slug}' not found." });
        }

        return Ok(new { success = true, data = package });
    }
}

