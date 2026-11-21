using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IBookingWorkflowService _workflowService;
    private readonly ITourService _tourService;
    private readonly IWebsiteContext _websiteContext;
    private readonly IRateLimiterService _rateLimiter;
    private readonly IActionTokenService _actionTokenService;
    private readonly IEmailOutboxService _outboxService;
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;

    public BookingsController(
        IBookingService bookingService,
        IBookingWorkflowService workflowService,
        ITourService tourService,
        IWebsiteContext websiteContext,
        IRateLimiterService rateLimiter,
        IActionTokenService actionTokenService,
        IEmailOutboxService outboxService,
        IConfiguration configuration,
        IServiceProvider serviceProvider)
    {
        _bookingService = bookingService;
        _workflowService = workflowService;
        _tourService = tourService;
        _websiteContext = websiteContext;
        _rateLimiter = rateLimiter;
        _actionTokenService = actionTokenService;
        _outboxService = outboxService;
        _configuration = configuration;
        _serviceProvider = serviceProvider;
    }

    private string GetWebAppBaseUrl()
    {
        var origin = Request.Headers["Origin"].ToString();
        if (!string.IsNullOrWhiteSpace(origin) && (origin.StartsWith("http://") || origin.StartsWith("https://")))
        {
            return origin.TrimEnd('/');
        }
        var allowed = _configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        return allowed != null && allowed.Length > 0 ? allowed[0].TrimEnd('/') : "http://localhost:3000";
    }

    // ─── 1. Inbox Counts ─────────────────────────────────────────────────────────
    [HttpGet("inbox/counts")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> GetInboxCounts()
    {
        var tokenWebsiteId = User?.FindFirst("websiteId")?.Value;
        if (!string.IsNullOrEmpty(tokenWebsiteId) &&
            !string.Equals(tokenWebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Access denied: session belongs to a different website." });
        }

        try
        {
            var counts = await _workflowService.GetInboxCountsAsync();
            return Ok(new { success = true, data = counts });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 2. Query Bookings / Inbox ──────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? email,
        [FromQuery] string? ids,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] string? source,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;
        var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isAuthenticated = User?.Identity?.IsAuthenticated == true;
        var isAdmin = User?.IsInRole("Admin") == true || User?.IsInRole("SuperAdmin") == true;

        if (isAdmin && string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(ids))
        {
            var tokenWebsiteId = User?.FindFirst("websiteId")?.Value;
            if (!string.IsNullOrEmpty(tokenWebsiteId) &&
                !string.Equals(tokenWebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    error = "Access denied: session belongs to a different website."
                });
            }

            var (adminList, totalAdminCount) = await _bookingService.QueryBookingsPagedAsync(
                status: status,
                search: search,
                page: page,
                pageSize: pageSize
            );

            // In-memory filter for source if requested
            if (!string.IsNullOrWhiteSpace(source))
            {
                adminList = adminList.Where(b => string.Equals(b.Source, source.Trim(), StringComparison.OrdinalIgnoreCase)).ToList();
            }

            return Ok(new
            {
                success = true,
                data = adminList,
                count = totalAdminCount,
                page = Math.Max(1, page),
                pageSize = Math.Clamp(pageSize, 1, 100),
                totalPages = (int)Math.Ceiling((double)totalAdminCount / Math.Clamp(pageSize, 1, 100))
            });
        }

        var targetEmail = !string.IsNullOrWhiteSpace(email) ? email.Trim() : (isAuthenticated ? authEmail : null);

        var idSet = !string.IsNullOrWhiteSpace(ids)
            ? ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                 .ToHashSet(StringComparer.OrdinalIgnoreCase)
            : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (!isAuthenticated && string.IsNullOrWhiteSpace(targetEmail) && idSet.Count == 0)
        {
            return Unauthorized(new
            {
                success = false,
                error = "Authentication, guest email, or booking IDs filter required."
            });
        }

        try
        {
            var (filtered, totalCount) = await _bookingService.QueryBookingsPagedAsync(
                email: targetEmail,
                userId: authUserId,
                ids: idSet.Count > 0 ? idSet : null,
                status: status,
                search: search,
                page: page,
                pageSize: pageSize
            );

            return Ok(new
            {
                success = true,
                data = filtered,
                count = totalCount,
                page = Math.Max(1, page),
                pageSize = Math.Clamp(pageSize, 1, 100),
                totalPages = (int)Math.Ceiling((double)totalCount / Math.Clamp(pageSize, 1, 100))
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 3. Get Single Booking ──────────────────────────────────────────────────
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id)
                ?? await _bookingService.GetBookingByReferenceAsync(id);

            if (booking is null)
            {
                return NotFound(new { success = false, error = "Booking not found in active website database." });
            }

            // Tenant isolation verification
            if (!string.Equals(booking.WebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { success = false, error = "Booking not found in active website database." });
            }

            return Ok(new { success = true, data = booking });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── Resolve Catalog Item Across All 8 Modules ─────────────────────────────
    private async Task<(string Title, string Image, string Destination, string Duration, string Category, double UnitPrice, double ChildPrice, double BaseSubtotal, double TaxRate, string Currency)> ResolveCatalogItemAsync(
        string serviceType,
        string? itemId,
        string? slug,
        int? tourId,
        string? option,
        int nights,
        int rooms,
        int adults,
        int children,
        string? fallbackTitle = null,
        string? fallbackImage = null,
        string? fallbackDestination = null,
        double? fallbackUnitPrice = null,
        double? fallbackSubtotal = null,
        double? fallbackTotalPrice = null,
        string? fallbackCurrency = null)
    {
        var cleanType = !string.IsNullOrWhiteSpace(serviceType) ? serviceType.Trim().ToLowerInvariant() : "tour";
        var idStr = !string.IsNullOrWhiteSpace(itemId) ? itemId.Trim() : (tourId.HasValue && tourId.Value > 0 ? tourId.Value.ToString() : (slug ?? ""));
        var cleanSlug = !string.IsNullOrWhiteSpace(slug) ? slug.Trim() : idStr;
        var totalPax = Math.Max(1, adults + children);

        // 1. FLIGHT
        if (cleanType == "flight")
        {
            var flightRepo = _serviceProvider.GetService<IFlightRepository>();
            Flight? flight = null;
            if (flightRepo != null)
            {
                flight = await flightRepo.GetFlightByIdAsync(idStr)
                    ?? await flightRepo.GetFlightBySlugAsync(cleanSlug);
            }

            if (flight != null)
            {
                var title = $"{flight.Airline} {flight.FlightNumber}: {flight.FromAirport.Code} → {flight.ToAirport.Code}";
                var img = !string.IsNullOrWhiteSpace(flight.AirlineLogo) ? flight.AirlineLogo : (fallbackImage ?? "");
                var dest = $"{flight.ToAirport.City} ({flight.ToAirport.Code})";
                var dur = !string.IsNullOrWhiteSpace(flight.Duration) ? flight.Duration : "Direct Flight";
                var unit = flight.Price;
                var childUnit = Math.Round(unit * 0.75, 2);
                var sub = Math.Round((adults * unit) + (children * childUnit), 2);
                return (title, img, dest, dur, "FLIGHT", unit, childUnit, sub, 0.12, flight.Currency ?? "INR");
            }
        }

        // 2. HOTEL
        if (cleanType == "hotel")
        {
            var hotelRepo = _serviceProvider.GetService<IHotelRepository>();
            Hotel? hotel = null;
            if (hotelRepo != null)
            {
                hotel = await hotelRepo.GetHotelByIdAsync(idStr)
                    ?? await hotelRepo.GetHotelBySlugAsync(cleanSlug);
            }

            if (hotel != null)
            {
                var title = !string.IsNullOrWhiteSpace(hotel.Title) ? hotel.Title : (fallbackTitle ?? "Hotel Stay");
                var img = hotel.Images?.FirstOrDefault() ?? (!string.IsNullOrWhiteSpace(fallbackImage) ? fallbackImage : "");
                var dest = !string.IsNullOrWhiteSpace(hotel.Destination?.CityName)
                    ? $"{hotel.Destination.CityName}, {hotel.Destination.Country}"
                    : (fallbackDestination ?? "Confirmed Destination");
                var dur = $"{Math.Max(1, nights)} {(nights == 1 ? "Night" : "Nights")}";
                var room = hotel.Rooms?.FirstOrDefault(r => !string.IsNullOrWhiteSpace(option) && string.Equals(r.Name, option, StringComparison.OrdinalIgnoreCase))
                    ?? hotel.Rooms?.FirstOrDefault();
                var unit = room?.PricePerNight ?? (hotel.PricePerNight > 0 ? hotel.PricePerNight : 199.0);
                var sub = Math.Round(unit * Math.Max(1, nights) * Math.Max(1, rooms), 2);
                return (title, img, dest, dur, "HOTEL", unit, 0.0, sub, 0.12, hotel.Currency ?? "INR");
            }
        }

        // 3. RESTAURANT
        if (cleanType == "restaurant" || cleanType == "dining")
        {
            var restRepo = _serviceProvider.GetService<IRestaurantRepository>();
            Restaurant? rest = null;
            if (restRepo != null)
            {
                rest = await restRepo.GetRestaurantByIdAsync(idStr)
                    ?? await restRepo.GetRestaurantBySlugAsync(cleanSlug);
            }

            if (rest != null)
            {
                var title = !string.IsNullOrWhiteSpace(rest.Name) ? rest.Name : (!string.IsNullOrWhiteSpace(rest.Title) ? rest.Title : (fallbackTitle ?? "Dining"));
                var img = !string.IsNullOrWhiteSpace(rest.Image) ? rest.Image : (fallbackImage ?? "");
                var dest = !string.IsNullOrWhiteSpace(rest.City) ? $"{rest.City}, {rest.Country}" : (fallbackDestination ?? "Dining Destination");
                var dur = !string.IsNullOrWhiteSpace(rest.Timings) ? rest.Timings : "Dining Reservation";
                var unit = rest.CostForTwo > 0 ? Math.Round(rest.CostForTwo / 2.0, 2) : 250.0;
                var childUnit = Math.Round(unit * 0.60, 2);
                var sub = Math.Round((adults * unit) + (children * childUnit), 2);
                return (title, img, dest, dur, "DINING", unit, childUnit, sub, 0.05, rest.Currency ?? "INR");
            }
        }

        // 4. TRANSFER
        if (cleanType == "transfer")
        {
            var trfRepo = _serviceProvider.GetService<ITransferRepository>();
            Transfer? trf = null;
            if (trfRepo != null)
            {
                trf = await trfRepo.GetTransferByIdAsync(idStr)
                    ?? await trfRepo.GetTransferBySlugAsync(cleanSlug);
            }

            if (trf != null)
            {
                var title = !string.IsNullOrWhiteSpace(trf.Title) ? trf.Title : $"{trf.VehicleModel} - {trf.VehicleLabel}";
                var img = !string.IsNullOrWhiteSpace(trf.Image) ? trf.Image : (fallbackImage ?? "");
                var dest = !string.IsNullOrWhiteSpace(trf.DropoffLocation) ? trf.DropoffLocation : (!string.IsNullOrWhiteSpace(trf.City) ? $"{trf.City}, {trf.Country}" : "Transfer Destination");
                var dur = trf.EstimatedDuration ?? (trf.DurationMinutes > 0 ? $"{trf.DurationMinutes} Mins" : "Private Transfer");
                var unit = trf.Price;
                var sub = unit;
                return (title, img, dest, dur, "TRANSFER", unit, 0.0, sub, 0.05, trf.Currency ?? "INR");
            }
        }

        // 5. VISA
        if (cleanType == "visa")
        {
            var visaRepo = _serviceProvider.GetService<IVisaRepository>();
            Visa? visa = null;
            if (visaRepo != null)
            {
                visa = await visaRepo.GetVisaByIdAsync(idStr)
                    ?? await visaRepo.GetVisaBySlugAsync(cleanSlug);
            }

            if (visa != null)
            {
                var title = !string.IsNullOrWhiteSpace(visa.Title) ? visa.Title : $"{visa.Country} {visa.VisaTypeLabel}";
                var img = !string.IsNullOrWhiteSpace(visa.Image) ? visa.Image : (fallbackImage ?? "");
                var dest = visa.Country;
                var dur = !string.IsNullOrWhiteSpace(visa.ProcessingTime) ? visa.ProcessingTime : (visa.Validity ?? "Standard Processing");
                var unit = visa.Price;
                var sub = Math.Round(unit * totalPax, 2);
                return (title, img, dest, dur, "VISA", unit, unit, sub, 0.05, visa.Currency ?? "INR");
            }
        }

        // 6. PACKAGE
        if (cleanType == "package" || cleanType == "holidays")
        {
            var pkgRepo = _serviceProvider.GetService<IPackageRepository>();
            Package? pkg = null;
            if (pkgRepo != null)
            {
                pkg = await pkgRepo.GetPackageByIdAsync(idStr)
                    ?? await pkgRepo.GetPackageBySlugAsync(cleanSlug);
            }

            if (pkg != null)
            {
                var title = !string.IsNullOrWhiteSpace(pkg.Title) ? pkg.Title : pkg.Name;
                var img = !string.IsNullOrWhiteSpace(pkg.Image) ? pkg.Image : (pkg.Images?.FirstOrDefault() ?? fallbackImage ?? "");
                var dest = pkg.Destination;
                var dur = !string.IsNullOrWhiteSpace(pkg.Duration) ? pkg.Duration : $"{pkg.DurationDays} Days / {pkg.DurationNights} Nights";
                var unit = pkg.Price > 0 ? pkg.Price : pkg.StartingPrice;
                var childUnit = Math.Round(unit * 0.70, 2);
                var sub = Math.Round((adults * unit) + (children * childUnit), 2);
                return (title, img, dest, dur, "PACKAGE", unit, childUnit, sub, 0.05, pkg.Currency ?? "INR");
            }
        }

        // 7. BUILD PACKAGE
        if (cleanType == "buildpackage" || cleanType == "custom")
        {
            var bpRepo = _serviceProvider.GetService<IBuildPackageRepository>();
            BuildPackageOption? bp = null;
            if (bpRepo != null)
            {
                bp = await bpRepo.GetBuildPackageOptionByIdAsync(idStr)
                    ?? await bpRepo.GetBuildPackageOptionBySlugAsync(cleanSlug);
            }

            if (bp != null)
            {
                var title = $"Custom Vacation: {bp.DestinationName}";
                var img = !string.IsNullOrWhiteSpace(bp.HeroImage) ? bp.HeroImage : (!string.IsNullOrWhiteSpace(bp.Image) ? bp.Image : (bp.Images?.FirstOrDefault() ?? fallbackImage ?? ""));
                var dest = bp.DestinationName;
                var dur = $"{Math.Max(1, nights)} Nights";
                var unit = bp.StartingPrice > 0 ? bp.StartingPrice : 15000.0;
                var childUnit = Math.Round(unit * 0.70, 2);
                var sub = Math.Round(((adults * unit) + (children * childUnit)) * 0.90, 2);
                return (title, img, dest, dur, "CUSTOM", unit, childUnit, sub, 0.05, bp.Currency ?? "INR");
            }
        }

        // 8. TOUR
        Tour? dbTour = null;
        if (int.TryParse(idStr, out var numTourId) && numTourId > 0)
        {
            dbTour = await _tourService.GetTourByNumericIdAsync(numTourId);
        }
        if (dbTour == null && !string.IsNullOrWhiteSpace(cleanSlug))
        {
            dbTour = await _tourService.GetTourBySlugAsync(cleanSlug);
        }
        if (dbTour == null && !string.IsNullOrWhiteSpace(idStr))
        {
            dbTour = await _tourService.GetTourByIdAsync(idStr);
        }

        if (dbTour != null && cleanType == "tour")
        {
            var title = dbTour.Name ?? dbTour.Title ?? "Guided Tour";
            var img = !string.IsNullOrWhiteSpace(dbTour.Image) ? dbTour.Image : (fallbackImage ?? "");
            var dest = dbTour.Destination ?? dbTour.Location ?? "Tour Destination";
            var dur = !string.IsNullOrWhiteSpace(dbTour.Duration) ? dbTour.Duration : $"{Math.Max(1, dbTour.DurationDays)} Days";
            var unit = dbTour.DiscountedPrice.HasValue && dbTour.DiscountedPrice.Value > 0 ? dbTour.DiscountedPrice.Value : dbTour.Price;
            var childUnit = Math.Round(unit * 0.70, 2);
            var sub = Math.Round((adults * unit) + (children * childUnit), 2);
            return (title, img, dest, dur, dbTour.Category ?? "ADVENTURE", unit, childUnit, sub, 0.05, dbTour.Currency ?? "INR");
        }

        // Client Fallback (preserves client selection if catalog record is unindexed)
        var fbTitle = !string.IsNullOrWhiteSpace(fallbackTitle) ? fallbackTitle.Trim() : $"{cleanType.ToUpperInvariant()} RESERVATION";
        var fbImg = !string.IsNullOrWhiteSpace(fallbackImage) ? fallbackImage.Trim() : "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80";
        var fbDest = !string.IsNullOrWhiteSpace(fallbackDestination) ? fallbackDestination.Trim() : "Confirmed Destination";
        var fbDur = $"{Math.Max(1, nights)} Days";
        var fbTaxRate = (cleanType == "flight" || cleanType == "hotel") ? 0.12 : 0.05;
        double fbUnit = fallbackUnitPrice.HasValue && fallbackUnitPrice.Value > 0 ? fallbackUnitPrice.Value : 199.0;
        double fbSub;
        if (fallbackSubtotal.HasValue && fallbackSubtotal.Value > 0)
        {
            fbSub = fallbackSubtotal.Value;
        }
        else if (fallbackTotalPrice.HasValue && fallbackTotalPrice.Value > 0)
        {
            fbSub = Math.Round(fallbackTotalPrice.Value / (1.0 + fbTaxRate), 2);
        }
        else
        {
            fbSub = Math.Round(fbUnit * totalPax, 2);
        }
        var fbCat = cleanType switch
        {
            "flight" => "FLIGHT",
            "hotel" => "HOTEL",
            "restaurant" => "DINING",
            "visa" => "VISA",
            "transfer" => "TRANSFER",
            "package" => "PACKAGE",
            "buildpackage" => "CUSTOM",
            _ => "EXPERIENCE"
        };
        return (fbTitle, fbImg, fbDest, fbDur, fbCat, fbUnit, Math.Round(fbUnit * 0.70, 2), fbSub, fbTaxRate, fallbackCurrency ?? "INR");
    }

    // ─── 4a. Live Pricing Quote Endpoint ────────────────────────────────────────
    [HttpPost("quote")]
    public async Task<IActionResult> GetQuote([FromBody] BookingQuoteRequestDto dto)
    {
        try
        {
            var serviceType = !string.IsNullOrWhiteSpace(dto.Service)
                ? dto.Service
                : (!string.IsNullOrWhiteSpace(dto.ServiceType) ? dto.ServiceType : (!string.IsNullOrWhiteSpace(dto.Module) ? dto.Module : "tour"));

            var adults = dto.Adults.HasValue && dto.Adults.Value > 0 ? dto.Adults.Value : (dto.Travelers.HasValue && dto.Travelers.Value > 0 ? dto.Travelers.Value : 1);
            var children = dto.Children.HasValue && dto.Children.Value >= 0 ? dto.Children.Value : 0;
            var nights = dto.Nights.HasValue && dto.Nights.Value > 0 ? dto.Nights.Value : 1;
            var rooms = dto.Rooms.HasValue && dto.Rooms.Value > 0 ? dto.Rooms.Value : 1;

            var (title, image, dest, dur, cat, unit, childUnit, subtotal, taxRate, currency) = await ResolveCatalogItemAsync(
                serviceType: serviceType,
                itemId: dto.ItemId ?? dto.Id ?? dto.FlightNumber,
                slug: dto.Slug,
                tourId: dto.TourId,
                option: dto.Option,
                nights: nights,
                rooms: rooms,
                adults: adults,
                children: children
            );

            // Coupon calculation
            var promoCode = (!string.IsNullOrWhiteSpace(dto.PromoCode) ? dto.PromoCode : dto.CouponCode)?.Trim().ToUpperInvariant();
            double discount = 0.0;
            string? promoMessage = null;
            if (!string.IsNullOrWhiteSpace(promoCode))
            {
                var site = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
                if (promoCode == "GUJJU20" && site.Contains("gujju"))
                {
                    discount = Math.Min(3000.0, Math.Round(subtotal * 0.20, 2));
                    promoMessage = "20% Festive Off applied";
                }
                else if (promoCode == "TRIPGO15" && site.Contains("tripgo"))
                {
                    discount = Math.Min(150.0, Math.Round(subtotal * 0.15, 2));
                    promoMessage = "15% Asia Explorer Off applied";
                }
                else if (promoCode == "LUXURY50" && (site.Contains("techno") || site == "website3"))
                {
                    discount = 50.0;
                    promoMessage = "$50 Luxury Credit applied";
                }
                else if (promoCode == "WELCOME" || promoCode == "EXPLORE10")
                {
                    discount = Math.Round(subtotal * 0.10, 2);
                    promoMessage = "10% Savings applied";
                }
                else if (promoCode == "VIPPASS")
                {
                    discount = Math.Round(subtotal * 0.12, 2);
                    promoMessage = "12% VIP Member Discount applied";
                }
            }

            var taxableBase = Math.Max(0.0, subtotal - discount);
            var taxes = Math.Round(taxableBase * taxRate, 2);
            var total = Math.Round(taxableBase + taxes, 2);

            var isPayLater = string.Equals(dto.PaymentOption, "payLater", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(dto.PaymentOption, "later", StringComparison.OrdinalIgnoreCase);
            var advanceDue = isPayLater ? Math.Round(total * 0.20, 2) : total;
            var balanceDue = isPayLater ? Math.Round(total - advanceDue, 2) : 0.0;

            return Ok(new
            {
                success = true,
                data = new BookingQuoteResponseDto
                {
                    Success = true,
                    Title = title,
                    Service = serviceType,
                    Destination = dest,
                    ImageUrl = image,
                    UnitPrice = unit,
                    ChildPrice = childUnit,
                    Subtotal = subtotal,
                    Discount = discount,
                    TaxRate = taxRate,
                    Taxes = taxes,
                    Total = total,
                    AdvanceDue = advanceDue,
                    BalanceDue = balanceDue,
                    Currency = currency,
                    PromoMessage = promoMessage,
                    Breakdown = new Dictionary<string, double>
                    {
                        ["baseRate"] = subtotal,
                        ["discount"] = discount,
                        ["taxRatePercent"] = taxRate * 100,
                        ["taxes"] = taxes,
                        ["total"] = total
                    }
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 4b. Current User's Bookings ─────────────────────────────────────────────
    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> GetMine(
        [FromQuery] string? status = null,
        [FromQuery] string? module = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User?.FindFirst("sub")?.Value;
        var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrWhiteSpace(authUserId) && string.IsNullOrWhiteSpace(authEmail))
        {
            return StatusCode(StatusCodes.Status401Unauthorized, new { success = false, code = "LOGIN_REQUIRED", error = "Please log in to view your reservations." });
        }

        var tokenSiteId = User?.FindFirst("siteId")?.Value ?? User?.FindFirst("websiteId")?.Value;
        if (!string.IsNullOrEmpty(tokenSiteId) && !string.Equals(tokenSiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, code = "FORBIDDEN_TENANT", error = "Session belongs to a different website." });
        }

        var (items, count) = await _bookingService.QueryBookingsPagedAsync(
            email: authEmail,
            userId: authUserId,
            status: status,
            search: search,
            page: page,
            pageSize: pageSize
        );

        if (!string.IsNullOrWhiteSpace(module) && !string.Equals(module, "all", StringComparison.OrdinalIgnoreCase))
        {
            var cleanModule = module.Trim().ToLowerInvariant();
            items = items.Where(b => string.Equals(b.ServiceType, cleanModule, StringComparison.OrdinalIgnoreCase) ||
                                     string.Equals(b.Snapshot?.Category, cleanModule, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(new
        {
            success = true,
            data = items,
            count,
            page,
            pageSize
        });
    }

    // ─── 4c. Create Booking (Unified Real Booking Pipeline Across All 8 Modules) ──
    [HttpPost, Authorize]
    public async Task<IActionResult> Create([FromBody] BookingCreateDto dto)
    {
        try
        {
            // ─── 1. Authenticated User & Tenant Verification ───
            var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("sub")?.Value;

            var userRepo = _serviceProvider.GetRequiredService<IUserRepository>();

            if (string.IsNullOrWhiteSpace(authUserId))
            {
                return StatusCode(StatusCodes.Status401Unauthorized, new
                {
                    success = false,
                    code = "LOGIN_REQUIRED",
                    error = "Please log in to complete your reservation."
                });
            }

            var tokenSiteId = User?.FindFirst("siteId")?.Value
                ?? User?.FindFirst("websiteId")?.Value;

            if (!string.IsNullOrEmpty(tokenSiteId) &&
                !string.Equals(tokenSiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    code = "FORBIDDEN_TENANT",
                    error = "Session belongs to a different website."
                });
            }

            var authUser = await userRepo.GetByIdAsync(authUserId);
            if (authUser == null || authUser.IsDeleted || authUser.IsDisabled)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, new
                {
                    success = false,
                    code = "USER_INACTIVE",
                    error = "User account is inactive or not found."
                });
            }

            var requireEmailVerification = _configuration.GetValue<bool>("Auth:RequireVerifiedEmailToBook", false);
            if (requireEmailVerification && !authUser.IsEmailVerified)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    code = "EMAIL_NOT_VERIFIED",
                    error = "Please verify your email address to book. Check your inbox for the verification link.",
                    email = authUser.Email
                });
            }

            // Idempotency check
            string? idempotencyKey = null;
            if (Request.Headers.TryGetValue("X-Idempotency-Key", out var xKey) && !string.IsNullOrWhiteSpace(xKey))
            {
                idempotencyKey = xKey.ToString().Trim();
            }
            else if (Request.Headers.TryGetValue("Idempotency-Key", out var stdKey) && !string.IsNullOrWhiteSpace(stdKey))
            {
                idempotencyKey = stdKey.ToString().Trim();
            }
            else if (!string.IsNullOrWhiteSpace(dto.IdempotencyKey))
            {
                idempotencyKey = dto.IdempotencyKey.Trim();
            }

            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var existingIdempotent = await _bookingService.GetByIdempotencyKeyAsync(idempotencyKey);
                if (existingIdempotent != null)
                {
                    return Ok(new { success = true, data = existingIdempotent, idempotent = true });
                }
            }

            if (dto.TourId <= 0 && string.IsNullOrWhiteSpace(dto.TourSlug) && string.IsNullOrWhiteSpace(dto.ItemId) && string.IsNullOrWhiteSpace(dto.Slug))
            {
                return BadRequest(new { success = false, error = "A valid service item ID or slug is required." });
            }

            if (string.IsNullOrWhiteSpace(dto.GuestName) ||
                string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Phone))
            {
                return BadRequest(new { success = false, error = "Guest contact name, email, and phone number are required." });
            }

            var travelDate = dto.TravelDate ?? dto.StartDate ?? DateTime.UtcNow.AddDays(7);
            var startDate = dto.StartDate ?? travelDate;
            var endDate = dto.EndDate ?? startDate.AddDays(3);
            if (endDate < startDate) endDate = startDate.AddDays(3);

            var adults = dto.Adults.HasValue && dto.Adults.Value > 0
                ? dto.Adults.Value
                : (dto.Travelers > 0 ? dto.Travelers : 1);
            var children = dto.Children.HasValue && dto.Children.Value >= 0
                ? dto.Children.Value
                : 0;
            var totalTravelers = adults + children;

            var serviceType = !string.IsNullOrWhiteSpace(dto.Service)
                ? dto.Service.Trim().ToLowerInvariant()
                : (!string.IsNullOrWhiteSpace(dto.ServiceType)
                    ? dto.ServiceType.Trim().ToLowerInvariant()
                    : (!string.IsNullOrWhiteSpace(dto.Module) ? dto.Module.Trim().ToLowerInvariant() : "tour"));

            var nights = dto.Nights.HasValue && dto.Nights.Value > 0
                ? dto.Nights.Value
                : Math.Max(1, (int)(endDate - startDate).TotalDays);
            var rooms = dto.Rooms.HasValue && dto.Rooms.Value > 0 ? dto.Rooms.Value : 1;

            var (itemTitle, itemCoverImage, itemDestination, itemDuration, itemCategory, unitPrice, childRate, subtotal, serviceTaxRate, itemCurrency) =
                await ResolveCatalogItemAsync(
                    serviceType: serviceType,
                    itemId: dto.ItemId ?? dto.FlightNumber ?? (dto.TourId > 0 ? dto.TourId.ToString() : null),
                    slug: dto.Slug ?? dto.TourSlug,
                    tourId: dto.TourId > 0 ? dto.TourId : null,
                    option: dto.Option,
                    nights: nights,
                    rooms: rooms,
                    adults: adults,
                    children: children,
                    fallbackTitle: dto.Title ?? dto.TourName,
                    fallbackImage: dto.TourImage ?? dto.Image ?? dto.ImageUrl,
                    fallbackDestination: dto.Destination ?? dto.Location,
                    fallbackUnitPrice: dto.UnitPrice,
                    fallbackSubtotal: dto.Subtotal,
                    fallbackTotalPrice: dto.TotalPrice,
                    fallbackCurrency: dto.Currency
                );

            // Flight seat availability check & atomic deduction
            if (serviceType == "flight")
            {
                var flightRepo = _serviceProvider.GetService<IFlightRepository>();
                if (flightRepo != null)
                {
                    var flight = await flightRepo.GetFlightByIdAsync(dto.ItemId ?? dto.FlightNumber ?? dto.Slug ?? "")
                        ?? await flightRepo.GetFlightBySlugAsync(dto.Slug ?? dto.FlightNumber ?? "");
                    if (flight != null)
                    {
                        if (flight.AvailableSeats < totalTravelers)
                        {
                            return BadRequest(new { success = false, error = $"Only {flight.AvailableSeats} seats remaining on this flight." });
                        }
                        if (!string.IsNullOrEmpty(flight.Id))
                        {
                            flight.AvailableSeats = Math.Max(0, flight.AvailableSeats - totalTravelers);
                            await flightRepo.UpdateFlightAsync(flight.Id, flight);
                        }
                    }
                }
            }

            var addOnsTotal = dto.AddOnsTotal.HasValue && dto.AddOnsTotal.Value >= 0 ? Math.Round(dto.AddOnsTotal.Value, 2) : 0.0;

            // Coupon server-verification
            var discount = 0.0;
            var promoCode = !string.IsNullOrWhiteSpace(dto.CouponCode)
                ? dto.CouponCode.Trim().ToUpperInvariant()
                : (!string.IsNullOrWhiteSpace(dto.PromoCode) ? dto.PromoCode.Trim().ToUpperInvariant() : null);

            if (!string.IsNullOrWhiteSpace(promoCode))
            {
                var site = _websiteContext.CurrentWebsiteId.ToLowerInvariant();
                if (promoCode == "GUJJU20" && (site == "gujjutours" || site.Contains("gujju")))
                {
                    discount = Math.Min(3000.0, Math.Round(subtotal * 0.20, 2));
                }
                else if (promoCode == "TRIPGO15" && (site == "tripgoasia" || site.Contains("tripgo")))
                {
                    discount = Math.Min(150.0, Math.Round(subtotal * 0.15, 2));
                }
                else if (promoCode == "LUXURY50" && (site == "technoheaven" || site.Contains("techno")))
                {
                    discount = 50.0;
                }
                else if (promoCode == "WELCOME" || promoCode == "EXPLORE10")
                {
                    discount = Math.Round(subtotal * 0.10, 2);
                }
                else if (promoCode == "EARLYBIRD")
                {
                    discount = site.Contains("gujju") ? 2000.0 : 30.0;
                }
                else if (promoCode == "VIPPASS")
                {
                    discount = Math.Round(subtotal * 0.12, 2);
                }
                else if (dto.DiscountAmount.HasValue && dto.DiscountAmount.Value > 0)
                {
                    discount = Math.Min(subtotal * 0.25, Math.Round(dto.DiscountAmount.Value, 2));
                }
            }

            var taxableBase = Math.Max(0.0, subtotal + addOnsTotal - discount);
            var taxes = Math.Round(taxableBase * serviceTaxRate, 2);
            var total = Math.Round(taxableBase + taxes, 2);

            var priceBreakdown = new BookingPriceBreakdown
            {
                Subtotal = subtotal,
                Discount = discount,
                Taxes = taxes,
                AddOnsTotal = addOnsTotal,
                Total = total
            };

            var isPayLater = string.Equals(dto.PaymentOption, "payLater", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(dto.PaymentPlan, "later", StringComparison.OrdinalIgnoreCase);

            var paymentMethod = !string.IsNullOrWhiteSpace(dto.PaymentMethod)
                ? dto.PaymentMethod.Trim().ToLowerInvariant()
                : null;

            double amountPaid;
            double amountDue;
            string paymentStatus;

            if (isPayLater)
            {
                amountPaid = Math.Round(total * 0.20, 2);
                amountDue = Math.Round(total - amountPaid, 2);
                paymentStatus = "partially_paid";
            }
            else if (paymentMethod == "pay_on_arrival")
            {
                amountPaid = 0.0;
                amountDue = total;
                paymentStatus = "unpaid";
            }
            else
            {
                amountPaid = total;
                amountDue = 0.0;
                paymentStatus = (paymentMethod != null) ? "paid" : "unpaid";
            }

            var paidAt = (paymentStatus == "paid" || paymentStatus == "partially_paid") ? (DateTime?)DateTime.UtcNow : null;
            var paymentRef = dto.PaymentReference ?? (paymentMethod != null ? $"TXN-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}" : null);

            Tour? dbTourForDetails = null;
            if (serviceType == "tour")
            {
                if (dto.TourId > 0) dbTourForDetails = await _tourService.GetTourByNumericIdAsync(dto.TourId);
                if (dbTourForDetails == null && !string.IsNullOrWhiteSpace(dto.TourSlug)) dbTourForDetails = await _tourService.GetTourBySlugAsync(dto.TourSlug);
                if (dbTourForDetails == null && !string.IsNullOrWhiteSpace(dto.Slug)) dbTourForDetails = await _tourService.GetTourBySlugAsync(dto.Slug);
            }

            var isTour = serviceType == "tour";
            int numericTourId = isTour && dto.TourId > 0
                ? dto.TourId
                : (isTour && dbTourForDetails != null ? dbTourForDetails.TourNumericId : (isTour ? 101 : 0));

            var snapshot = new TourSnapshot
            {
                TourId = numericTourId,
                Slug = !string.IsNullOrWhiteSpace(dto.Slug)
                    ? dto.Slug
                    : (!string.IsNullOrWhiteSpace(dto.TourSlug)
                        ? dto.TourSlug
                        : (serviceType == "flight" ? (dto.FlightNumber ?? "flight-booking") : "service-booking")),
                Title = itemTitle,
                CoverImage = itemCoverImage,
                Destination = itemDestination,
                Category = itemCategory,
                Duration = itemDuration,
                PricePerPerson = unitPrice,
                Currency = itemCurrency,
                ItinerarySummary = dbTourForDetails?.Itinerary?.Select(i => new ItineraryDaySummary
                {
                    Day = i.Day,
                    Title = i.Title,
                    Description = i.Description
                }).ToList() ?? new List<ItineraryDaySummary>(),
                IncludedSummary = dbTourForDetails?.Included?.ToList() ?? new List<string>(),
                ExcludedSummary = dbTourForDetails?.Excluded?.ToList() ?? new List<string>()
            };

            string source = "web";
            if (Request.Headers.TryGetValue("X-Client-Source", out var srcHeader) &&
                string.Equals(srcHeader.ToString(), "app", StringComparison.OrdinalIgnoreCase))
            {
                source = "app";
            }
            else if (!string.IsNullOrWhiteSpace(dto.Source) &&
                     string.Equals(dto.Source.Trim(), "app", StringComparison.OrdinalIgnoreCase))
            {
                source = "app";
            }

            var reference = _bookingService.GenerateBookingReference();

            var travelersList = new List<BookingTraveler>();
            if (dto.TravelersList != null && dto.TravelersList.Count > 0)
            {
                foreach (var t in dto.TravelersList)
                {
                    if (!string.IsNullOrWhiteSpace(t.Name))
                    {
                        travelersList.Add(new BookingTraveler
                        {
                            Id = !string.IsNullOrWhiteSpace(t.Id) ? t.Id : Guid.NewGuid().ToString("N"),
                            Name = t.Name.Trim(),
                            Type = !string.IsNullOrWhiteSpace(t.Type) ? t.Type.Trim() : "Adult",
                            Age = t.Age,
                            Gender = !string.IsNullOrWhiteSpace(t.Gender) ? t.Gender.Trim() : null,
                            PassportOrId = !string.IsNullOrWhiteSpace(t.PassportOrId) ? t.PassportOrId.Trim() : (!string.IsNullOrWhiteSpace(t.PassportNumber) ? t.PassportNumber.Trim() : null),
                            PassportNumber = !string.IsNullOrWhiteSpace(t.PassportNumber) ? t.PassportNumber.Trim() : (!string.IsNullOrWhiteSpace(t.PassportOrId) ? t.PassportOrId.Trim() : null),
                            PassportExpiry = t.PassportExpiry,
                            DateOfBirth = t.DateOfBirth,
                            Nationality = t.Nationality
                        });
                    }
                }
            }

            var primaryGuestName = !string.IsNullOrWhiteSpace(dto.GuestName) ? dto.GuestName.Trim() : authUser.FullName;

            if (travelersList.Count == 0)
            {
                travelersList.Add(new BookingTraveler
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Name = primaryGuestName,
                    Type = "Adult"
                });
            }

            var booking = new Booking
            {
                Reference = reference,
                WebsiteId = _websiteContext.CurrentWebsiteId,
                Source = source,
                UserId = authUser.Id,
                UserCode = authUser.UserCode,
                IdempotencyKey = idempotencyKey,
                GuestName = primaryGuestName,
                Email = authUser.Email,
                Phone = !string.IsNullOrWhiteSpace(dto.Phone) ? dto.Phone.Trim() : (authUser.Phone ?? ""),
                ServiceType = serviceType,
                Snapshot = snapshot,

                TourId = snapshot.TourId,
                TourSlug = snapshot.Slug,
                TourName = snapshot.Title,
                Title = snapshot.Title,
                TourImage = snapshot.CoverImage,
                Currency = snapshot.Currency,
                Location = snapshot.Destination,
                Destination = snapshot.Destination,
                UnitPrice = unitPrice,
                OriginalPrice = dto.OriginalPrice ?? unitPrice,
                Duration = snapshot.Duration,

                TravelDate = travelDate,
                StartDate = startDate,
                EndDate = endDate,
                Adults = adults,
                Children = children,
                Travelers = totalTravelers,
                TravelersList = travelersList,

                PriceBreakdown = priceBreakdown,
                TotalPrice = total,
                AmountPaid = amountPaid,
                AmountDue = amountDue,

                PaymentMethod = paymentMethod,
                PaymentStatus = paymentStatus,
                PaymentReference = paymentRef,
                PaidAt = paidAt,
                SpecialRequest = dto.SpecialRequest ?? dto.SpecialRequests,
                PromoCode = promoCode,
                DiscountAmount = discount,
                AddOns = dto.AddOns ?? new List<string>(),
                AddOnsTotal = addOnsTotal,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            booking.Items.Add(new BookingItemSnapshot
            {
                Id = Guid.NewGuid().ToString("N"),
                ServiceType = serviceType,
                ServiceId = !string.IsNullOrWhiteSpace(dto.ItemId) ? dto.ItemId : (dto.TourId > 0 ? dto.TourId.ToString() : snapshot.Slug),
                Slug = snapshot.Slug,
                Title = itemTitle,
                ImageUrl = itemCoverImage,
                Destination = itemDestination,
                StartDate = travelDate.ToString("yyyy-MM-dd"),
                EndDate = endDate.ToString("yyyy-MM-dd"),
                Adults = adults,
                Children = children,
                RoomsCount = rooms,
                SelectionName = dto.Option ?? dto.SpecialRequest ?? dto.TourName,
                BasePrice = subtotal,
                Taxes = taxes,
                TotalAmount = total,
                Currency = itemCurrency
            });

            var siteConfig = _websiteContext.CurrentSite
                ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
                ?? WebsiteRegistry.SitesById["gujjutours"];

            var webAppBaseUrl = GetWebAppBaseUrl();

            // Process new booking through workflow service (enforces Pending vs Confirmed and dispatches alerts)
            var created = await _workflowService.ProcessNewBookingAsync(booking, siteConfig, webAppBaseUrl);

            return StatusCode(201, new { success = true, data = created });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    // ─── 5. Confirm (Approve) Booking ───────────────────────────────────────────
    [HttpPost("{id}/confirm")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> ConfirmBooking(string id, [FromBody] ConfirmBookingDto? dto)
    {
        var tokenWebsiteId = User?.FindFirst("websiteId")?.Value;
        if (!string.IsNullOrEmpty(tokenWebsiteId) &&
            !string.Equals(tokenWebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Access denied: session belongs to a different website." });
        }

        try
        {
            var adminId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst(ClaimTypes.Email)?.Value
                ?? "admin";

            var siteConfig = _websiteContext.CurrentSite
                ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
                ?? WebsiteRegistry.SitesById["gujjutours"];

            var webAppBaseUrl = GetWebAppBaseUrl();

            var updated = await _workflowService.ConfirmBookingAsync(
                bookingIdOrRef: id,
                actorRole: "admin",
                actorId: adminId,
                note: dto?.Note,
                site: siteConfig,
                webAppBaseUrl: webAppBaseUrl
            );

            return Ok(new { success = true, data = updated, message = "Booking approved and confirmed successfully." });
        }
        catch (WorkflowTransitionException wEx)
        {
            return StatusCode(StatusCodes.Status409Conflict, new { success = false, error = wEx.Message, currentStatus = wEx.CurrentStatus, targetStatus = wEx.TargetStatus });
        }
        catch (KeyNotFoundException knf)
        {
            return NotFound(new { success = false, error = knf.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 6. Reject Booking ───────────────────────────────────────────────────────
    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> RejectBooking(string id, [FromBody] RejectBookingDto dto)
    {
        var tokenWebsiteId = User?.FindFirst("websiteId")?.Value;
        if (!string.IsNullOrEmpty(tokenWebsiteId) &&
            !string.Equals(tokenWebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Access denied: session belongs to a different website." });
        }

        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(new { success = false, error = "A rejection reason is required." });
        }

        try
        {
            var adminId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst(ClaimTypes.Email)?.Value
                ?? "admin";

            var siteConfig = _websiteContext.CurrentSite
                ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
                ?? WebsiteRegistry.SitesById["gujjutours"];

            var updated = await _workflowService.RejectBookingAsync(
                bookingIdOrRef: id,
                reason: dto.Reason,
                actorRole: "admin",
                actorId: adminId,
                note: dto.Note,
                site: siteConfig
            );

            return Ok(new { success = true, data = updated, message = "Booking rejected successfully." });
        }
        catch (WorkflowTransitionException wEx)
        {
            return StatusCode(StatusCodes.Status409Conflict, new { success = false, error = wEx.Message, currentStatus = wEx.CurrentStatus, targetStatus = wEx.TargetStatus });
        }
        catch (KeyNotFoundException knf)
        {
            return NotFound(new { success = false, error = knf.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 7. Cancel Booking ───────────────────────────────────────────────────────
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelBooking(string id, [FromBody] CancelBookingDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(new { success = false, error = "A cancellation reason is required." });
        }

        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id)
                ?? await _bookingService.GetBookingByReferenceAsync(id);

            if (booking == null || !string.Equals(booking.WebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { success = false, error = "Booking not found in active website database." });
            }

            var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;
            var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAuthenticated = User?.Identity?.IsAuthenticated == true;
            var isAdmin = User?.IsInRole("Admin") == true || User?.IsInRole("SuperAdmin") == true;

            string actorRole = "customer";
            string actorId = "customer";

            if (isAdmin)
            {
                actorRole = "admin";
                actorId = authUserId ?? authEmail ?? "admin";
            }
            else
            {
                bool isAuthorized = false;
                if (isAuthenticated)
                {
                    if (!string.IsNullOrWhiteSpace(authUserId) && string.Equals(booking.UserId, authUserId, StringComparison.OrdinalIgnoreCase))
                    {
                        isAuthorized = true;
                    }
                    else if (!string.IsNullOrWhiteSpace(authEmail) && string.Equals(booking.Email, authEmail, StringComparison.OrdinalIgnoreCase))
                    {
                        isAuthorized = true;
                    }
                }

                if (!isAuthorized && !string.IsNullOrWhiteSpace(dto.Email) &&
                    string.Equals(booking.Email, dto.Email.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    isAuthorized = true;
                }

                if (!isAuthorized && (string.Equals(booking.Id, id, StringComparison.OrdinalIgnoreCase) ||
                                      string.Equals(booking.Reference, id, StringComparison.OrdinalIgnoreCase)))
                {
                    isAuthorized = true;
                }

                if (!isAuthorized)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "You are not authorized to cancel this reservation." });
                }

                actorId = authUserId ?? booking.Email;
            }

            var siteConfig = _websiteContext.CurrentSite
                ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
                ?? WebsiteRegistry.SitesById["gujjutours"];

            var updated = await _workflowService.CancelBookingAsync(
                bookingIdOrRef: booking.Id!,
                reason: dto.Reason,
                actorRole: actorRole,
                actorId: actorId,
                note: dto.Note,
                site: siteConfig
            );

            return Ok(new { success = true, data = updated, message = "Reservation cancelled successfully." });
        }
        catch (WorkflowTransitionException wEx)
        {
            return StatusCode(StatusCodes.Status409Conflict, new { success = false, error = wEx.Message, currentStatus = wEx.CurrentStatus, targetStatus = wEx.TargetStatus });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 8. Bulk Confirm / Reject ───────────────────────────────────────────────
    [HttpPost("bulk-confirm")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> BulkConfirm([FromBody] BulkActionDto dto)
    {
        var siteConfig = _websiteContext.CurrentSite
            ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
            ?? WebsiteRegistry.SitesById["gujjutours"];

        var adminId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin";
        var webAppBaseUrl = GetWebAppBaseUrl();

        var result = new BulkActionResultDto();

        foreach (var id in dto.BookingIds)
        {
            try
            {
                var b = await _workflowService.ConfirmBookingAsync(id, "admin", adminId, dto.Reason, siteConfig, webAppBaseUrl);
                result.Succeeded++;
                result.Results.Add(new BulkActionResultItem { Id = b.Id ?? id, Reference = b.Reference, Success = true, Message = "Confirmed" });
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Results.Add(new BulkActionResultItem { Id = id, Reference = "", Success = false, Message = ex.Message });
            }
        }

        return Ok(new { success = true, data = result });
    }

    [HttpPost("bulk-reject")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> BulkReject([FromBody] BulkActionDto dto)
    {
        var siteConfig = _websiteContext.CurrentSite
            ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
            ?? WebsiteRegistry.SitesById["gujjutours"];

        var adminId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin";
        var reason = !string.IsNullOrWhiteSpace(dto.Reason) ? dto.Reason.Trim() : "Declined by bulk admin review";

        var result = new BulkActionResultDto();

        foreach (var id in dto.BookingIds)
        {
            try
            {
                var b = await _workflowService.RejectBookingAsync(id, reason, "admin", adminId, null, siteConfig);
                result.Succeeded++;
                result.Results.Add(new BulkActionResultItem { Id = b.Id ?? id, Reference = b.Reference, Success = true, Message = "Rejected" });
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Results.Add(new BulkActionResultItem { Id = id, Reference = "", Success = false, Message = ex.Message });
            }
        }

        return Ok(new { success = true, data = result });
    }

    // ─── 9. Resend Email ────────────────────────────────────────────────────────
    [HttpPost("{id}/resend-email")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> ResendEmail(string id, [FromBody] ResendEmailDto? dto)
    {
        try
        {
            var siteConfig = _websiteContext.CurrentSite
                ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
                ?? WebsiteRegistry.SitesById["gujjutours"];

            var webAppBaseUrl = GetWebAppBaseUrl();

            await _workflowService.ResendEmailAsync(id, dto?.Template, dto?.RecipientOverride, siteConfig, webAppBaseUrl);
            return Ok(new { success = true, message = "Transactional email enqueued for delivery." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 10. Customer Request Cancellation ──────────────────────────────────────
    [HttpPost("{id}/request-cancellation")]
    public async Task<IActionResult> RequestCancellation(string id, [FromBody] CustomerCancellationRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(new { success = false, error = "Please provide a reason for the cancellation request." });
        }

        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id)
                ?? await _bookingService.GetBookingByReferenceAsync(id);

            if (booking == null || !string.Equals(booking.WebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { success = false, error = "Booking not found in active website database." });
            }

            var guestEmail = !string.IsNullOrWhiteSpace(dto.Email) ? dto.Email.Trim() : booking.Email;
            var siteConfig = _websiteContext.CurrentSite
                ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
                ?? WebsiteRegistry.SitesById["gujjutours"];

            var webAppBaseUrl = GetWebAppBaseUrl();

            var updated = await _workflowService.SubmitCancellationRequestAsync(booking.Id!, dto.Reason, guestEmail, siteConfig, webAppBaseUrl);
            return Ok(new { success = true, data = updated, message = "Your cancellation request has been submitted for administrative review." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    // ─── 10b. Admin Review Cancellation Request ─────────────────────────────────
    [HttpPost("{id}/review-cancellation")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> ReviewCancellation(string id, [FromBody] ReviewCancellationRequestDto dto)
    {
        try
        {
            var siteConfig = _websiteContext.CurrentSite
                ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
                ?? WebsiteRegistry.SitesById["gujjutours"];

            var adminId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin";
            var webAppBaseUrl = GetWebAppBaseUrl();

            var updated = await _workflowService.ReviewCancellationRequestAsync(id, dto.Approve, dto.AdminNote, adminId, siteConfig, webAppBaseUrl);
            return Ok(new { success = true, data = updated, message = dto.Approve ? "Cancellation request approved." : "Cancellation request declined." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    // ─── 11. Admin Decisions by Signed Action Token ─────────────────────────────
    /// <summary>
    /// Safe, read-only endpoint that verifies an email action token and returns summary metadata.
    /// Prefetch by email scanners strictly triggers this without mutating any state.
    /// </summary>
    [HttpGet("action-token/verify")]
    public async Task<IActionResult> VerifyActionToken([FromQuery] string token)
    {
        var siteConfig = _websiteContext.CurrentSite
            ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
            ?? WebsiteRegistry.SitesById["gujjutours"];

        if (!_actionTokenService.TryValidateToken(token, siteConfig, out var payload, out var err))
        {
            return Ok(new VerifyActionTokenResultDto
            {
                Valid = false,
                Error = err ?? "Invalid action link."
            });
        }

        var booking = await _bookingService.GetBookingByIdAsync(payload!.BookingId)
            ?? await _bookingService.GetBookingByReferenceAsync(payload!.Reference);

        if (booking == null)
        {
            return Ok(new VerifyActionTokenResultDto
            {
                Valid = false,
                Error = "Reservation associated with this link was not found."
            });
        }

        if (booking.UsedActionTokens.Contains(token))
        {
            return Ok(new VerifyActionTokenResultDto
            {
                Valid = false,
                Error = "This decision link has already been used and cannot be reused."
            });
        }

        if (!string.Equals(booking.Status, BookingStatus.Pending, StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new VerifyActionTokenResultDto
            {
                Valid = false,
                CurrentStatus = booking.Status,
                Error = $"This reservation has already been {booking.Status} and cannot be modified via this link."
            });
        }

        return Ok(new VerifyActionTokenResultDto
        {
            Valid = true,
            Action = payload.Action,
            BookingId = booking.Id,
            BookingReference = booking.Reference,
            TourTitle = booking.Snapshot?.Title ?? booking.TourName,
            GuestName = booking.GuestName,
            Email = booking.Email,
            TotalPrice = booking.TotalPrice,
            Currency = booking.Snapshot?.Currency ?? siteConfig.CurrencySymbol,
            CurrentStatus = booking.Status,
            TravelDate = booking.TravelDate != default ? booking.TravelDate : booking.StartDate
        });
    }

    /// <summary>
    /// POST endpoint that executes the admin action using the signed single-use action token.
    /// Requires an explicit POST click, guarding against mail scanner prefetch.
    /// </summary>
    [HttpPost("action-token/execute")]
    public async Task<IActionResult> ExecuteActionToken([FromBody] ExecuteActionTokenDto dto)
    {
        var siteConfig = _websiteContext.CurrentSite
            ?? WebsiteRegistry.Resolve(_websiteContext.CurrentWebsiteId)
            ?? WebsiteRegistry.SitesById["gujjutours"];

        if (!_actionTokenService.TryValidateToken(dto.Token, siteConfig, out var payload, out var err))
        {
            return BadRequest(new { success = false, error = err ?? "Invalid action token." });
        }

        var booking = await _bookingService.GetBookingByIdAsync(payload!.BookingId)
            ?? await _bookingService.GetBookingByReferenceAsync(payload!.Reference);

        if (booking == null)
        {
            return NotFound(new { success = false, error = "Booking not found." });
        }

        if (booking.UsedActionTokens.Contains(dto.Token))
        {
            return BadRequest(new { success = false, error = "This action token has already been executed." });
        }

        var webAppBaseUrl = GetWebAppBaseUrl();
        var action = (!string.IsNullOrWhiteSpace(dto.Action) ? dto.Action : (payload?.Action ?? "")).Trim().ToLowerInvariant();

        Booking updated;

        if (action == "approve" || action == "confirm")
        {
            updated = await _workflowService.ConfirmBookingAsync(
                booking.Id!,
                actorRole: "admin",
                actorId: "email-action-link",
                note: "Confirmed via signed admin email decision link",
                site: siteConfig,
                webAppBaseUrl: webAppBaseUrl
            );
        }
        else if (action == "reject")
        {
            var reason = !string.IsNullOrWhiteSpace(dto.Reason)
                ? dto.Reason.Trim()
                : "Reservation rejected via admin email decision link";

            updated = await _workflowService.RejectBookingAsync(
                booking.Id!,
                reason: reason,
                actorRole: "admin",
                actorId: "email-action-link",
                note: "Rejected via signed admin email decision link",
                site: siteConfig
            );
        }
        else
        {
            return BadRequest(new { success = false, error = $"Unsupported action '{action}'." });
        }

        // Invalidate token by marking it used
        updated.UsedActionTokens.Add(dto.Token);
        await _bookingService.UpdateBookingAsync(updated.Id!, updated);

        return Ok(new
        {
            success = true,
            data = updated,
            message = $"Booking successfully marked as {updated.Status}."
        });
    }

    // ─── 12. Email Outbox Audit for Booking ─────────────────────────────────────
    [HttpGet("{id}/outbox")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> GetBookingOutbox(string id)
    {
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id)
                ?? await _bookingService.GetBookingByReferenceAsync(id);

            if (booking == null || !string.Equals(booking.WebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { success = false, error = "Booking not found." });
            }

            var logs = await _outboxService.GetOutboxForBookingAsync(booking.Id ?? id);
            return Ok(new { success = true, data = logs });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    // ─── 13. Backwards-Compatible Helpers ───────────────────────────────────────
    [HttpPost("lookup")]
    [HttpGet("lookup")]
    public async Task<IActionResult> GuestLookup([FromQuery] string? refParam, [FromQuery] string? emailParam, [FromBody] BookingGuestLookupDto? body)
    {
        var reference = (body?.Reference ?? refParam ?? "").Trim();
        var email = (body?.Email ?? emailParam ?? "").Trim();

        if (string.IsNullOrWhiteSpace(reference) || string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { success = false, error = "Both booking reference number and guest email address are required." });
        }

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        if (!_rateLimiter.IsAllowed(_websiteContext.CurrentWebsiteId, clientIp, "booking_lookup", maxRequests: 10, windowSeconds: 60))
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { success = false, error = "Too many lookup requests. Please wait a minute before trying again." });
        }

        try
        {
            var booking = await _bookingService.GetBookingByReferenceAndEmailAsync(reference, email);
            if (booking is null || !string.Equals(booking.WebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { success = false, error = "No reservation found matching this reference code and email address." });
            }

            return Ok(new { success = true, data = booking });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("validate-coupon")]
    public IActionResult ValidateCoupon([FromBody] CouponValidateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            return BadRequest(new { success = false, error = "Coupon code is required." });
        }

        var normalizedCode = dto.Code.Trim().ToUpperInvariant();
        var currentSite = _websiteContext.CurrentWebsiteId.ToLowerInvariant();
        var subtotal = dto.Subtotal > 0 ? dto.Subtotal : 100.0;

        bool isValid = false;
        string title = "";
        string description = "";
        double discountPercent = 0.0;
        double discountAmount = 0.0;
        string message = "";

        switch (normalizedCode)
        {
            case "GUJJU20":
                if (currentSite == "gujjutours" || currentSite.Contains("gujju"))
                {
                    isValid = true;
                    title = "GujjuTours Royal Expedition Privilege";
                    description = "20% off all cultural & heritage tours";
                    discountPercent = 20.0;
                    discountAmount = Math.Min(3000.0, Math.Round(subtotal * 0.20, 2));
                    message = "20% GujjuTours discount applied successfully!";
                }
                else
                {
                    message = "GUJJU20 is valid exclusively on GujjuTours.";
                }
                break;

            case "TRIPGO15":
                if (currentSite == "tripgoasia" || currentSite.Contains("tripgo"))
                {
                    isValid = true;
                    title = "TripGoAsia Explorer Savings";
                    description = "15% off Southeast Asia adventures";
                    discountPercent = 15.0;
                    discountAmount = Math.Min(150.0, Math.Round(subtotal * 0.15, 2));
                    message = "15% TripGoAsia discount applied successfully!";
                }
                else
                {
                    message = "TRIPGO15 is valid exclusively on TripGoAsia.";
                }
                break;

            case "LUXURY50":
                if (currentSite == "technoheaven" || currentSite.Contains("techno"))
                {
                    isValid = true;
                    title = "Technoheaven Luxury Suite Voucher";
                    description = "$50 flat reduction on luxury journeys";
                    discountAmount = 50.0;
                    discountPercent = Math.Round((50.0 / subtotal) * 100, 1);
                    message = "$50 Luxury travel voucher applied successfully!";
                }
                else
                {
                    message = "LUXURY50 is valid exclusively on Technoheaven Luxury.";
                }
                break;

            case "EXPLORE10":
                isValid = true;
                title = "Global Explorer Privilege";
                description = "10% off worldwide bookings";
                discountPercent = 10.0;
                discountAmount = Math.Round(subtotal * 0.10, 2);
                message = "10% Global Explorer discount applied!";
                break;

            case "EARLYBIRD":
                isValid = true;
                title = "Early Bird Expedition Advantage";
                description = "Flat savings for advance reservations";
                discountAmount = currentSite.Contains("gujju") ? 2000.0 : 30.0;
                discountPercent = Math.Round((discountAmount / subtotal) * 100, 1);
                message = "Early Bird advantage voucher applied!";
                break;

            case "VIPPASS":
                isValid = true;
                title = "VIP Traveler Club Pass";
                description = "12% off premium group departures";
                discountPercent = 12.0;
                discountAmount = Math.Round(subtotal * 0.12, 2);
                message = "12% VIP Traveler Club discount applied!";
                break;

            default:
                message = $"Coupon code '{normalizedCode}' is invalid or expired.";
                break;
        }

        var newTotal = Math.Max(0.0, Math.Round(subtotal - discountAmount, 2));

        return Ok(new
        {
            success = true,
            data = new CouponValidationResultDto
            {
                IsValid = isValid,
                Code = normalizedCode,
                Title = title,
                Description = description,
                DiscountPercent = discountPercent,
                DiscountAmount = discountAmount,
                NewTotal = newTotal,
                Message = message
            }
        });
    }

    [HttpPost("claim")]
    public async Task<IActionResult> ClaimGuestBookings([FromBody] BookingClaimDto dto)
    {
        var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrWhiteSpace(authUserId))
        {
            return Unauthorized(new { success = false, error = "Must be logged in to claim guest bookings." });
        }

        try
        {
            var targetEmail = !string.IsNullOrWhiteSpace(dto.Email) ? dto.Email.Trim() : authEmail;
            var claimedCount = await _bookingService.ClaimGuestBookingsAsync(authUserId, targetEmail, dto.References);

            return Ok(new
            {
                success = true,
                claimed = claimedCount,
                message = $"Successfully linked {claimedCount} earlier bookings to your account."
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingsController.ClaimGuestBookings] Database temporarily unavailable: {ex.Message}");
            return Ok(new { success = false, claimed = 0, error = "Database temporarily unavailable", message = "Could not link bookings at this time." });
        }
    }

    [HttpPost("{id}/pay")]
    [Authorize]
    public async Task<IActionResult> ProcessPayment(string id, [FromBody] BookingPaymentDto dto)
    {
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id)
                ?? await _bookingService.GetBookingByReferenceAsync(id);

            if (booking == null || !string.Equals(booking.WebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { success = false, error = "Booking not found in active website database." });
            }

            var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User?.FindFirst("sub")?.Value;
            var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;
            var isAdmin = User?.IsInRole("Admin") == true || User?.IsInRole("SuperAdmin") == true;

            if (!isAdmin)
            {
                var isOwner = (!string.IsNullOrWhiteSpace(authUserId) && string.Equals(booking.UserId, authUserId, StringComparison.OrdinalIgnoreCase)) ||
                              (!string.IsNullOrWhiteSpace(authEmail) && string.Equals(booking.Email, authEmail, StringComparison.OrdinalIgnoreCase));
                if (!isOwner)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "You are not authorized to process payment for this booking." });
                }
            }

            var method = !string.IsNullOrWhiteSpace(dto.Method) ? dto.Method.Trim().ToLowerInvariant() : "card";
            booking.PaymentMethod = method;
            booking.PaymentStatus = method == "pay_on_arrival" ? "unpaid" : "paid";
            booking.PaymentReference = !string.IsNullOrWhiteSpace(dto.TransactionId)
                ? dto.TransactionId
                : $"TXN-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}";
            booking.PaidAt = method == "pay_on_arrival" ? null : DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            await _bookingService.UpdateBookingAsync(booking.Id!, booking);

            return Ok(new
            {
                success = true,
                message = "Payment registered successfully.",
                data = booking
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        var tokenWebsiteId = User?.FindFirst("websiteId")?.Value;
        if (!string.IsNullOrEmpty(tokenWebsiteId) &&
            !string.Equals(tokenWebsiteId, _websiteContext.CurrentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Access denied: session belongs to a different website." });
        }

        try
        {
            var existing = await _bookingService.GetBookingByIdAsync(id)
                ?? await _bookingService.GetBookingByReferenceAsync(id);

            if (existing == null)
            {
                return NotFound(new { success = false, error = "Booking not found" });
            }

            await _bookingService.DeleteBookingAsync(existing.Id!);
            return Ok(new { success = true, message = "Booking deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }
}