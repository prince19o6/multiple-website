using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ToursApi.Exceptions;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/tours")]
public class ToursController : ControllerBase
{
    private readonly ITourService _tourService;
    private readonly IWebsiteContext _websiteContext;
    private readonly IPackageRepository _packageRepository;
    private readonly IHotelRepository? _hotelRepository;
    private readonly IActivityRepository? _activityRepository;
    private readonly IRestaurantRepository? _restaurantRepository;

    public ToursController(
        ITourService tourService,
        IWebsiteContext websiteContext,
        IPackageRepository packageRepository,
        IHotelRepository? hotelRepository = null,
        IActivityRepository? activityRepository = null,
        IRestaurantRepository? restaurantRepository = null)
    {
        _tourService = tourService;
        _websiteContext = websiteContext;
        _packageRepository = packageRepository;
        _hotelRepository = hotelRepository;
        _activityRepository = activityRepository;
        _restaurantRepository = restaurantRepository;
    }

    private static object MapHotelToTour(Hotel h)
    {
        var images = h.Images != null && h.Images.Count > 0 ? h.Images : (!string.IsNullOrEmpty(h.CoverImage) ? new List<string> { h.CoverImage } : new List<string>());
        var mainImg = images.Count > 0 ? images[0] : "/images/placeholder.jpg";
        var cityName = h.Destination?.CityName ?? "";
        var country = h.Destination?.Country ?? "";
        var location = !string.IsNullOrEmpty(cityName) ? (string.IsNullOrEmpty(country) ? cityName : $"{cityName}, {country}") : (h.Destination?.Address ?? "India");
        var numId = Math.Abs((h.Slug ?? h.Id ?? "hotel").GetHashCode()) % 90000 + 10000;

        return new
        {
            _id = h.Id,
            id = numId,
            tourNumericId = numId,
            hotelNumericId = numId,
            websiteId = h.WebsiteId,
            website = h.WebsiteId,
            tenantId = h.WebsiteId,
            title = h.Title,
            name = h.Title,
            slug = h.Slug,
            category = h.PropertyType ?? "Hotel",
            categorySlug = (h.PropertyType ?? "hotel").ToLowerInvariant(),
            destination = cityName,
            city = cityName,
            country = country,
            location = location,
            description = !string.IsNullOrEmpty(h.Description) ? h.Description : $"{h.Title} in {location}",
            shortDescription = !string.IsNullOrEmpty(h.Description) ? h.Description : h.Title,
            fullDescription = !string.IsNullOrEmpty(h.Description) ? h.Description : h.Title,
            price = h.PricePerNight,
            originalPrice = h.CompareAtPrice ?? (h.PricePerNight > 0 ? h.PricePerNight * 1.2 : 0),
            discountedPrice = h.PricePerNight,
            startingPrice = h.PricePerNight,
            currency = h.Currency ?? "INR",
            duration = "1 Night",
            durationDays = 1,
            durationNights = 1,
            difficulty = "Easy",
            rating = h.Rating > 0 ? h.Rating : 4.5,
            reviews = h.ReviewCount > 0 ? h.ReviewCount : 85,
            reviewCount = h.ReviewCount > 0 ? h.ReviewCount : 85,
            image = mainImg,
            coverImage = mainImg,
            images = images,
            gallery = images,
            groupSize = "1-4 guests",
            highlights = h.Amenities != null && h.Amenities.Count > 0 ? h.Amenities : new List<string> { "Free Wi-Fi", "Air Conditioning", "Room Service" },
            included = h.Amenities != null && h.Amenities.Count > 0 ? h.Amenities : new List<string> { "Accommodation", "Taxes & Service Fees" },
            inclusions = h.Amenities != null && h.Amenities.Count > 0 ? h.Amenities : new List<string> { "Accommodation", "Taxes & Service Fees" },
            excluded = new List<string> { "Personal Expenses", "Airport Transfer (optional)" },
            exclusions = new List<string> { "Personal Expenses", "Airport Transfer (optional)" },
            dietaryFeatures = h.DietaryFeatures,
            rooms = h.Rooms,
            policies = h.Policies,
            featured = h.Featured,
            popular = h.Popular,
            status = "Active",
            isActive = true,
        };
    }

