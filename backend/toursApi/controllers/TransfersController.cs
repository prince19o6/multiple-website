using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransfersController : ControllerBase
{
    private readonly ITransferRepository _transferRepository;

    public TransfersController(ITransferRepository transferRepository)
    {
        _transferRepository = transferRepository;
    }

    /// <summary>
    /// Search & filter vehicle transfers with pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTransfers(
        [FromQuery] string? city,
        [FromQuery] string? transferType,
        [FromQuery] string? vehicleType,
        [FromQuery] int? passengers,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filterParams = new TransferFilterParams
        {
            City = city,
            TransferType = transferType,
            VehicleType = vehicleType,
            Passengers = passengers,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        var result = await _transferRepository.GetTransfersAsync(filterParams);
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
    /// Get single transfer by slug, numeric ID, or transferId.
    /// </summary>
    [HttpGet("{slugOrId}")]
    public async Task<IActionResult> GetTransferBySlug(string slugOrId)
    {
        var transfer = await _transferRepository.GetTransferBySlugAsync(slugOrId)
                       ?? await _transferRepository.GetTransferByIdAsync(slugOrId);

        if (transfer == null)
        {
            return NotFound(new { success = false, message = "Transfer service not found" });
        }

        return Ok(new { success = true, data = transfer });
    }

    /// <summary>
    /// Autocomplete search for pickup and dropoff points.
    /// </summary>
    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string q)
    {
        var results = await _transferRepository.AutocompleteLocationsAsync(q);
        return Ok(new { success = true, data = results });
    }
}

