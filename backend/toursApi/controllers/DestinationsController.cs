using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Exceptions;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/destinations")]
    public class DestinationsController : ControllerBase
    {
        private readonly IDestinationRepository _repo;
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _databaseProvider;
        private readonly ITourService _tourService;

        public DestinationsController(
            IDestinationRepository repo,
            IWebsiteContext websiteContext,
            IMongoDatabaseProvider databaseProvider,
            ITourService tourService)
        {
            _repo = repo;
            _websiteContext = websiteContext;
            _databaseProvider = databaseProvider;
            _tourService = tourService;
        }

        private IMongoCollection<DestinationLandmark> GetLandmarksCollection()
        {
            var dbName = _websiteContext.DatabaseName;
            var db = _databaseProvider.GetDatabase(dbName);
            return db.GetCollection<DestinationLandmark>("destination_landmarks");
        }

        private IMongoCollection<Tour> GetToursCollection()
        {
            var dbName = _websiteContext.DatabaseName;
            var db = _databaseProvider.GetDatabase(dbName);
            return db.GetCollection<Tour>("tours");
        }

        private IActionResult HandleException(Exception ex)
        {
            if (ex is MongoDatabaseUnavailableException or MongoException or TimeoutException)
            {
                var seedDestinations = ToursApi.Configuration.SeedDataCatalog.GetDestinations(_websiteContext.CurrentWebsiteId);
                return Ok(new
                {
                    success = true,
                    data = seedDestinations,
                    count = seedDestinations.Count,
                    totalCount = seedDestinations.Count,
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
            [FromQuery] string? search,
            [FromQuery] string? q,
            [FromQuery] string? category,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string? sort = null)
        {
            try
            {
                var siteId = _websiteContext.CurrentWebsiteId.ToLowerInvariant();
                var destinations = (await _repo.GetAllAsync()).ToList();

                // Fallback to brand-tailored catalog if repository is empty
                if (destinations.Count == 0)
                {
                    destinations = siteId switch
                    {
                        "tripgoasia" or "website2" => SeedDataCatalog.Website2Destinations(),
                        "technoheaven" or "website3" => SeedDataCatalog.Website3Destinations(),
                        _ => SeedDataCatalog.Website1Destinations()
                    };
                }

                // Compute exact tour counts dynamically from active tours
                try
                {
                    var allTours = (await _tourService.GetAllToursAsync(null, null, null, 1, 100, null)).ToList();

                    if (allTours == null || allTours.Count == 0)
                    {
                        allTours = siteId switch
                        {
                            "tripgoasia" or "website2" => SeedDataCatalog.Website2Tours(),
                            "technoheaven" or "website3" => SeedDataCatalog.Website3Tours(),
                            _ => SeedDataCatalog.Website1Tours()
                        };
                    }

                    if (allTours != null && allTours.Count > 0)
                    {
                        var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                        {
                            "tour", "tours", "city", "area", "region", "park", "and", "the", "national"
                        };

                        foreach (var dest in destinations)
                        {
                            var destName = (dest.Name ?? "").Trim();
                            var parts = destName.Split(',').Select(p => p.Trim()).Where(p => !string.IsNullOrEmpty(p)).ToArray();
                            var primary = parts.Length > 0 ? parts[0] : destName;
                            var secondary = parts.Length > 1 ? parts[1] : (dest.Country ?? "");

                            var primaryTokens = primary
                                .Split(new[] { ' ', '-', '/', '&', '(', ')' }, StringSplitOptions.RemoveEmptyEntries)
                                .Select(w => new string(w.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant())
                                .Where(w => w.Length >= 3 && !stopWords.Contains(w))
                                .ToList();

                            var count = allTours.Count(t =>
                            {
                                var tName = t.Name ?? "";
                                var tDest = t.Destination ?? "";
                                var tLoc = t.Location ?? "";
                                var tCountry = t.Country ?? "";
                                var tDesc = t.Description ?? "";
                                var combined = $"{tName} {tDest} {tLoc} {tCountry} {tDesc}";

                                if (combined.Contains(primary, StringComparison.OrdinalIgnoreCase)) return true;
                                if (!string.IsNullOrEmpty(tDest) && (primary.Contains(tDest, StringComparison.OrdinalIgnoreCase) || tDest.Contains(primary, StringComparison.OrdinalIgnoreCase))) return true;
                                if (!string.IsNullOrEmpty(tLoc) && (primary.Contains(tLoc, StringComparison.OrdinalIgnoreCase) || tLoc.Contains(primary, StringComparison.OrdinalIgnoreCase))) return true;
                                if (primaryTokens.Count > 0 && primaryTokens.Any(tok =>
                                    tName.Contains(tok, StringComparison.OrdinalIgnoreCase) ||
                                    tDest.Contains(tok, StringComparison.OrdinalIgnoreCase) ||
                                    tLoc.Contains(tok, StringComparison.OrdinalIgnoreCase) ||
                                    tCountry.Contains(tok, StringComparison.OrdinalIgnoreCase)))
                                {
                                    return true;
                                }
                                if (!string.IsNullOrEmpty(secondary) && secondary.Length >= 4 &&
                                    (tCountry.Contains(secondary, StringComparison.OrdinalIgnoreCase) || tLoc.Contains(secondary, StringComparison.OrdinalIgnoreCase)) &&
                                    (primaryTokens.Count == 0 || primaryTokens.Any(tok => combined.Contains(tok, StringComparison.OrdinalIgnoreCase))))
                                {
                                    return true;
                                }
                                return false;
                            });

                            dest.Tours = count;
                        }

                        // If all existing repository destinations had 0 tours (e.g. stale mismatch data), swap to brand-curated destinations
                        if (destinations.All(d => d.Tours == 0))
                        {
                            var curated = siteId switch
                            {
                                "tripgoasia" or "website2" => SeedDataCatalog.Website2Destinations(),
                                "technoheaven" or "website3" => SeedDataCatalog.Website3Destinations(),
                                _ => SeedDataCatalog.Website1Destinations()
                            };

                            foreach (var dest in curated)
                            {
                                var destName = (dest.Name ?? "").Trim();
                                var parts = destName.Split(',').Select(p => p.Trim()).Where(p => !string.IsNullOrEmpty(p)).ToArray();
                                var primary = parts.Length > 0 ? parts[0] : destName;
                                var secondary = parts.Length > 1 ? parts[1] : (dest.Country ?? "");

                                var primaryTokens = primary
                                    .Split(new[] { ' ', '-', '/', '&', '(', ')' }, StringSplitOptions.RemoveEmptyEntries)
                                    .Select(w => new string(w.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant())
                                    .Where(w => w.Length >= 3 && !stopWords.Contains(w))
                                    .ToList();

                                var count = allTours.Count(t =>
                                {
                                    var tName = t.Name ?? "";
                                    var tDest = t.Destination ?? "";
                                    var tLoc = t.Location ?? "";
                                    var tCountry = t.Country ?? "";
                                    var tDesc = t.Description ?? "";
                                    var combined = $"{tName} {tDest} {tLoc} {tCountry} {tDesc}";

                                    if (combined.Contains(primary, StringComparison.OrdinalIgnoreCase)) return true;
                                    if (!string.IsNullOrEmpty(tDest) && (primary.Contains(tDest, StringComparison.OrdinalIgnoreCase) || tDest.Contains(primary, StringComparison.OrdinalIgnoreCase))) return true;
                                    if (!string.IsNullOrEmpty(tLoc) && (primary.Contains(tLoc, StringComparison.OrdinalIgnoreCase) || tLoc.Contains(primary, StringComparison.OrdinalIgnoreCase))) return true;
                                    if (primaryTokens.Count > 0 && primaryTokens.Any(tok =>
                                        tName.Contains(tok, StringComparison.OrdinalIgnoreCase) ||
                                        tDest.Contains(tok, StringComparison.OrdinalIgnoreCase) ||
                                        tLoc.Contains(tok, StringComparison.OrdinalIgnoreCase) ||
                                        tCountry.Contains(tok, StringComparison.OrdinalIgnoreCase)))
                                    {
                                        return true;
                                    }
                                    if (!string.IsNullOrEmpty(secondary) && secondary.Length >= 4 &&
                                        (tCountry.Contains(secondary, StringComparison.OrdinalIgnoreCase) || tLoc.Contains(secondary, StringComparison.OrdinalIgnoreCase)) &&
                                        (primaryTokens.Count == 0 || primaryTokens.Any(tok => combined.Contains(tok, StringComparison.OrdinalIgnoreCase))))
                                    {
                                        return true;
                                    }
                                    return false;
                                });

                                dest.Tours = count;
                            }

                            destinations = curated;
                        }

                        // Order destinations with available tours first
                        destinations = destinations
                            .OrderByDescending(d => d.Tours > 0 ? 1 : 0)
                            .ThenByDescending(d => d.Tours)
                            .ThenBy(d => d.SortOrder)
                            .ToList();
                    }
                }
                catch
                {
                    // Fall back cleanly to repository destinations
                }

                var filtered = destinations.AsEnumerable();
                var searchKey = search ?? q;
                if (!string.IsNullOrWhiteSpace(searchKey))
                {
                    filtered = filtered.Where(d =>
                        (d.Name != null && d.Name.Contains(searchKey, StringComparison.OrdinalIgnoreCase)) ||
                        (d.Country != null && d.Country.Contains(searchKey, StringComparison.OrdinalIgnoreCase)));
                }

                if (sort == "name_asc") filtered = filtered.OrderBy(d => d.Name);
                else if (sort == "name_desc") filtered = filtered.OrderByDescending(d => d.Name);
                else if (sort == "tours_desc") filtered = filtered.OrderByDescending(d => d.Tours);

                var total = filtered.Count();
                var paged = filtered.Skip(Math.Max(0, (page - 1) * pageSize)).Take(pageSize).ToList();

                return Ok(new
                {
                    success = true,
                    items = paged,
                    total = total,
                    page = page,
                    pageSize = pageSize,
                    data = paged,
                    count = paged.Count,
                    totalCount = total
                });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        [HttpGet("landmarks")]
        public async Task<IActionResult> GetLandmarks([FromQuery] string? category, [FromQuery] int? tourId, [FromQuery] string? search, [FromQuery] bool? featuredOnly)
        {
            try
            {
                var collection = GetLandmarksCollection();
                var siteId = _websiteContext.CurrentWebsiteId.ToLowerInvariant();

                // Check if collection has records; if not, seed default curated landmarks for this brand
                var existingCount = await collection.CountDocumentsAsync(Builders<DestinationLandmark>.Filter.Empty);
                if (existingCount == 0)
                {
                    var seedLandmarks = GenerateSeedLandmarks(siteId);
                    if (seedLandmarks.Count > 0)
                    {
                        await collection.InsertManyAsync(seedLandmarks);
                    }
                }

                var filterBuilder = Builders<DestinationLandmark>.Filter;
                var filter = filterBuilder.Empty;

                if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
                {
                    filter &= filterBuilder.Regex(x => x.Category, new MongoDB.Bson.BsonRegularExpression(category, "i"));
                }

                if (tourId.HasValue && tourId.Value > 0)
                {
                    filter &= filterBuilder.Eq(x => x.TourId, tourId.Value);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.Trim();
                    var regex = new MongoDB.Bson.BsonRegularExpression(s, "i");
                    var searchFilter = filterBuilder.Or(
                        filterBuilder.Regex(x => x.Title, regex),
                        filterBuilder.Regex(x => x.City, regex),
                        filterBuilder.Regex(x => x.Region, regex),
                        filterBuilder.Regex(x => x.Subtitle, regex)
                    );
                    filter &= searchFilter;
                }

                if (featuredOnly.HasValue && featuredOnly.Value)
                {
                    filter &= filterBuilder.Eq(x => x.IsFeatured, true);
                }

                var landmarks = await collection.Find(filter).ToListAsync();

                // Also fetch all available categories for the category pill bar
                var allLandmarks = await collection.Find(Builders<DestinationLandmark>.Filter.Empty).ToListAsync();
                var distinctCategories = allLandmarks
                    .Select(x => x.Category)
                    .Where(c => !string.IsNullOrWhiteSpace(c))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(c => c)
                    .ToList();

                var response = new DestinationWaypointsResponseDto
                {
                    Success = true,
                    SiteId = siteId,
                    TotalLandmarks = landmarks.Count,
                    Categories = distinctCategories,
                    Landmarks = landmarks
                };

                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        [HttpGet("landmarks/{id}")]
        public async Task<IActionResult> GetLandmarkById(string id)
        {
            try
            {
                var collection = GetLandmarksCollection();
                var landmark = await collection.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (landmark == null)
                {
                    return NotFound(new { success = false, message = $"Landmark with ID '{id}' was not found." });
                }

                return Ok(new { success = true, data = landmark });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
        public async Task<IActionResult> Create([FromBody] Destination destination)
        {
            if (!ValidateTenantAccess(out var forbiddenResult))
            {
                return forbiddenResult!;
            }

            try
            {
                destination.Website = _websiteContext.CurrentWebsiteId;
                await _repo.CreateAsync(destination);
                return StatusCode(201, new { success = true, data = destination });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
        public async Task<IActionResult> Update(string id, [FromBody] Destination updated)
        {
            if (!ValidateTenantAccess(out var forbiddenResult))
            {
                return forbiddenResult!;
            }

            try
            {
                updated.Website = _websiteContext.CurrentWebsiteId;
                await _repo.UpdateAsync(id, updated);
                return Ok(new { success = true, data = updated });
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
                await _repo.DeleteAsync(id);
                return Ok(new { success = true, message = "Destination deleted successfully" });
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        private List<DestinationLandmark> GenerateSeedLandmarks(string siteId)
        {
            if (siteId.Contains("tripgo"))
            {
                return new List<DestinationLandmark>
                {
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 101,
                        TourName = "Phuket & Krabi Island Hopper",
                        Title = "Phi Phi Leh & Maya Bay",
                        Subtitle = "World-famous azure lagoon flanked by 100m limestone cliffs",
                        Category = "Islands & Coast",
                        Latitude = 7.6872,
                        Longitude = 98.7667,
                        City = "Koh Phi Phi",
                        Region = "Krabi Province, Thailand",
                        Rating = 4.9,
                        ReviewCount = 840,
                        ImageUrl = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
                        Gallery = new List<string>
                        {
                            "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
                            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                        },
                        OpeningHours = "National Marine Park Open 7:00 AM - 6:00 PM",
                        BestTimeToVisit = "November to April (Dry Season)",
                        InsiderTip = "Arrive via early dawn private speedboat before 8:30 AM to experience the serene turquoise bay before commercial tour catamarans anchor.",
                        ApproximateVisitDuration = "3 - 4 Hours",
                        AdmissionFee = "400 THB Marine Park Pass",
                        IsFeatured = true,
                        Tags = new List<string> { "Snorkeling", "Limestone Cliffs", "Speedboat", "Photography" }
                    },
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 101,
                        TourName = "Phuket & Krabi Island Hopper",
                        Title = "Railay Beach & Phra Nang Cave",
                        Subtitle = "Dramatic peninsula accessible only by traditional longtail boat",
                        Category = "Islands & Coast",
                        Latitude = 8.0066,
                        Longitude = 98.8378,
                        City = "Ao Nang",
                        Region = "Krabi, Thailand",
                        Rating = 4.8,
                        ReviewCount = 620,
                        ImageUrl = "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1200&q=80",
                        Gallery = new List<string>
                        {
                            "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=800&q=80"
                        },
                        OpeningHours = "Open Daily 24 Hours",
                        BestTimeToVisit = "Late afternoon for rock climbing & sunset",
                        InsiderTip = "Kayak around Princess Lagoon sea caves at low tide to spot wild sea eagles and secluded limestone overhangs.",
                        ApproximateVisitDuration = "2 - 3 Hours",
                        AdmissionFee = "Free Access (Longtail Boat 100 THB)",
                        IsFeatured = true,
                        Tags = new List<string> { "Rock Climbing", "Kayaking", "Sunset Point" }
                    },
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 101,
                        TourName = "Phuket & Krabi Island Hopper",
                        Title = "Big Buddha of Phuket",
                        Subtitle = "45-meter white Burmese marble statue with 360° panoramas",
                        Category = "Sacred & Spiritual",
                        Latitude = 7.8276,
                        Longitude = 98.3129,
                        City = "Chalong",
                        Region = "Phuket, Thailand",
                        Rating = 4.8,
                        ReviewCount = 510,
                        ImageUrl = "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80",
                        OpeningHours = "Open Daily 6:00 AM - 6:30 PM",
                        BestTimeToVisit = "Morning 7:30 AM before peak heat",
                        InsiderTip = "Modest dress covering shoulders and knees is mandatory; monk blessing ceremonies and gold bell pendants available at pavilion.",
                        ApproximateVisitDuration = "1.5 - 2 Hours",
                        AdmissionFee = "Free Admission (Donations Welcome)",
                        IsFeatured = true,
                        Tags = new List<string> { "Panoramic View", "Temple", "Spiritual" }
                    },
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 102,
                        TourName = "Vietnam Ha Long Bay & Hanoi Heritage",
                        Title = "Ha Long Bay & Sung Sot Surprise Cave",
                        Subtitle = "UNESCO World Heritage seascape with 1,600 dramatic limestone karsts",
                        Category = "Nature & Wildlife",
                        Latitude = 20.9101,
                        Longitude = 107.1839,
                        City = "Ha Long City",
                        Region = "Quang Ninh, Vietnam",
                        Rating = 4.9,
                        ReviewCount = 980,
                        ImageUrl = "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
                        OpeningHours = "Junk Boat Cruises 8:00 AM - 5:00 PM",
                        BestTimeToVisit = "March to May & September to November",
                        InsiderTip = "Book an overnight boutique junk cruise to kayak through the hidden Luon Cave lagoon under the moonlight.",
                        ApproximateVisitDuration = "Full Day / Overnight",
                        AdmissionFee = "Included in Tour Package",
                        IsFeatured = true,
                        Tags = new List<string> { "UNESCO", "Cruising", "Limestone Karst" }
                    },
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 103,
                        TourName = "Bali Jungle & Tropical Temples",
                        Title = "Ubud Sacred Monkey Forest Sanctuary",
                        Subtitle = "Verdant rainforest sanctuary sheltering over 1,000 Balinese macaques",
                        Category = "Nature & Wildlife",
                        Latitude = -8.5188,
                        Longitude = 115.2587,
                        City = "Ubud",
                        Region = "Bali, Indonesia",
                        Rating = 4.7,
                        ReviewCount = 740,
                        ImageUrl = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
                        OpeningHours = "Open Daily 9:00 AM - 6:00 PM",
                        BestTimeToVisit = "Early morning 9:00 AM or late afternoon 4:00 PM",
                        InsiderTip = "Secure sunglasses, jewelry, and bags. Visit the ancient moss-covered Holy Spring bathing temple in the southern valley.",
                        ApproximateVisitDuration = "2 Hours",
                        AdmissionFee = "80,000 IDR",
                        IsFeatured = true,
                        Tags = new List<string> { "Wildlife", "Rainforest", "Temples" }
                    }
                };
            }

            if (siteId.Contains("techno"))
            {
                return new List<DestinationLandmark>
                {
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 201,
                        TourName = "Dubai Ultra-Luxury & Royal Falconry",
                        Title = "Burj Khalifa At The Top SKY VIP",
                        Subtitle = "Level 148 luxury observation lounge and private sky terrace at 555m",
                        Category = "Luxury & VIP",
                        Latitude = 25.1972,
                        Longitude = 55.2744,
                        City = "Downtown Dubai",
                        Region = "Dubai, UAE",
                        Rating = 4.9,
                        ReviewCount = 1450,
                        ImageUrl = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
                        OpeningHours = "VIP Sky Lounge Open 9:00 AM - 11:00 PM",
                        BestTimeToVisit = "5:00 PM - 6:30 PM for Golden Hour sunset over the Gulf",
                        InsiderTip = "Fast-track VIP security bypasses all general queues; complimentary Arabic coffee, dates, and bespoke guest ambassador guidance included.",
                        ApproximateVisitDuration = "2 Hours",
                        AdmissionFee = "AED 399 VIP Lounge Pass",
                        IsFeatured = true,
                        Tags = new List<string> { "Skyline", "VIP Lounge", "World Record" }
                    },
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 201,
                        TourName = "Dubai Ultra-Luxury & Royal Falconry",
                        Title = "The Palm Jumeirah & Atlantis The Royal",
                        Subtitle = "Iconic man-made archipelago and ultra-luxury sky pool sanctuary",
                        Category = "Luxury & VIP",
                        Latitude = 25.1304,
                        Longitude = 55.1171,
                        City = "Palm Jumeirah",
                        Region = "Dubai, UAE",
                        Rating = 4.9,
                        ReviewCount = 920,
                        ImageUrl = "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1200&q=80",
                        OpeningHours = "Open Daily 24 Hours",
                        BestTimeToVisit = "Midday for private yacht cruise or sunset dinner",
                        InsiderTip = "Charter a private 68ft Sunseeker yacht from Dubai Marina harbor to capture the quintessential sunset profile of the Palm crescent.",
                        ApproximateVisitDuration = "3 - 5 Hours",
                        AdmissionFee = "Custom VIP Charter Pricing",
                        IsFeatured = true,
                        Tags = new List<string> { "Private Yacht", "Michelin Dining", "Private Beach" }
                    },
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 202,
                        TourName = "Abu Dhabi Royal Heritage & Louvre",
                        Title = "Louvre Abu Dhabi Floating Dome",
                        Subtitle = "Jean Nouvel architectural marvel featuring the 'Rain of Light' dome",
                        Category = "Heritage & Architecture",
                        Latitude = 24.5337,
                        Longitude = 54.3983,
                        City = "Saadiyat Cultural District",
                        Region = "Abu Dhabi, UAE",
                        Rating = 4.9,
                        ReviewCount = 810,
                        ImageUrl = "https://images.unsplash.com/photo-1578895101407-28564db31d87?auto=format&fit=crop&w=1200&q=80",
                        OpeningHours = "Tuesday to Sunday 10:00 AM - 6:30 PM (Closed Mondays)",
                        BestTimeToVisit = "Late afternoon 4:00 PM followed by sea kayaking",
                        InsiderTip = "Book the 60-minute sunset sea kayaking tour directly underneath the museum's 180-meter geometric star dome.",
                        ApproximateVisitDuration = "3 Hours",
                        AdmissionFee = "AED 63 Admission",
                        IsFeatured = true,
                        Tags = new List<string> { "Modern Architecture", "Fine Arts", "Sea Kayaking" }
                    },
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 202,
                        TourName = "Abu Dhabi Royal Heritage & Louvre",
                        Title = "Sheikh Zayed Grand Mosque",
                        Subtitle = "Monumental masterpiece with 82 white marble domes and 24K gold chandeliers",
                        Category = "Sacred & Spiritual",
                        Latitude = 24.4128,
                        Longitude = 54.4749,
                        City = "Abu Dhabi",
                        Region = "Abu Dhabi, UAE",
                        Rating = 4.9,
                        ReviewCount = 1890,
                        ImageUrl = "https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&w=1200&q=80",
                        OpeningHours = "Saturday to Thursday 9:00 AM - 10:00 PM, Friday 4:30 PM - 10:00 PM",
                        BestTimeToVisit = "5:00 PM sunset reflection over the surrounding water basins",
                        InsiderTip = "Pre-register for the complimentary VIP cultural tour at the underground visitor centre to view the world's largest hand-knotted Persian carpet.",
                        ApproximateVisitDuration = "2.5 Hours",
                        AdmissionFee = "Free Entry (Prior Registration Required)",
                        IsFeatured = true,
                        Tags = new List<string> { "White Marble", "Cultural Masterpiece", "Reflection Pools" }
                    },
                    new DestinationLandmark
                    {
                        SiteId = siteId,
                        TourId = 201,
                        TourName = "Dubai Ultra-Luxury & Royal Falconry",
                        Title = "Dubai Desert Conservation Reserve",
                        Subtitle = "Pristine protected dunes with private vintage Land Rover royal safari",
                        Category = "Wildlife & Safari",
                        Latitude = 24.8333,
                        Longitude = 55.6667,
                        City = "Margham",
                        Region = "Dubai, UAE",
                        Rating = 4.9,
                        ReviewCount = 670,
                        ImageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
                        OpeningHours = "Afternoon Safari 3:00 PM - 10:00 PM",
                        BestTimeToVisit = "October to April",
                        InsiderTip = "Experience private royal falconry demonstration followed by an astronomy stargazing session with high-powered computer telescope.",
                        ApproximateVisitDuration = "6 Hours",
                        AdmissionFee = "Included in Platinum Safari",
                        IsFeatured = true,
                        Tags = new List<string> { "Royal Falconry", "Dune Safari", "Astronomy" }
                    }
                };
            }

            // Default: GujjuTours
            return new List<DestinationLandmark>
            {
                new DestinationLandmark
                {
                    SiteId = siteId,
                    TourId = 1,
                    TourName = "Dwarka Somnath Sacred Darshan",
                    Title = "Somnath Mahadev Jyotirlinga",
                    Subtitle = "First of the twelve sacred Aadi Jyotirlingas on the Arabian Sea coast",
                    Category = "Sacred & Spiritual",
                    Latitude = 20.8880,
                    Longitude = 70.4012,
                    City = "Prabhas Patan",
                    Region = "Veraval, Gujarat",
                    Rating = 4.9,
                    ReviewCount = 2100,
                    ImageUrl = "https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&w=1200&q=80",
                    Gallery = new List<string>
                    {
                        "https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&w=800&q=80"
                    },
                    OpeningHours = "Open Daily 6:00 AM - 10:00 PM (Aarti: 7 AM, 12 PM, 7 PM)",
                    BestTimeToVisit = "Evening 7:00 PM for Sandhya Aarti and Light Show",
                    InsiderTip = "Attend the spectacular Dhvani Prakash (Sound & Light) show narrated by Amitabh Bachchan at 8:00 PM on the seaside grounds. Pure Jain satvik bhojanalaya is located 350m from the VIP exit gate.",
                    ApproximateVisitDuration = "2 - 3 Hours",
                    AdmissionFee = "Free Entry (VIP Darshan pass available)",
                    IsFeatured = true,
                    Tags = new List<string> { "Jyotirlinga", "Seaside", "Pure Veg", "Aarti" }
                },
                new DestinationLandmark
                {
                    SiteId = siteId,
                    TourId = 1,
                    TourName = "Dwarka Somnath Sacred Darshan",
                    Title = "Dwarkadhish Jagat Mandir",
                    Subtitle = "2500-year-old sacred 5-story shrine of Lord Krishna on the Gomti River",
                    Category = "Sacred & Spiritual",
                    Latitude = 22.2376,
                    Longitude = 68.9678,
                    City = "Dwarka",
                    Region = "Devbhumi Dwarka, Gujarat",
                    Rating = 4.9,
                    ReviewCount = 1850,
                    ImageUrl = "https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=1200&q=80",
                    OpeningHours = "Morning 6:30 AM - 1:00 PM, Evening 5:00 PM - 9:30 PM",
                    BestTimeToVisit = "Early morning Mangla Aarti (7:00 AM)",
                    InsiderTip = "Witness the holy 52-yard Dhwaja flag changing ceremony held five times daily. Pre-book through our concierge for special senior citizen wheelchair assistance.",
                    ApproximateVisitDuration = "2 - 3 Hours",
                    AdmissionFee = "Free Entry",
                    IsFeatured = true,
                    Tags = new List<string> { "Char Dham", "Krishna Bhumi", "Gomti Ghat" }
                },
                new DestinationLandmark
                {
                    SiteId = siteId,
                    TourId = 2,
                    TourName = "Statue of Unity & Narmada Heritage",
                    Title = "Statue of Unity & Valley of Flowers",
                    Subtitle = "World's tallest monument standing 182 meters high with 153m sky gallery",
                    Category = "Heritage & Architecture",
                    Latitude = 21.8380,
                    Longitude = 73.7191,
                    City = "Kevadia (Ekta Nagar)",
                    Region = "Narmada, Gujarat",
                    Rating = 4.9,
                    ReviewCount = 1620,
                    ImageUrl = "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
                    OpeningHours = "Tuesday to Sunday 8:00 AM - 6:00 PM (Closed Mondays)",
                    BestTimeToVisit = "Morning 9:00 AM or late afternoon 4:00 PM",
                    InsiderTip = "Express tickets include priority elevator queues to the 153m viewing deck inside Sardar Patel's chest. Don't miss the 7:00 PM musical laser fountain show at Narmada Dam.",
                    ApproximateVisitDuration = "Full Day",
                    AdmissionFee = "Rs 380 Standard / Rs 1,030 Express Viewing Deck",
                    IsFeatured = true,
                    Tags = new List<string> { "World Record", "Viewing Gallery", "Narmada River", "Laser Show" }
                },
                new DestinationLandmark
                {
                    SiteId = siteId,
                    TourId = 3,
                    TourName = "Sasan Gir Asiatic Lion Wildlife Safari",
                    Title = "Gir National Park Asiatic Lion Reserve",
                    Subtitle = "The only natural sanctuary of the magnificent Asiatic Lion on Earth",
                    Category = "Wildlife & Safari",
                    Latitude = 21.1243,
                    Longitude = 70.8242,
                    City = "Sasan Gir",
                    Region = "Junagadh, Gujarat",
                    Rating = 4.8,
                    ReviewCount = 1290,
                    ImageUrl = "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80",
                    OpeningHours = "Safaris: 6:00 AM - 9:00 AM, 9:00 AM - 12:00 PM, 3:00 PM - 6:00 PM",
                    BestTimeToVisit = "November to March (Park closed during Monsoon June 16 - Oct 15)",
                    InsiderTip = "Zone 3 and Zone 6 on the 6:00 AM morning safari track have the highest historical pride sightings near the Kamleshwar reservoir.",
                    ApproximateVisitDuration = "3.5 Hours Safari",
                    AdmissionFee = "Forest Permit Rs 1,000 + Gypsy & Guide",
                    IsFeatured = true,
                    Tags = new List<string> { "Asiatic Lion", "Jeep Safari", "Kamleshwar Dam" }
                },
                new DestinationLandmark
                {
                    SiteId = siteId,
                    TourId = 4,
                    TourName = "Sun Temple Modhera & Patan Patola",
                    Title = "Sun Temple of Modhera & Surya Kund",
                    Subtitle = "11th-century Solanki architectural marvel oriented to the equinox sun",
                    Category = "Heritage & Architecture",
                    Latitude = 23.5835,
                    Longitude = 72.1331,
                    City = "Modhera",
                    Region = "Mehsana, Gujarat",
                    Rating = 4.8,
                    ReviewCount = 890,
                    ImageUrl = "https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=1200&q=80",
                    OpeningHours = "Open Daily 7:00 AM - 6:00 PM",
                    BestTimeToVisit = "Morning sunrise 7:00 AM",
                    InsiderTip = "Walk down the 108 miniature shrines surrounding Surya Kund stepwell. The temple is designed so the first rays of the equinox sun strike the gilded Surya murti.",
                    ApproximateVisitDuration = "2 Hours",
                    AdmissionFee = "Rs 25 Archeological Survey of India Entry",
                    IsFeatured = true,
                    Tags = new List<string> { "Stepwell", "Solanki Architecture", "UNESCO Heritage" }
                },
                new DestinationLandmark
                {
                    SiteId = siteId,
                    TourId = 5,
                    TourName = "Rann Utsav White Desert Cultural Expedition",
                    Title = "Rann of Kutch White Salt Desert",
                    Subtitle = "Endless glistening white salt flats under boundless desert horizons",
                    Category = "Nature & Wildlife",
                    Latitude = 23.8344,
                    Longitude = 69.8394,
                    City = "Dhordo",
                    Region = "Kutch, Gujarat",
                    Rating = 4.9,
                    ReviewCount = 1420,
                    ImageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
                    OpeningHours = "Open 6:00 AM - 8:00 PM (Special Full Moon Night Passes)",
                    BestTimeToVisit = "November to February during Rann Utsav (Full Moon Nights)",
                    InsiderTip = "Take an authentic camel-drawn cart deep into the white desert at sunset. Authentic Kutchi handicraft bazaars and live Gujarati folk concerts happen at Tent City.",
                    ApproximateVisitDuration = "4 - 5 Hours",
                    AdmissionFee = "Kutch Border Permit Rs 100 per person",
                    IsFeatured = true,
                    Tags = new List<string> { "White Desert", "Rann Utsav", "Camel Safari", "Full Moon" }
                },
                new DestinationLandmark
                {
                    SiteId = siteId,
                    TourId = 6,
                    TourName = "Palitana Sacred Shatrunjaya Hills",
                    Title = "Palitana Shatrunjaya Tirth",
                    Subtitle = "The world's only hill sanctuary with over 863 intricately carved Jain marble temples",
                    Category = "Sacred & Spiritual",
                    Latitude = 21.5244,
                    Longitude = 71.8211,
                    City = "Palitana",
                    Region = "Bhavnagar, Gujarat",
                    Rating = 4.9,
                    ReviewCount = 1140,
                    ImageUrl = "https://images.unsplash.com/photo-1544971587-b842c27f8e14?auto=format&fit=crop&w=1200&q=80",
                    OpeningHours = "Dawn to Dusk (No overnight stay allowed on hill)",
                    BestTimeToVisit = "Early morning 5:30 AM before sunrise",
                    InsiderTip = "Begin the 3,500-step holy climb before dawn to beat the midday sun. Doli (palanquin) services are readily available at the foothills for senior pilgrims.",
                    ApproximateVisitDuration = "5 - 6 Hours",
                    AdmissionFee = "Free Entry",
                    IsFeatured = true,
                    Tags = new List<string> { "Jain Tirth", "Shatrunjaya", "Adishwar Dada", "Marble Carving" }
                }
            };
        }
    }
}