    private static object MapActivityToTour(Activity a)
    {
        var images = a.Images != null && a.Images.Count > 0 ? a.Images : (!string.IsNullOrEmpty(a.Image) ? new List<string> { a.Image } : new List<string>());
        var mainImg = images.Count > 0 ? images[0] : "/images/placeholder.jpg";
        var numId = a.ActivityNumericId > 0 ? a.ActivityNumericId : (Math.Abs((a.Slug ?? a.Id ?? "activity").GetHashCode()) % 90000 + 10000);

        return new
        {
            _id = a.Id,
            id = numId,
            tourNumericId = numId,
            activityNumericId = a.ActivityNumericId,
            websiteId = a.WebsiteId,
            website = a.Website,
            tenantId = a.TenantId,
            title = a.Title,
            name = !string.IsNullOrEmpty(a.Title) ? a.Title : a.Name,
            slug = a.Slug,
            category = a.Category ?? "Activity",
            categorySlug = a.CategorySlug ?? (a.Category ?? "activity").ToLowerInvariant(),
            destination = a.Destination,
            city = a.City ?? a.Destination,
            country = a.Country,
            location = !string.IsNullOrEmpty(a.Location) ? a.Location : (!string.IsNullOrEmpty(a.City) ? $"{a.City}, {a.Country}" : a.Destination),
            description = !string.IsNullOrEmpty(a.Description) ? a.Description : a.Title,
            shortDescription = a.ShortDescription ?? a.Title,
            fullDescription = a.FullDescription ?? a.Description ?? a.Title,
            price = a.Price,
            originalPrice = a.OriginalPrice,
            discountedPrice = a.Price,
            startingPrice = a.Price,
            currency = a.Currency ?? "INR",
            duration = a.Duration ?? "3-4 hours",
            durationDays = 1,
            durationNights = 0,
            difficulty = "Easy",
            rating = a.Rating > 0 ? a.Rating : 4.7,
            reviews = a.Reviews > 0 ? a.Reviews : (a.ReviewCount ?? 95),
            reviewCount = a.ReviewCount ?? (a.Reviews > 0 ? a.Reviews : 95),
            image = mainImg,
            coverImage = mainImg,
            images = images,
            gallery = images,
            groupSize = "2-10 travelers",
            highlights = a.Highlights != null && a.Highlights.Count > 0 ? a.Highlights : (a.Inclusions ?? new List<string>()),
            included = a.Inclusions != null && a.Inclusions.Count > 0 ? a.Inclusions : (a.Included ?? new List<string>()),
            inclusions = a.Inclusions != null && a.Inclusions.Count > 0 ? a.Inclusions : (a.Included ?? new List<string>()),
            excluded = a.Exclusions ?? a.Excluded ?? new List<string>(),
            exclusions = a.Exclusions ?? a.Excluded ?? new List<string>(),
            itinerary = a.Itinerary,
            dietaryFeatures = a.DietaryFeatures,
            featured = a.Featured,
            popular = a.Popular,
            status = a.IsActive ? "Active" : "Inactive",
            isActive = a.IsActive,
        };
    }

    private static object MapRestaurantToTour(Restaurant r)
    {
        var images = r.Images != null && r.Images.Count > 0 ? r.Images : (!string.IsNullOrEmpty(r.Image) ? new List<string> { r.Image } : new List<string>());
        var mainImg = images.Count > 0 ? images[0] : "/images/placeholder.jpg";
        var location = !string.IsNullOrEmpty(r.City) ? $"{r.City}, {r.Country}" : r.Address;
        var numId = r.RestaurantNumericId > 0 ? r.RestaurantNumericId : (Math.Abs((r.Slug ?? r.Id ?? "restaurant").GetHashCode()) % 90000 + 10000);
        var desc = !string.IsNullOrEmpty(r.Overview) ? r.Overview : $"{r.Name} - {r.CuisineLabel} in {location}";

