using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VisasController : ControllerBase
{
    private readonly IVisaRepository _visaRepository;

    public VisasController(IVisaRepository visaRepository)
    {
        _visaRepository = visaRepository;
    }

    /// <summary>
    /// Search & filter visa packages with pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetVisas(
        [FromQuery] string? search,
        [FromQuery] string? q,
        [FromQuery] string? category,
        [FromQuery] string? country,
        [FromQuery] string? countryCode,
        [FromQuery] string? visaType,
        [FromQuery] string? continent,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filterParams = new VisaFilterParams
        {
            Search = search ?? q,
            Category = category,
            Country = country,
            CountryCode = countryCode,
            VisaType = visaType ?? category,
            Continent = continent,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        var result = await _visaRepository.GetVisasAsync(filterParams);
        return Ok(new
        {
            success = true,
            items = result.Items,
            total = result.Total,
            page = result.Page,
            pageSize = result.PageSize,
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
    /// Get aggregated country summaries with starting price and approval rates.
    /// </summary>
    [HttpGet("countries")]
    public async Task<IActionResult> GetCountrySummaries()
    {
        var summaries = await _visaRepository.GetCountrySummariesAsync();
        return Ok(new
        {
            success = true,
            data = summaries
        });
    }

    /// <summary>
    /// Get all visa options for a destination country.
    /// </summary>
    [HttpGet("country/{countrySlug}")]
    public async Task<IActionResult> GetVisasByCountry(string countrySlug)
    {
        var items = await _visaRepository.GetVisasByCountrySlugAsync(countrySlug);
        if (items.Count == 0)
        {
            return NotFound(new { success = false, message = $"No visa options found for destination '{countrySlug}'" });
        }
        return Ok(new
        {
            success = true,
            data = items
        });
    }

    /// <summary>
    /// Get visa details by slug or numeric ID.
    /// </summary>
    [HttpGet("{slugOrId}")]
    public async Task<IActionResult> GetVisaBySlugOrId(string slugOrId)
    {
        var visa = await _visaRepository.GetVisaBySlugAsync(slugOrId);
        if (visa == null)
        {
            visa = await _visaRepository.GetVisaByIdAsync(slugOrId);
        }

        if (visa == null)
        {
            var countryVisas = await _visaRepository.GetVisasByCountrySlugAsync(slugOrId);
            if (countryVisas.Count > 0)
            {
                var first = countryVisas[0];
                return Ok(new
                {
                    success = true,
                    isCountry = true,
                    country = new
                    {
                        name = first.Country,
                        code = first.CountryCode,
                        slug = first.CountrySlug,
                        flag = first.Flag,
                        continent = first.Continent
                    },
                    data = countryVisas
                });
            }

            return NotFound(new { success = false, message = $"Visa '{slugOrId}' not found" });
        }

        return Ok(new
        {
            success = true,
            data = visa
        });
    }

    /// <summary>
    /// Autocomplete country destinations for the visa search bar.
    /// </summary>
    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string? query, [FromQuery] int limit = 8)
    {
        var suggestions = await _visaRepository.AutocompleteCountriesAsync(query ?? string.Empty, limit);
        return Ok(new
        {
            success = true,
            data = suggestions
        });
    }
}

