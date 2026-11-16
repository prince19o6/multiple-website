using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/admin/catalog")]
[Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
public class AdminCatalogController : ControllerBase
{
    private readonly ITourRepository _tourRepo;
    private readonly IHotelRepository _hotelRepo;
    private readonly IFlightRepository _flightRepo;
    private readonly ITransferRepository _transferRepo;
    private readonly IVisaRepository _visaRepo;
    private readonly IRestaurantRepository _restaurantRepo;
    private readonly IPackageRepository _packageRepo;
    private readonly IBuildPackageRepository _buildPackageRepo;
    private readonly IWebsiteContext _websiteContext;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AdminCatalogController> _logger;

    public AdminCatalogController(
        ITourRepository tourRepo,
        IHotelRepository hotelRepo,
        IFlightRepository flightRepo,
        ITransferRepository transferRepo,
        IVisaRepository visaRepo,
        IRestaurantRepository restaurantRepo,
        IPackageRepository packageRepo,
        IBuildPackageRepository buildPackageRepo,
        IWebsiteContext websiteContext,
        IWebHostEnvironment env,
        ILogger<AdminCatalogController> logger)
    {
        _tourRepo = tourRepo;
        _hotelRepo = hotelRepo;
        _flightRepo = flightRepo;
        _transferRepo = transferRepo;
        _visaRepo = visaRepo;
        _restaurantRepo = restaurantRepo;
        _packageRepo = packageRepo;
        _buildPackageRepo = buildPackageRepo;
        _websiteContext = websiteContext;
        _env = env;
        _logger = logger;
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

    private static string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Guid.NewGuid().ToString("N")[..8];
        var clean = Regex.Replace(text.ToLowerInvariant().Trim(), @"[^a-z0-9\s-]", "");
        clean = Regex.Replace(clean, @"\s+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(clean) ? Guid.NewGuid().ToString("N")[..8] : clean;
    }

    // ─── 1. Query Catalog by Module ─────────────────────────────────────────────
    [HttpGet("{module}")]
    public async Task<IActionResult> GetModuleItems(
        string module,
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;
        var mod = module.Trim().ToLowerInvariant();

        try
        {
            switch (mod)
            {
                case "hotels":
                case "hotel":
                {
                    var res = await _hotelRepo.GetHotelsAsync(new HotelFilterParams
                    {
                        Destination = category,
                        Page = page,
                        PageSize = pageSize
                    });
                    var items = res.Items;
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var q = search.Trim();
                        items = items.Where(h =>
                            (h.Title?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (h.Destination?.CityName?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (h.Slug?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
                    }
                    return Ok(new { success = true, module = "hotels", data = items, total = res.Total, page, pageSize });
                }

                case "tours":
                case "tour":
                {
                    var allTours = (await _tourRepo.GetAllAsync()).ToList();
                    if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
                    {
                        allTours = allTours.Where(t => string.Equals(t.Category, category, StringComparison.OrdinalIgnoreCase)).ToList();
                    }
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var q = search.Trim();
                        allTours = allTours.Where(t =>
                            (t.Name?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (t.Destination?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (t.Slug?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
                    }
                    var total = allTours.Count;
                    var paged = allTours.Skip((page - 1) * pageSize).Take(pageSize).ToList();
                    return Ok(new { success = true, module = "tours", data = paged, total, page, pageSize });
                }

                case "flights":
                case "flight":
                {
                    var res = await _flightRepo.GetFlightsAsync(new FlightFilterParams
                    {
                        Airline = category,
                        Page = page,
                        PageSize = pageSize
                    });
                    var items = res.Items;
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var q = search.Trim();
                        items = items.Where(f =>
                            (f.Airline?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (f.FlightNumber?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (f.FromAirport?.City?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (f.ToAirport?.City?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
                    }
                    return Ok(new { success = true, module = "flights", data = items, total = res.Total, page, pageSize });
                }

                case "transfers":
                case "transfer":
                {
                    var res = await _transferRepo.GetTransfersAsync(new TransferFilterParams
                    {
                        TransferType = category,
                        Page = page,
                        PageSize = pageSize
                    });
                    var items = res.Items;
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var q = search.Trim();
                        items = items.Where(t =>
                            (t.Name?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (t.City?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (t.VehicleType?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
                    }
                    return Ok(new { success = true, module = "transfers", data = items, total = res.Total, page, pageSize });
                }

                case "visas":
                case "visa":
                {
                    var res = await _visaRepo.GetVisasAsync(new VisaFilterParams
                    {
                        Continent = category,
                        Page = page,
                        PageSize = pageSize
                    });
                    var items = res.Items;
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var q = search.Trim();
                        items = items.Where(v =>
                            (v.Country?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (v.Title?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (v.VisaType?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
                    }
                    return Ok(new { success = true, module = "visas", data = items, total = res.Total, page, pageSize });
                }

                case "restaurants":
                case "restaurant":
                {
                    var res = await _restaurantRepo.GetRestaurantsAsync(new RestaurantFilterParams
                    {
                        Cuisine = category,
                        Page = page,
                        PageSize = pageSize
                    });
                    var items = res.Items;
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var q = search.Trim();
                        items = items.Where(r =>
                            (r.Name?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (r.City?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (r.Cuisine?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
                    }
                    return Ok(new { success = true, module = "restaurants", data = items, total = res.Total, page, pageSize });
                }

                case "packages":
                case "package":
                {
                    var res = await _packageRepo.GetPackagesAsync(new PackageFilterParams
                    {
                        Category = category,
                        Page = page,
                        PageSize = pageSize
                    });
                    var items = res.Items;
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var q = search.Trim();
                        items = items.Where(p =>
                            (p.Title?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (p.Destination?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (p.Slug?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
                    }
                    return Ok(new { success = true, module = "packages", data = items, total = res.Total, page, pageSize });
                }

                case "buildpackage":
                case "custom":
                {
                    var res = await _buildPackageRepo.GetBuildPackageOptionsAsync(new BuildPackageFilterParams
                    {
                        Country = category,
                        Page = page,
                        PageSize = pageSize
                    });
                    var items = res.Items;
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var q = search.Trim();
                        items = items.Where(b =>
                            (b.DestinationName?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (b.Country?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false) ||
                            (b.DestinationSlug?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false)).ToList();
                    }
                    return Ok(new { success = true, module = "buildpackage", data = items, total = res.Total, page, pageSize });
                }

                default:
                    return BadRequest(new { success = false, error = $"Unknown module '{module}'. Supported modules: hotels, tours, flights, transfers, visas, restaurants, packages, buildpackage." });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load catalog items for module {Module}", module);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 2. Get Single Catalog Item ─────────────────────────────────────────────
    [HttpGet("{module}/{id}")]
    public async Task<IActionResult> GetItemById(string module, string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;
        var mod = module.Trim().ToLowerInvariant();

        try
        {
            object? item = mod switch
            {
                "hotels" or "hotel" => await _hotelRepo.GetHotelByIdAsync(id) ?? await _hotelRepo.GetHotelBySlugAsync(id),
                "tours" or "tour" => await _tourRepo.GetByIdAsync(id) ?? await _tourRepo.GetBySlugAsync(id),
                "flights" or "flight" => await _flightRepo.GetFlightByIdAsync(id) ?? await _flightRepo.GetFlightBySlugAsync(id),
                "transfers" or "transfer" => await _transferRepo.GetTransferByIdAsync(id) ?? await _transferRepo.GetTransferBySlugAsync(id),
                "visas" or "visa" => await _visaRepo.GetVisaByIdAsync(id) ?? await _visaRepo.GetVisaBySlugAsync(id),
                "restaurants" or "restaurant" => await _restaurantRepo.GetRestaurantByIdAsync(id) ?? await _restaurantRepo.GetRestaurantBySlugAsync(id),
                "packages" or "package" => await _packageRepo.GetPackageByIdAsync(id) ?? await _packageRepo.GetPackageBySlugAsync(id),
                "buildpackage" or "custom" => await _buildPackageRepo.GetBuildPackageOptionByIdAsync(id) ?? await _buildPackageRepo.GetBuildPackageOptionBySlugAsync(id),
                _ => null
            };

            if (item == null)
            {
                return NotFound(new { success = false, error = $"Item '{id}' not found in module '{module}'." });
            }

            return Ok(new { success = true, data = item });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 3. Create Catalog Item ─────────────────────────────────────────────────
    [HttpPost("{module}")]
    public async Task<IActionResult> CreateItem(string module, [FromBody] JsonElement payload)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;
        var mod = module.Trim().ToLowerInvariant();
        var rawJson = payload.GetRawText();
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;

        try
        {
            switch (mod)
            {
                case "hotels" or "hotel":
                {
                    var hotel = JsonSerializer.Deserialize<Hotel>(rawJson) ?? new Hotel();
                    if (string.IsNullOrWhiteSpace(hotel.Title)) return BadRequest(new { success = false, error = "Title is required for hotel." });
                    hotel.WebsiteId = currentWebsiteId;
                    if (string.IsNullOrWhiteSpace(hotel.Slug)) hotel.Slug = GenerateSlug(hotel.Title);
                    hotel.CreatedAt = DateTime.UtcNow;
                    await _hotelRepo.CreateHotelAsync(hotel);
                    return StatusCode(201, new { success = true, data = hotel, message = "Hotel created successfully." });
                }

                case "tours" or "tour":
                {
                    var tour = JsonSerializer.Deserialize<Tour>(rawJson) ?? new Tour();
                    if (string.IsNullOrWhiteSpace(tour.Name)) return BadRequest(new { success = false, error = "Name is required for tour." });
                    tour.WebsiteId = currentWebsiteId;
                    tour.Website = currentWebsiteId;
                    if (string.IsNullOrWhiteSpace(tour.Slug)) tour.Slug = GenerateSlug(tour.Name);
                    tour.CreatedAt = DateTime.UtcNow;
                    tour.UpdatedAt = DateTime.UtcNow;
                    await _tourRepo.CreateAsync(tour);
                    return StatusCode(201, new { success = true, data = tour, message = "Tour created successfully." });
                }

                case "flights" or "flight":
                {
                    var flight = JsonSerializer.Deserialize<Flight>(rawJson) ?? new Flight();
                    if (string.IsNullOrWhiteSpace(flight.FlightNumber)) return BadRequest(new { success = false, error = "Flight number is required." });
                    flight.WebsiteId = currentWebsiteId;
                    if (string.IsNullOrWhiteSpace(flight.Slug)) flight.Slug = GenerateSlug($"{flight.Airline}-{flight.FlightNumber}");
                    if (flight.AvailableSeats <= 0) flight.AvailableSeats = 20;
                    flight.CreatedAt = DateTime.UtcNow;
                    await _flightRepo.CreateFlightAsync(flight);
                    return StatusCode(201, new { success = true, data = flight, message = "Flight created successfully." });
                }

                case "transfers" or "transfer":
                {
                    var transfer = JsonSerializer.Deserialize<Transfer>(rawJson) ?? new Transfer();
                    if (string.IsNullOrWhiteSpace(transfer.Name)) return BadRequest(new { success = false, error = "Name is required for transfer." });
                    transfer.WebsiteId = currentWebsiteId;
                    if (string.IsNullOrWhiteSpace(transfer.Slug)) transfer.Slug = GenerateSlug(transfer.Name);
                    transfer.CreatedAt = DateTime.UtcNow;
                    await _transferRepo.CreateTransferAsync(transfer);
                    return StatusCode(201, new { success = true, data = transfer, message = "Transfer created successfully." });
                }

                case "visas" or "visa":
                {
                    var visa = JsonSerializer.Deserialize<Visa>(rawJson) ?? new Visa();
                    if (string.IsNullOrWhiteSpace(visa.Country) && string.IsNullOrWhiteSpace(visa.Title)) return BadRequest(new { success = false, error = "Country/Title is required for visa." });
                    visa.WebsiteId = currentWebsiteId;
                    if (string.IsNullOrWhiteSpace(visa.Slug)) visa.Slug = GenerateSlug($"{visa.Country}-{visa.VisaType}");
                    visa.CreatedAt = DateTime.UtcNow;
                    await _visaRepo.CreateVisaAsync(visa);
                    return StatusCode(201, new { success = true, data = visa, message = "Visa service created successfully." });
                }

                case "restaurants" or "restaurant":
                {
                    var restaurant = JsonSerializer.Deserialize<Restaurant>(rawJson) ?? new Restaurant();
                    if (string.IsNullOrWhiteSpace(restaurant.Name)) return BadRequest(new { success = false, error = "Name is required for restaurant." });
                    restaurant.WebsiteId = currentWebsiteId;
                    if (string.IsNullOrWhiteSpace(restaurant.Slug)) restaurant.Slug = GenerateSlug(restaurant.Name);
                    restaurant.CreatedAt = DateTime.UtcNow;
                    await _restaurantRepo.CreateRestaurantAsync(restaurant);
                    return StatusCode(201, new { success = true, data = restaurant, message = "Restaurant created successfully." });
                }

                case "packages" or "package":
                {
                    var package = JsonSerializer.Deserialize<Package>(rawJson) ?? new Package();
                    if (string.IsNullOrWhiteSpace(package.Title)) return BadRequest(new { success = false, error = "Title is required for package." });
                    package.WebsiteId = currentWebsiteId;
                    if (string.IsNullOrWhiteSpace(package.Slug)) package.Slug = GenerateSlug(package.Title);
                    package.CreatedAt = DateTime.UtcNow;
                    await _packageRepo.CreatePackageAsync(package);
                    return StatusCode(201, new { success = true, data = package, message = "Holiday package created successfully." });
                }

                case "buildpackage" or "custom":
                {
                    var option = JsonSerializer.Deserialize<BuildPackageOption>(rawJson) ?? new BuildPackageOption();
                    if (string.IsNullOrWhiteSpace(option.DestinationName)) return BadRequest(new { success = false, error = "Destination name is required for build package option." });
                    option.WebsiteId = currentWebsiteId;
                    if (string.IsNullOrWhiteSpace(option.DestinationSlug)) option.DestinationSlug = GenerateSlug(option.DestinationName);
                    option.CreatedAt = DateTime.UtcNow;
                    await _buildPackageRepo.CreateBuildPackageOptionAsync(option);
                    return StatusCode(201, new { success = true, data = option, message = "Build package destination created successfully." });
                }

                default:
                    return BadRequest(new { success = false, error = $"Unknown module '{module}'." });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create catalog item in module {Module}", module);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 4. Update Catalog Item ─────────────────────────────────────────────────
    [HttpPut("{module}/{id}")]
    public async Task<IActionResult> UpdateItem(string module, string id, [FromBody] JsonElement payload)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;
        var mod = module.Trim().ToLowerInvariant();
        var rawJson = payload.GetRawText();
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;

        try
        {
            switch (mod)
            {
                case "hotels" or "hotel":
                {
                    var hotel = JsonSerializer.Deserialize<Hotel>(rawJson) ?? new Hotel();
                    hotel.Id = id;
                    hotel.WebsiteId = currentWebsiteId;
                    var ok = await _hotelRepo.UpdateHotelAsync(id, hotel);
                    if (!ok) return NotFound(new { success = false, error = "Hotel not found or update failed." });
                    return Ok(new { success = true, data = hotel, message = "Hotel updated successfully." });
                }

                case "tours" or "tour":
                {
                    var tour = JsonSerializer.Deserialize<Tour>(rawJson) ?? new Tour();
                    tour.Id = id;
                    tour.WebsiteId = currentWebsiteId;
                    tour.Website = currentWebsiteId;
                    tour.UpdatedAt = DateTime.UtcNow;
                    await _tourRepo.UpdateAsync(id, tour);
                    return Ok(new { success = true, data = tour, message = "Tour updated successfully." });
                }

                case "flights" or "flight":
                {
                    var flight = JsonSerializer.Deserialize<Flight>(rawJson) ?? new Flight();
                    flight.Id = id;
                    flight.WebsiteId = currentWebsiteId;
                    var ok = await _flightRepo.UpdateFlightAsync(id, flight);
                    if (!ok) return NotFound(new { success = false, error = "Flight not found or update failed." });
                    return Ok(new { success = true, data = flight, message = "Flight updated successfully." });
                }

                case "transfers" or "transfer":
                {
                    var transfer = JsonSerializer.Deserialize<Transfer>(rawJson) ?? new Transfer();
                    transfer.Id = id;
                    transfer.WebsiteId = currentWebsiteId;
                    var ok = await _transferRepo.UpdateTransferAsync(id, transfer);
                    if (!ok) return NotFound(new { success = false, error = "Transfer not found or update failed." });
                    return Ok(new { success = true, data = transfer, message = "Transfer updated successfully." });
                }

                case "visas" or "visa":
                {
                    var visa = JsonSerializer.Deserialize<Visa>(rawJson) ?? new Visa();
                    visa.Id = id;
                    visa.WebsiteId = currentWebsiteId;
                    var ok = await _visaRepo.UpdateVisaAsync(id, visa);
                    if (!ok) return NotFound(new { success = false, error = "Visa not found or update failed." });
                    return Ok(new { success = true, data = visa, message = "Visa service updated successfully." });
                }

                case "restaurants" or "restaurant":
                {
                    var restaurant = JsonSerializer.Deserialize<Restaurant>(rawJson) ?? new Restaurant();
                    restaurant.Id = id;
                    restaurant.WebsiteId = currentWebsiteId;
                    var ok = await _restaurantRepo.UpdateRestaurantAsync(id, restaurant);
                    if (!ok) return NotFound(new { success = false, error = "Restaurant not found or update failed." });
                    return Ok(new { success = true, data = restaurant, message = "Restaurant updated successfully." });
                }

                case "packages" or "package":
                {
                    var package = JsonSerializer.Deserialize<Package>(rawJson) ?? new Package();
                    package.Id = id;
                    package.WebsiteId = currentWebsiteId;
                    var ok = await _packageRepo.UpdatePackageAsync(id, package);
                    if (!ok) return NotFound(new { success = false, error = "Package not found or update failed." });
                    return Ok(new { success = true, data = package, message = "Holiday package updated successfully." });
                }

                case "buildpackage" or "custom":
                {
                    var option = JsonSerializer.Deserialize<BuildPackageOption>(rawJson) ?? new BuildPackageOption();
                    option.Id = id;
                    option.WebsiteId = currentWebsiteId;
                    var ok = await _buildPackageRepo.UpdateBuildPackageOptionAsync(id, option);
                    if (!ok) return NotFound(new { success = false, error = "Build package option not found or update failed." });
                    return Ok(new { success = true, data = option, message = "Build package destination updated successfully." });
                }

                default:
                    return BadRequest(new { success = false, error = $"Unknown module '{module}'." });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update catalog item in module {Module}", module);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 5. Delete Catalog Item ─────────────────────────────────────────────────
    [HttpDelete("{module}/{id}")]
    public async Task<IActionResult> DeleteItem(string module, string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;
        var mod = module.Trim().ToLowerInvariant();

        try
        {
            bool deleted = mod switch
            {
                "hotels" or "hotel" => await _hotelRepo.DeleteHotelAsync(id),
                "tours" or "tour" => await _tourRepo.DeleteAsync(id).ContinueWith(_ => true),
                "flights" or "flight" => await _flightRepo.DeleteFlightAsync(id),
                "transfers" or "transfer" => await _transferRepo.DeleteTransferAsync(id),
                "visas" or "visa" => await _visaRepo.DeleteVisaAsync(id),
                "restaurants" or "restaurant" => await _restaurantRepo.DeleteRestaurantAsync(id),
                "packages" or "package" => await _packageRepo.DeletePackageAsync(id),
                "buildpackage" or "custom" => await _buildPackageRepo.DeleteBuildPackageOptionAsync(id),
                _ => false
            };

            return Ok(new
            {
                success = true,
                message = $"Item '{id}' from module '{module}' deleted successfully."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete item {Id} from module {Module}", id, module);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 6. Upload Catalog Image ────────────────────────────────────────────────
    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile? file)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, error = "No image file was provided." });
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".svg" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(ext))
        {
            return BadRequest(new { success = false, error = "Allowed file types: JPG, PNG, WEBP, SVG." });
        }

        try
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
            var uploadDir = Path.Combine(webRoot, "uploads", "catalog");

            if (!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/catalog/{fileName}";
            return Ok(new
            {
                success = true,
                url,
                fileName = file.FileName,
                size = file.Length
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Image upload failed");
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 7. Replace Catalog Item Image ──────────────────────────────────────────
    [HttpPost("{module}/{id}/replace-image")]
    public async Task<IActionResult> ReplaceItemImage(
        string module,
        string id,
        [FromForm] IFormFile? file,
        [FromForm] string? imageUrl,
        [FromForm] string? imageType)
    {
        if (!ValidateTenantAccess(out var forbiddenResult)) return forbiddenResult!;

        string finalUrl = imageUrl?.Trim() ?? "";

        if (file != null && file.Length > 0)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".svg" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
            {
                return BadRequest(new { success = false, error = "Allowed file types: JPG, PNG, WEBP, SVG." });
            }

            var webRoot = _env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
            var uploadDir = Path.Combine(webRoot, "uploads", "catalog", module.ToLowerInvariant());
            if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

            var fileName = $"{id}_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            finalUrl = $"/uploads/catalog/{module.ToLowerInvariant()}/{fileName}";
        }

        if (string.IsNullOrWhiteSpace(finalUrl))
        {
            return BadRequest(new { success = false, error = "Either an image file or an imageUrl must be provided." });
        }

        var mod = module.Trim().ToLowerInvariant();
        try
        {
            switch (mod)
            {
                case "tours" or "tour":
                    var tour = await _tourRepo.GetByIdAsync(id);
                    if (tour != null)
                    {
                        tour.Image = finalUrl;
                        if (tour.Gallery == null) tour.Gallery = new List<string>();
                        if (!tour.Gallery.Contains(finalUrl)) tour.Gallery.Insert(0, finalUrl);
                        await _tourRepo.UpdateAsync(id, tour);
                    }
                    break;
                case "hotels" or "hotel":
                    var hotel = await _hotelRepo.GetHotelByIdAsync(id);
                    if (hotel != null)
                    {
                        hotel.CoverImage = finalUrl;
                        hotel.ImageUrl = finalUrl;
                        if (hotel.Images == null) hotel.Images = new List<string>();
                        if (!hotel.Images.Contains(finalUrl)) hotel.Images.Insert(0, finalUrl);
                        await _hotelRepo.UpdateHotelAsync(id, hotel);
                    }
                    break;
                case "restaurants" or "restaurant":
                    var rest = await _restaurantRepo.GetRestaurantByIdAsync(id);
                    if (rest != null)
                    {
                        rest.Image = finalUrl;
                        rest.CoverImage = finalUrl;
                        rest.ImageUrl = finalUrl;
                        if (rest.Gallery == null) rest.Gallery = new List<string>();
                        if (!rest.Gallery.Contains(finalUrl)) rest.Gallery.Insert(0, finalUrl);
                        await _restaurantRepo.UpdateRestaurantAsync(id, rest);
                    }
                    break;
                case "visas" or "visa":
                    var visa = await _visaRepo.GetVisaByIdAsync(id);
                    if (visa != null)
                    {
                        visa.Image = finalUrl;
                        visa.CoverImage = finalUrl;
                        await _visaRepo.UpdateVisaAsync(id, visa);
                    }
                    break;
                case "transfers" or "transfer":
                    var trf = await _transferRepo.GetTransferByIdAsync(id);
                    if (trf != null)
                    {
                        trf.Image = finalUrl;
                        trf.CoverImage = finalUrl;
                        await _transferRepo.UpdateTransferAsync(id, trf);
                    }
                    break;
                case "packages" or "package":
                    var pkg = await _packageRepo.GetPackageByIdAsync(id);
                    if (pkg != null)
                    {
                        pkg.Image = finalUrl;
                        pkg.CoverImage = finalUrl;
                        await _packageRepo.UpdatePackageAsync(id, pkg);
                    }
                    break;
                case "flights" or "flight":
                    var flt = await _flightRepo.GetFlightByIdAsync(id);
                    if (flt != null)
                    {
                        flt.AirlineLogo = finalUrl;
                        await _flightRepo.UpdateFlightAsync(id, flt);
                    }
                    break;
            }

            return Ok(new
            {
                success = true,
                module = mod,
                id,
                url = finalUrl,
                isAdminUploaded = true,
                message = $"Image for {module} item '{id}' updated successfully."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to replace image for {Module} item {Id}", module, id);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }
}
