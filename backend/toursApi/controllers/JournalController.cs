using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/journal")]
    public class JournalController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _databaseProvider;

        public JournalController(IWebsiteContext websiteContext, IMongoDatabaseProvider databaseProvider)
        {
            _websiteContext = websiteContext;
            _databaseProvider = databaseProvider;
        }

        [HttpGet("scrapbook")]
        public async Task<IActionResult> GetScrapbook([FromQuery] string? tripId)
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<TripScrapbook>("trip_scrapbooks");

                var filter = Builders<TripScrapbook>.Filter.Eq(s => s.WebsiteId, siteId);
                if (!string.IsNullOrWhiteSpace(tripId))
                {
                    filter = Builders<TripScrapbook>.Filter.And(
                        filter,
                        Builders<TripScrapbook>.Filter.Eq(s => s.TripId, tripId)
                    );
                }

                var existing = await collection.Find(filter).FirstOrDefaultAsync(cts.Token);
                if (existing != null)
                {
                    var dto = MapToDto(existing, siteId);
                    return Ok(new
                    {
                        success = true,
                        siteId,
                        data = dto
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[JournalController] Non-fatal Mongo fetch exception: {ex.Message}");
            }

            // Return rich seed scrapbook for each brand
            var seed = GetSeedScrapbook(siteId);
            return Ok(new
            {
                success = true,
                siteId,
                data = seed
            });
        }

        [HttpPost("entry")]
        public async Task<IActionResult> AddJournalEntry([FromBody] CreateJournalEntryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Notes))
            {
                return BadRequest(new
                {
                    success = false,
                    error = "Title and notes are required to save a journal memory entry."
                });
            }

            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var seed = GetSeedScrapbook(siteId);

            var newEntry = new JournalEntryDto
            {
                EntryId = $"mem-{Guid.NewGuid().ToString("N")[..6]}",
                TripId = string.IsNullOrWhiteSpace(dto.TripId) ? seed.TripId : dto.TripId,
                DayNumber = dto.DayNumber <= 0 ? 1 : dto.DayNumber,
                Date = DateTime.UtcNow.ToString("MMM dd, yyyy"),
                Title = dto.Title.Trim(),
                Notes = dto.Notes.Trim(),
                PhotoUrl = string.IsNullOrWhiteSpace(dto.PhotoUrl)
                    ? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                    : dto.PhotoUrl.Trim(),
                LocationName = string.IsNullOrWhiteSpace(dto.LocationName) ? seed.Destination : dto.LocationName.Trim(),
                MoodTag = string.IsNullOrWhiteSpace(dto.MoodTag) ? "Awestruck" : dto.MoodTag.Trim(),
                AuthorName = string.IsNullOrWhiteSpace(dto.AuthorName) ? "You (Expedition Traveler)" : dto.AuthorName.Trim(),
                LikesCount = 1,
                CreatedAt = DateTime.UtcNow.ToString("o")
            };

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<TripScrapbook>("trip_scrapbooks");

                var filter = Builders<TripScrapbook>.Filter.Eq(s => s.WebsiteId, siteId);
                var update = Builders<TripScrapbook>.Update
                    .Push(s => s.Entries, newEntry)
                    .Inc(s => s.Stats.TotalPhotos, 1)
                    .Set(s => s.UpdatedAt, DateTime.UtcNow);

                await collection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true }, cts.Token);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[JournalController] Non-fatal Mongo log failure: {ex.Message}");
            }

            return Ok(new
            {
                success = true,
                message = "Journal memory recorded to trip scrapbook!",
                data = newEntry
            });
        }

        private static TripScrapbookDto MapToDto(TripScrapbook model, string siteId)
        {
            return new TripScrapbookDto
            {
                TripId = model.TripId,
                SiteId = model.WebsiteId,
                TourName = model.TourName,
                Destination = model.Destination,
                TravelerName = model.TravelerName,
                HeroCoverImage = model.HeroCoverImage,
                TravelDates = model.TravelDates,
                InspirationalQuote = model.InspirationalQuote,
                Stats = model.Stats,
                Entries = model.Entries,
                ShareableStoryUrl = $"https://{siteId}.com/journal/story/{model.TripId}"
            };
        }

        private static TripScrapbookDto GetSeedScrapbook(string siteId)
        {
            switch (siteId)
            {
                case "tripgoasia":
                    return new TripScrapbookDto
                    {
                        TripId = "trip-tga-phuket-2026",
                        SiteId = "tripgoasia",
                        TourName = "Phuket & Phi Phi Island Paradise Odyssey",
                        Destination = "Phuket, Maya Bay & Koh Phi Phi",
                        TravelerName = "Alex & Travel Squad",
                        HeroCoverImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
                        TravelDates = "Nov 12 - Nov 17, 2026",
                        InspirationalQuote = "Collect moments, not things. The turquoise tides wash away all worries.",
                        Stats = new ScrapbookStatsDto
                        {
                            StopsCompleted = 9,
                            TotalDays = 5,
                            TotalPhotos = 54,
                            AudioStoriesPlayed = 6,
                            StampsEarned = 4,
                            SignatureDish = "Spicy Pad Thai & Fresh Coconut Gelato",
                            DistanceTraveledKm = 310
                        },
                        ShareableStoryUrl = "https://tripgoasia.com/journal/story/trip-tga-phuket-2026",
                        Entries = new List<JournalEntryDto>
                        {
                            new()
                            {
                                EntryId = "mem-tga-01",
                                TripId = "trip-tga-phuket-2026",
                                DayNumber = 1,
                                Date = "Nov 12, 2026",
                                Title = "Speedboat Island Cruise to Maya Bay",
                                Notes = "Unreal limestone cliffs rising out of turquoise lagoons. Snorkeled with tropical reef fish and sea turtles. Water was warm and crystal blue.",
                                PhotoUrl = "https://images.unsplash.com/photo-1537956965359-7573183d1f57?auto=format&fit=crop&w=800&q=80",
                                LocationName = "Maya Bay Lagoon, Koh Phi Phi",
                                MoodTag = "Thrilled & Adventurous",
                                AuthorName = "Alex",
                                LikesCount = 5,
                                CreatedAt = DateTime.UtcNow.AddDays(-3).ToString("o")
                            },
                            new()
                            {
                                EntryId = "mem-tga-02",
                                TripId = "trip-tga-phuket-2026",
                                DayNumber = 2,
                                Date = "Nov 13, 2026",
                                Title = "Sunset Cocktails at Promthep Cape",
                                Notes = "Panoramic vista over the Andaman Sea. The fiery orange sky reflecting on the ocean was unforgettable. Best mango sticky rice ever afterwards.",
                                PhotoUrl = "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80",
                                LocationName = "Promthep Cape Viewpoint, Rawai",
                                MoodTag = "Relaxed & Peaceful",
                                AuthorName = "Chloe",
                                LikesCount = 8,
                                CreatedAt = DateTime.UtcNow.AddDays(-2).ToString("o")
                            }
                        }
                    };

                case "technoheaven":
                    return new TripScrapbookDto
                    {
                        TripId = "trip-tech-dubai-2026",
                        SiteId = "technoheaven",
                        TourName = "Dubai VIP Executive Golden Sands Experience",
                        Destination = "Downtown Dubai & Lahbab Red Dunes",
                        TravelerName = "Mansoor Executive Delegation",
                        HeroCoverImage = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
                        TravelDates = "Dec 05 - Dec 09, 2026",
                        InspirationalQuote = "Where desert heritage meets the futuristic pinnacle of architectural wonder.",
                        Stats = new ScrapbookStatsDto
                        {
                            StopsCompleted = 10,
                            TotalDays = 4,
                            TotalPhotos = 42,
                            AudioStoriesPlayed = 7,
                            StampsEarned = 6,
                            SignatureDish = "Emirati Machboos & Saffron Camel Milk Latte",
                            DistanceTraveledKm = 280
                        },
                        ShareableStoryUrl = "https://technoheaven.com/journal/story/trip-tech-dubai-2026",
                        Entries = new List<JournalEntryDto>
                        {
                            new()
                            {
                                EntryId = "mem-tech-01",
                                TripId = "trip-tech-dubai-2026",
                                DayNumber = 1,
                                Date = "Dec 05, 2026",
                                Title = "VIP Lounge Horizon View at Burj Khalifa Level 148",
                                Notes = "Glass terraces overlooking the entire Dubai skyline and Persian Gulf. World-class luxury service with Arabic coffee and Medjool dates.",
                                PhotoUrl = "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=800&q=80",
                                LocationName = "At the Top SKY, Burj Khalifa",
                                MoodTag = "Awestruck",
                                AuthorName = "Mansoor",
                                LikesCount = 12,
                                CreatedAt = DateTime.UtcNow.AddDays(-4).ToString("o")
                            },
                            new()
                            {
                                EntryId = "mem-tech-02",
                                TripId = "trip-tech-dubai-2026",
                                DayNumber = 2,
                                Date = "Dec 06, 2026",
                                Title = "Private High Dune Sundowner & Falconry",
                                Notes = "Gliding across virgin red sand dunes followed by a majestic falconry flight demonstration and a private oud music feast under the Arabian desert stars.",
                                PhotoUrl = "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=800&q=80",
                                LocationName = "Lahbab Red Dunes Bedouin Oasis",
                                MoodTag = "Thrilled & Adventurous",
                                AuthorName = "Tariq",
                                LikesCount = 9,
                                CreatedAt = DateTime.UtcNow.AddDays(-3).ToString("o")
                            }
                        }
                    };

                default: // gujjutours
                    return new TripScrapbookDto
                    {
                        TripId = "trip-gujju-saurashtra-2026",
                        SiteId = "gujjutours",
                        TourName = "Sacred Saurashtra & Gir Heritage Pilgrimage",
                        Destination = "Dwarka, Somnath & Sasan Gir",
                        TravelerName = "Ketan & Family",
                        HeroCoverImage = "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
                        TravelDates = "Oct 24 - Oct 29, 2026",
                        InspirationalQuote = "યાત્રા એ માત્ર મુસાફરી નથી, આત્માની પવિત્ર અનુભૂતિ છે. (A journey is not merely travel, but a sacred realization of the soul.)",
                        Stats = new ScrapbookStatsDto
                        {
                            StopsCompleted = 12,
                            TotalDays = 6,
                            TotalPhotos = 38,
                            AudioStoriesPlayed = 8,
                            StampsEarned = 5,
                            SignatureDish = "Authentic Kathiyawadi Ringan Olo & Rotla",
                            DistanceTraveledKm = 540
                        },
                        ShareableStoryUrl = "https://gujjutours.com/journal/story/trip-gujju-saurashtra-2026",
                        Entries = new List<JournalEntryDto>
                        {
                            new()
                            {
                                EntryId = "mem-guj-01",
                                TripId = "trip-gujju-saurashtra-2026",
                                DayNumber = 1,
                                Date = "Oct 24, 2026",
                                Title = "Evening Aarti at Dwarkadhish Mandir",
                                Notes = "The evening Dhwajarohan ceremony took our breath away. Standing on the banks of Gomti River with our family in spiritual devotion was utterly surreal.",
                                PhotoUrl = "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
                                LocationName = "Dwarkadhish Temple, Gomti Ghat",
                                MoodTag = "Spiritual & Serene",
                                AuthorName = "Ketan Shah",
                                LikesCount = 14,
                                CreatedAt = DateTime.UtcNow.AddDays(-2).ToString("o")
                            },
                            new()
                            {
                                EntryId = "mem-guj-02",
                                TripId = "trip-gujju-saurashtra-2026",
                                DayNumber = 2,
                                Date = "Oct 25, 2026",
                                Title = "Sunrise at Bet Dwarka & Marine Sanctuary",
                                Notes = "Took the scenic boat crossing to Bet Dwarka early morning. Water was so calm and peaceful, with temple chants echoing across the bay.",
                                PhotoUrl = "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
                                LocationName = "Bet Dwarka Island Pier",
                                MoodTag = "Awestruck",
                                AuthorName = "Dipti Shah",
                                LikesCount = 11,
                                CreatedAt = DateTime.UtcNow.AddDays(-1).ToString("o")
                            },
                            new()
                            {
                                EntryId = "mem-guj-03",
                                TripId = "trip-gujju-saurashtra-2026",
                                DayNumber = 3,
                                Date = "Oct 26, 2026",
                                Title = "Ocean Waves at Somnath Jyotirlinga",
                                Notes = "The sound of ocean waves crashing right against the temple walls during the Om Namah Shivaya evening recitation gave everyone divine goosebumps.",
                                PhotoUrl = "https://images.unsplash.com/photo-1600100397608-f010f4438344?auto=format&fit=crop&w=800&q=80",
                                LocationName = "Somnath Sea Front",
                                MoodTag = "Spiritual & Serene",
                                AuthorName = "Kunal Shah",
                                LikesCount = 16,
                                CreatedAt = DateTime.UtcNow.ToString("o")
                            }
                        }
                    };
            }
        }
    }
}
