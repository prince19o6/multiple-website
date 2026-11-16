using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FlightsController : ControllerBase
{
    private readonly IFlightRepository _flightRepository;

    public FlightsController(IFlightRepository flightRepository)
    {
        _flightRepository = flightRepository;
    }

    /// <summary>
    /// Search & filter scheduled flights with pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetFlights(
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] string? date,
        [FromQuery] string? cabinClass,
        [FromQuery] string? airline,
        [FromQuery] bool? nonStop,
        [FromQuery] bool? pureVegMeals,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filterParams = new FlightFilterParams
        {
            From = from,
            To = to,
            Date = date,
            CabinClass = cabinClass,
            Airline = airline,
            NonStopOnly = nonStop,
            PureVegMealsOnly = pureVegMeals,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        var result = await _flightRepository.GetFlightsAsync(filterParams);
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
    /// Get single flight by slug, numeric ID, or route ID.
    /// </summary>
    [HttpGet("{slugOrId}")]
    public async Task<IActionResult> GetFlightBySlug(string slugOrId)
    {
        var flight = await _flightRepository.GetFlightBySlugAsync(slugOrId)
                     ?? await _flightRepository.GetFlightByIdAsync(slugOrId);

        if (flight == null)
        {
            return NotFound(new { success = false, message = "Flight not found" });
        }

        return Ok(new { success = true, data = flight });
    }

    /// <summary>
    /// Get all flights for a specific route (e.g. "delhi-to-mumbai-flights-del-bom").
    /// </summary>
    [HttpGet("route/{routeSlug}")]
    public async Task<IActionResult> GetFlightsByRoute(string routeSlug)
    {
        var flights = await _flightRepository.GetFlightsByRouteAsync(routeSlug);
        return Ok(new { success = true, data = flights, count = flights.Count });
    }

    /// <summary>
    /// Airport autocomplete search.
    /// </summary>
    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string q)
    {
        var results = await _flightRepository.AutocompleteAirportsAsync(q);
        return Ok(new { success = true, data = results });
    }
}

