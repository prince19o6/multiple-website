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

    private static readonly List<object> CabFleet = new()
    {
        new
        {
            id = "sedan",
            name = "Comfort Executive Sedan",
            model = "Toyota Etios / Suzuki Dzire or equivalent",
            capacity = 4,
            luggage = 2,
            baseMultiplier = 1.0,
            multiplier = 1.0,
            badge = "Most Popular",
            image = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85"
        },
        new
        {
            id = "suv",
            name = "Spacious Multi-Utility SUV",
            model = "Toyota Innova Crysta / Ertiga",
            capacity = 6,
            luggage = 4,
            baseMultiplier = 1.6,
            multiplier = 1.6,
            badge = "Family Choice",
            image = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85"
        },
        new
        {
            id = "luxury",
            name = "VIP Executive Luxury Chauffeur",
            model = "Mercedes E-Class / BMW 5-Series",
            capacity = 3,
            luggage = 3,
            baseMultiplier = 3.2,
            multiplier = 3.2,
            badge = "VIP Luxury",
            image = "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&q=85"
        },
        new
        {
            id = "tempo",
            name = "Group Tempo Traveller (12-16 Seater)",
            model = "Force Tempo Traveller / Executive Coach",
            capacity = 14,
            luggage = 10,
            baseMultiplier = 2.5,
            multiplier = 2.5,
            badge = "Group Travel",
            image = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=85"
        }
    };

    /// <summary>
    /// Search & filter vehicle transfers with pagination and cab fleet multipliers.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTransfers(
        [FromQuery] string? city,
        [FromQuery] string? search,
        [FromQuery] string? q,
        [FromQuery] string? transferType,
        [FromQuery] string? vehicleType,
        [FromQuery] string? category,
        [FromQuery] int? passengers,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filterParams = new TransferFilterParams
        {
            City = city ?? search ?? q,
            TransferType = transferType ?? category,
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
            items = result.Items,
            total = result.Total,
            page = result.Page,
            pageSize = result.PageSize,
            totalPages = result.TotalPages,
            fleet = CabFleet,
            cabFleet = CabFleet,
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
    /// Get the fleet specification with rate multipliers.
    /// </summary>
    [HttpGet("fleet")]
    public IActionResult GetFleet()
    {
        return Ok(new
        {
            success = true,
            data = CabFleet,
            items = CabFleet,
            total = CabFleet.Count
        });
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
            return NotFound(new { success = false, message = $"Transfer service '{slugOrId}' not found" });
        }

        return Ok(new { success = true, data = transfer });
    }
}