        return new
        {
            _id = r.Id,
            id = numId,
            tourNumericId = numId,
            restaurantNumericId = r.RestaurantNumericId,
            websiteId = r.WebsiteId,
            website = r.Website ?? r.WebsiteId,
            tenantId = r.WebsiteId,
            title = !string.IsNullOrEmpty(r.Title) ? r.Title : r.Name,
            name = !string.IsNullOrEmpty(r.Name) ? r.Name : r.Title,
            slug = r.Slug,
            category = r.CuisineLabel ?? r.Cuisine ?? "Dining",
            categorySlug = (r.Cuisine ?? "dining").ToLowerInvariant(),
            destination = r.City,
            city = r.City,
            country = r.Country,
            location = location,
            description = desc,
            shortDescription = desc,
            fullDescription = desc,
            price = r.CostForTwo > 0 ? r.CostForTwo : 500,
            originalPrice = (r.CostForTwo > 0 ? r.CostForTwo : 500) * 1.2,
            discountedPrice = r.CostForTwo > 0 ? r.CostForTwo : 500,
            startingPrice = r.CostForTwo > 0 ? r.CostForTwo : 500,
            currency = r.Currency ?? "INR",
            duration = "2 hours",
            durationDays = 1,
            durationNights = 0,
            difficulty = "Easy",
            rating = r.Rating > 0 ? r.Rating : 4.6,
            reviews = r.Reviews > 0 ? r.Reviews : 60,
            reviewCount = r.Reviews > 0 ? r.Reviews : 60,
            image = mainImg,
            coverImage = mainImg,
            images = images,
            gallery = images,
            groupSize = "Table for 2-8",
            highlights = r.Specialties != null && r.Specialties.Count > 0 ? r.Specialties : new List<string> { "Authentic Cuisine", "Fresh Ingredients" },
            included = new List<string> { "Table Reservation", "Welcome Drink" },
            inclusions = new List<string> { "Table Reservation", "Welcome Drink" },
            excluded = new List<string> { "Additional Orders", "Alcoholic Beverages" },
            exclusions = new List<string> { "Additional Orders", "Alcoholic Beverages" },
            dietaryFeatures = new HotelDietaryFeatures
            {
                PureVeg = r.IsPureVeg,
                JainAvailable = r.IsJainAvailable,
                HalalCertified = r.IsHalalCertified
            },
            featured = r.Featured,
            popular = r.Popular,
            status = r.Status ?? "Active",
            isActive = true,
        };
    }

    private static object MapPackageToTour(Package p)
    {
        var images = p.Images != null && p.Images.Count > 0 ? p.Images : (!string.IsNullOrEmpty(p.Image) ? new List<string> { p.Image } : new List<string>());
        return new
        {
            _id = p.Id,
            id = p.PackageNumericId > 0 ? p.PackageNumericId : 1000,
            tourNumericId = p.PackageNumericId,
            packageNumericId = p.PackageNumericId,
            websiteId = p.WebsiteId,
            website = p.Website ?? p.WebsiteId,
            tenantId = p.WebsiteId,
            title = p.Title,
            name = !string.IsNullOrEmpty(p.Title) ? p.Title : p.Name,
            slug = p.Slug,
            category = p.Category,
            categorySlug = p.CategorySlug,
            destination = p.Destination,
            city = !string.IsNullOrEmpty(p.City) ? p.City : p.Destination,
            country = p.Country,
            location = !string.IsNullOrEmpty(p.City) ? $"{p.City}, {p.Country}" : p.Destination,
            description = p.Itinerary != null && p.Itinerary.Count > 0 && !string.IsNullOrEmpty(p.Itinerary[0].Description) ? p.Itinerary[0].Description : p.Title,
            shortDescription = p.Title,
            fullDescription = p.Title,
            price = p.Price > 0 ? p.Price : (p.StartingPrice > 0 ? p.StartingPrice : 0),
            originalPrice = p.OriginalPrice,
            discountedPrice = p.StartingPrice > 0 ? p.StartingPrice : p.Price,
            startingPrice = p.StartingPrice,
            currency = p.Currency ?? "INR",
            duration = p.Duration,
            durationDays = p.DurationDays,
            durationNights = p.DurationNights,
            difficulty = "Easy",
            rating = p.Rating > 0 ? p.Rating : 4.8,
            reviews = p.Reviews > 0 ? p.Reviews : (p.ReviewCount > 0 ? p.ReviewCount : 120),
            reviewCount = p.ReviewCount > 0 ? p.ReviewCount : (p.Reviews > 0 ? p.Reviews : 120),
            image = !string.IsNullOrEmpty(p.Image) ? p.Image : (images.Count > 0 ? images[0] : null),
            coverImage = p.CoverImage ?? p.Image,
            images = images,
            gallery = images,
            groupSize = "2-12 travelers",
            highlights = p.KeyInclusions != null && p.KeyInclusions.Count > 0 ? p.KeyInclusions : (p.Inclusions ?? new List<string>()),
            included = p.Inclusions != null && p.Inclusions.Count > 0 ? p.Inclusions : (p.KeyInclusions ?? new List<string>()),
            inclusions = p.Inclusions != null && p.Inclusions.Count > 0 ? p.Inclusions : (p.KeyInclusions ?? new List<string>()),
            excluded = p.Exclusions ?? new List<string>(),
            exclusions = p.Exclusions ?? new List<string>(),
            itinerary = p.Itinerary,
            dietaryFeatures = p.DietaryFeatures,
            departureDates = p.DepartureDates,
            availableDates = p.DepartureDates,
            featured = p.Featured,
            popular = p.Popular,
            status = p.Status ?? "Active",
            isActive = p.Status != "Inactive",
        };
    }

