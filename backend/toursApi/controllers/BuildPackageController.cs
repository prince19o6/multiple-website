using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BuildPackageController : ControllerBase
{
    private readonly IBuildPackageRepository _buildPackageRepository;

    public BuildPackageController(IBuildPackageRepository buildPackageRepository)
    {
        _buildPackageRepository = buildPackageRepository;
    }

    /// <summary>
    /// Search and list customizable package destination templates.
    /// </summary>
    [HttpGet("options")]
    public async Task<IActionResult> GetOptions(
        [FromQuery] string? query,
        [FromQuery] string? country,
        [FromQuery] bool? popular,
        [FromQuery] bool? featured,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filterParams = new BuildPackageFilterParams
        {
            Query = query,
            Country = country,
            PopularOnly = popular,
            FeaturedOnly = featured,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        var result = await _buildPackageRepository.GetBuildPackageOptionsAsync(filterParams);
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
    /// Get a single destination template by slug or identifier with all customizable components.
    /// </summary>
    [HttpGet("options/{slugOrId}")]
    public async Task<IActionResult> GetOptionDetails(string slugOrId)
    {
        var option = await _buildPackageRepository.GetBuildPackageOptionBySlugAsync(slugOrId);
        if (option == null)
        {
            option = await _buildPackageRepository.GetBuildPackageOptionByIdAsync(slugOrId);
        }

        if (option == null)
        {
            return NotFound(new { success = false, message = $"Build package destination '{slugOrId}' not found." });
        }

        return Ok(new
        {
            success = true,
            data = option
        });
    }

    /// <summary>
    /// Autocomplete destinations for the custom package builder search input.
    /// </summary>
    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string? query, [FromQuery] int limit = 8)
    {
        var list = await _buildPackageRepository.AutocompleteDestinationsAsync(query ?? string.Empty, limit);
        return Ok(new
        {
            success = true,
            data = list
        });
    }
}