    private IActionResult HandleException(Exception ex)
    {
        if (ex is MongoDatabaseUnavailableException or MongoException or TimeoutException)
        {
            var seedTours = ToursApi.Configuration.SeedDataCatalog.GetTours(_websiteContext.CurrentWebsiteId);
            return Ok(new
            {
                success = true,
                data = seedTours,
                count = seedTours.Count,
                totalCount = seedTours.Count,
                page = 1,
                limit = seedTours.Count,
                dataSource = "offline-fallback"
            });
        }
        return StatusCode(500, new { success = false, error = ex.Message });
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

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        [FromQuery] bool? featured,
        [FromQuery] bool? popular,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] int? limit,
        [FromQuery] string? sort,
        [FromQuery] string? search,
        [FromQuery] string? q,
        [FromQuery] string? destination,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice)
    {
        try
        {
            var resolvedPage = page ?? 1;
            var resolvedPageSize = pageSize ?? limit ?? 20;
            var queryTerm = search ?? q ?? destination;

            if (!string.IsNullOrWhiteSpace(queryTerm) || minPrice.HasValue || maxPrice.HasValue)
            {
                var searchResults = await _tourService.SearchToursAsync(queryTerm, minPrice, maxPrice, null, sort);
                var searchList = searchResults.ToList();
                if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
                {
                    searchList = searchList.Where(t => string.Equals(t.Category, category, StringComparison.OrdinalIgnoreCase)).ToList();
                }

                var total = searchList.Count;
                var paged = searchList.Skip((resolvedPage - 1) * resolvedPageSize).Take(resolvedPageSize).ToList();

                return Ok(new
                {
                    items = paged,
                    total = total,
                    page = resolvedPage,
                    pageSize = resolvedPageSize,
                    totalPages = (int)Math.Ceiling((double)total / (resolvedPageSize > 0 ? resolvedPageSize : 20)),
                    success = true,
                    data = paged,
                    count = paged.Count,
                    totalCount = total
                });
            }

            var tours = await _tourService.GetAllToursAsync(category, featured, popular, resolvedPage, resolvedPageSize, sort);
            var tourList = tours.ToList();
            var totalCount = await _tourService.GetToursCountAsync(category, featured, popular);
            if (totalCount == 0 && tourList.Count > 0) totalCount = tourList.Count;

            return Ok(new
            {
                items = tourList,
                total = totalCount,
                page = resolvedPage,
                pageSize = resolvedPageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / (resolvedPageSize > 0 ? resolvedPageSize : 20)),
                success = true,
                data = tourList,
                count = tourList.Count,
                totalCount = totalCount
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        try
        {
            var tours = await _tourService.GetAllToursAsync(null, null, null, null, null, null);
            var categories = tours
                .Where(t => !string.IsNullOrWhiteSpace(t.Category))
                .GroupBy(t => t.Category)
                .Select(g => new
                {
                    id = g.Key.ToLowerInvariant().Replace(" ", "-"),
                    name = g.Key,
                    slug = g.Key.ToLowerInvariant().Replace(" ", "-"),
                    count = g.Count()
                })
                .ToList();

            return Ok(new
            {
                success = true,
                data = categories
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? search,
        [FromQuery] string? destination,
        [FromQuery] string? category,
        [FromQuery] double? minPrice,
        [FromQuery] double? maxPrice,
        [FromQuery] string? difficulty,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var queryTerm = q ?? search ?? destination;
            var tours = await _tourService.SearchToursAsync(queryTerm, minPrice, maxPrice, difficulty, sort);
            var tourList = tours.ToList();
            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                tourList = tourList.Where(t => string.Equals(t.Category, category, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            var total = tourList.Count;
            var paged = tourList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return Ok(new
            {
                items = paged,
                total = total,
                page = page,
                pageSize = pageSize,
                totalPages = (int)Math.Ceiling((double)total / (pageSize > 0 ? pageSize : 20)),
                success = true,
                data = paged,
                count = paged.Count
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var tour = await _tourService.GetTourByIdAsync(id)
                       ?? await _tourService.GetTourBySlugAsync(id);

            if (tour is null && int.TryParse(id, out var numId))
            {
                tour = await _tourService.GetTourByNumericIdAsync(numId);
            }

            if (tour is null)
            {
                var pkg = await _packageRepository.GetPackageBySlugAsync(id)
                          ?? await _packageRepository.GetPackageByIdAsync(id);

                if (pkg is not null)
                {
                    return Ok(new { success = true, data = MapPackageToTour(pkg) });
                }

                if (_hotelRepository is not null)
                {
                    var hotel = await _hotelRepository.GetHotelBySlugAsync(id)
                                ?? await _hotelRepository.GetHotelByIdAsync(id);
                    if (hotel is not null)
                    {
                        return Ok(new { success = true, data = MapHotelToTour(hotel) });
                    }
                }

                if (_activityRepository is not null)
                {
                    var act = await _activityRepository.GetActivityByIdOrSlugAsync(id);
                    if (act is not null)
                    {
                        return Ok(new { success = true, data = MapActivityToTour(act) });
                    }
                }

                if (_restaurantRepository is not null)
                {
                    var rest = await _restaurantRepository.GetRestaurantBySlugAsync(id)
                               ?? await _restaurantRepository.GetRestaurantByIdAsync(id);
                    if (rest is not null)
                    {
                        return Ok(new { success = true, data = MapRestaurantToTour(rest) });
                    }
                }

                var resilient = ResilientDataGenerator.GetTourByIdOrSlug(id, _websiteContext.CurrentWebsiteId);
                if (resilient is not null)
                {
                    return Ok(new { success = true, data = resilient });
                }

                return NotFound(new { success = false, message = $"Tour '{id}' not found." });
            }

            return Ok(new { success = true, data = tour });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("by-slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        try
        {
            var tour = await _tourService.GetTourBySlugAsync(slug)
                       ?? await _tourService.GetTourByIdAsync(slug);

            if (tour is null)
            {
                var pkg = await _packageRepository.GetPackageBySlugAsync(slug)
                          ?? await _packageRepository.GetPackageByIdAsync(slug);

                if (pkg is not null)
                {
                    return Ok(new { success = true, data = MapPackageToTour(pkg) });
                }

                if (_hotelRepository is not null)
                {
                    var hotel = await _hotelRepository.GetHotelBySlugAsync(slug)
                                ?? await _hotelRepository.GetHotelByIdAsync(slug);
                    if (hotel is not null)
                    {
                        return Ok(new { success = true, data = MapHotelToTour(hotel) });
                    }
                }

                if (_activityRepository is not null)
                {
                    var act = await _activityRepository.GetActivityByIdOrSlugAsync(slug);
                    if (act is not null)
                    {
                        return Ok(new { success = true, data = MapActivityToTour(act) });
                    }
                }

                if (_restaurantRepository is not null)
                {
                    var rest = await _restaurantRepository.GetRestaurantBySlugAsync(slug)
                               ?? await _restaurantRepository.GetRestaurantByIdAsync(slug);
                    if (rest is not null)
                    {
                        return Ok(new { success = true, data = MapRestaurantToTour(rest) });
                    }
                }

                var resilient = ResilientDataGenerator.GetTourByIdOrSlug(slug, _websiteContext.CurrentWebsiteId);
                if (resilient is not null)
                {
                    return Ok(new { success = true, data = resilient });
                }

                return NotFound(new { success = false, message = $"Tour '{slug}' not found." });
            }

            return Ok(new { success = true, data = tour });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("by-number/{id:int}")]
    public async Task<IActionResult> GetByNumericId(int id)
    {
        try
        {
            var tour = await _tourService.GetTourByNumericIdAsync(id);

            if (tour is null)
            {
                return NotFound(new { success = false, message = $"Tour with id '{id}' not found." });
            }

            return Ok(new { success = true, data = tour });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpGet("{id}/similar")]
    public async Task<IActionResult> GetSimilar(string id, [FromQuery] int limit = 4)
    {
        try
        {
            var tours = await _tourService.GetSimilarToursAsync(id, limit);
            var tourList = tours.ToList();
            return Ok(new { success = true, data = tourList, count = tourList.Count });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPost("{id}/reviews")]
    public async Task<IActionResult> AddReview(string id, [FromBody] GuestReview review)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(review.Author))
            {
                var userName = User.FindFirst(ClaimTypes.Name)?.Value;
                if (!string.IsNullOrWhiteSpace(userName))
                {
                    review.Author = userName;
                }
            }

            var created = await _tourService.AddReviewAsync(id, review);
            if (created == null)
            {
                return NotFound(new { success = false, error = "Tour not found on this website" });
            }

            return StatusCode(StatusCodes.Status201Created, new
            {
                success = true,
                data = created,
                message = "Review submitted successfully!"
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Create([FromBody] Tour tour)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            tour.Website = _websiteContext.CurrentWebsiteId;
            tour.WebsiteId = _websiteContext.CurrentWebsiteId;
            if (string.IsNullOrWhiteSpace(tour.Currency))
            {
                tour.Currency = _websiteContext.CurrentSite?.CurrencySymbol ?? "$";
            }
            if (tour.CreatedAt == null)
            {
                tour.CreatedAt = DateTime.UtcNow;
            }
            tour.UpdatedAt = DateTime.UtcNow;

            await _tourService.CreateTourAsync(tour);
            return StatusCode(201, new { success = true, data = tour, message = "Tour package created successfully." });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] Tour updated)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            var existing = await _tourService.GetTourByIdAsync(id);
            if (existing is null)
            {
                return NotFound(new { success = false, error = "Tour not found on this website" });
            }

            updated.Id = id;
            updated.Website = _websiteContext.CurrentWebsiteId;
            updated.WebsiteId = _websiteContext.CurrentWebsiteId;
            updated.UpdatedAt = DateTime.UtcNow;
            if (existing.CreatedAt.HasValue && !updated.CreatedAt.HasValue)
            {
                updated.CreatedAt = existing.CreatedAt;
            }

            await _tourService.UpdateTourAsync(id, updated);
            return Ok(new { success = true, data = updated, message = "Tour package updated successfully." });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpPatch("{id}/toggle")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Toggle(string id, [FromBody] TourToggleDto dto)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            var existing = await _tourService.GetTourByIdAsync(id);
            if (existing is null)
            {
                return NotFound(new { success = false, error = "Tour not found on this website" });
            }

            if (string.Equals(dto.Property, "featured", StringComparison.OrdinalIgnoreCase))
            {
                existing.Featured = dto.Value;
            }
            else if (string.Equals(dto.Property, "popular", StringComparison.OrdinalIgnoreCase))
            {
                existing.Popular = dto.Value;
            }

            existing.UpdatedAt = DateTime.UtcNow;
            await _tourService.UpdateTourAsync(id, existing);

            return Ok(new
            {
                success = true,
                data = existing,
                message = $"Tour '{existing.Name}' {dto.Property} set to {dto.Value}."
            });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        try
        {
            var existing = await _tourService.GetTourByIdAsync(id);
            if (existing is null)
            {
                return NotFound(new { success = false, error = "Tour not found on this website" });
            }

            await _tourService.DeleteTourAsync(id);
            return Ok(new { success = true, message = "Tour deleted successfully" });
        }
        catch (Exception ex)
        {
            return HandleException(ex);
        }
    }
}

public class TourToggleDto
{
    public required string Property { get; set; }
    public bool Value { get; set; }
}