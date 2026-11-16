using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/audioguide")]
    public class AudioGuideController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _databaseProvider;

        public AudioGuideController(IWebsiteContext websiteContext, IMongoDatabaseProvider databaseProvider)
        {
            _websiteContext = websiteContext;
            _databaseProvider = databaseProvider;
        }

        private IMongoCollection<AudioStory> GetAudioCollection()
        {
            var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
            return db.GetCollection<AudioStory>("audio_stories");
        }

        [HttpGet("stories")]
        public IActionResult GetAudioStories([FromQuery] string? category, [FromQuery] string? tourId)
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var stories = BuildBrandAudioStories(siteId);

            if (!string.IsNullOrWhiteSpace(category) && category.ToLowerInvariant() != "all")
            {
                stories = stories.Where(s => s.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(tourId))
            {
                var tourMatches = stories.Where(s => s.TourId == tourId).ToList();
                if (tourMatches.Count > 0)
                {
                    stories = tourMatches;
                }
            }

            return Ok(new
            {
                success = true,
                siteId,
                totalCount = stories.Count,
                data = stories
            });
        }

        [HttpPost("listen/{id}")]
        public async Task<IActionResult> RecordListen(string id, [FromBody] AudioStoryListenDto? dto)
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";

            try
            {
                var collection = GetAudioCollection();
                var filter = Builders<AudioStory>.Filter.Eq(x => x.Id, id);
                var update = Builders<AudioStory>.Update.Inc(x => x.PlayCount, 1);
                await collection.UpdateOneAsync(filter, update);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] Could not update audio listen count: {ex.Message}");
            }

            return Ok(new
            {
                success = true,
                message = "Listen engagement recorded.",
                storyId = id
            });
        }

        private List<AudioStoryDto> BuildBrandAudioStories(string siteId)
        {
            if (siteId.Contains("tripgo"))
            {
                return new List<AudioStoryDto>
                {
                    new AudioStoryDto
                    {
                        Id = "story_tg_1",
                        SiteId = siteId,
                        TourId = "tour_tg_phiphi",
                        Title = "Phi Phi Viking Caves & The Ancient Sea Nomads",
                        Subtitle = "Mysterious cave pictograms & emerald swiftlet harvests",
                        Category = "legends",
                        DurationSeconds = 240,
                        FormattedDuration = "4m 00s",
                        AudioUrl = "https://actions.google.com/sounds/v1/water/lapping_waves.ogg",
                        CoverImage = "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&fit=crop",
                        NarratorName = "Somchai Prasert",
                        Language = "en",
                        LandmarkName = "Viking Cave (Koh Phi Phi Leh)",
                        Latitude = 7.7407,
                        Longitude = 98.7784,
                        PlayCount = 1420,
                        Tags = new List<string> { "Limestone Karsts", "Andaman Sea", "Cave Art" },
                        Transcript = "As our longtail boat glides towards the towering limestone karst cliffs of Koh Phi Phi Leh, look up into the cavernous darkness of Viking Cave. Inside, enigmatic ancient wall paintings depict Scandinavian-style vessels, Arabian dhows, and Chinese junks painted hundreds of years ago by maritime sea gypsies known as the Urak Lawoi. High above the roaring waves, brave collectors scale flimsy bamboo scaffolding to harvest swiftlet edible birds' nests, prized across the Orient for millennia."
                    },
                    new AudioStoryDto
                    {
                        Id = "story_tg_2",
                        SiteId = siteId,
                        TourId = "tour_tg_bkk",
                        Title = "Wat Arun: The Temple of Dawn and Porcelain Mosaics",
                        Subtitle = "Ancient Chinese trade ballast converted to sacred spires",
                        Category = "architecture",
                        DurationSeconds = 215,
                        FormattedDuration = "3m 35s",
                        AudioUrl = "https://actions.google.com/sounds/v1/ambiences/temple_bell.ogg",
                        CoverImage = "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&fit=crop",
                        NarratorName = "Mayura Kittisuk",
                        Language = "en",
                        LandmarkName = "Wat Arun (Temple of Dawn)",
                        Latitude = 13.7437,
                        Longitude = 100.4889,
                        PlayCount = 980,
                        Tags = new List<string> { "Chao Phraya", "Porcelain Mosaics", "Buddhism" },
                        Transcript = "Gazing across the Chao Phraya River, Wat Arun's eighty-two meter central prang pierces Bangkok's skyline. Unlike classical gilded temples, Wat Arun's exterior is encrusted with millions of pieces of colorful Chinese porcelain and glazed ceramics, brought as ballast on ancient spice trading vessels from Canton. In Buddhist cosmology, the majestic central tower represents Mount Meru, the center of the universe."
                    },
                    new AudioStoryDto
                    {
                        Id = "story_tg_3",
                        SiteId = siteId,
                        TourId = "tour_tg_jamesbond",
                        Title = "James Bond Island & Phang Nga Bay Mangroves",
                        Subtitle = "007 cinematic secret hideouts and prehistoric caverns",
                        Category = "nature",
                        DurationSeconds = 185,
                        FormattedDuration = "3m 05s",
                        AudioUrl = "https://actions.google.com/sounds/v1/water/river_running.ogg",
                        CoverImage = "https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800&fit=crop",
                        NarratorName = "Captain Ken",
                        Language = "en",
                        LandmarkName = "Koh Ta Pu (Phang Nga Bay)",
                        Latitude = 8.2745,
                        Longitude = 98.5012,
                        PlayCount = 740,
                        Tags = new List<string> { "Cinema", "Mangroves", "Sea Kayaking" },
                        Transcript = "Rising twenty meters out of emerald waters like an inverted limestone needle, Koh Ta Pu became a global sensation following the 1974 film 'The Man with the Golden Gun'. But Phang Nga Bay is much more than cinematic history; it is one of the most vital mangrove nurseries in the Andaman basin, hosting elusive dugongs, mudskippers, and sea eagles."
                    }
                };
            }

            if (siteId.Contains("techno"))
            {
                return new List<AudioStoryDto>
                {
                    new AudioStoryDto
                    {
                        Id = "story_th_1",
                        SiteId = siteId,
                        TourId = "tour_th_burj",
                        Title = "Burj Khalifa: Engineering the World's Crown",
                        Subtitle = "Aerodynamic vortex engineering 828 meters above the desert",
                        Category = "architecture",
                        DurationSeconds = 270,
                        FormattedDuration = "4m 30s",
                        AudioUrl = "https://actions.google.com/sounds/v1/weather/wind_howling.ogg",
                        CoverImage = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&fit=crop",
                        NarratorName = "Farah Al-Maktoum",
                        Language = "en",
                        LandmarkName = "Burj Khalifa",
                        Latitude = 25.1972,
                        Longitude = 55.2744,
                        PlayCount = 2100,
                        Tags = new List<string> { "Skyscraper", "Engineering", "Downtown Dubai" },
                        Transcript = "Rising 828 meters into the Arabian sky, the Burj Khalifa is a testament to human audacity and structural genius. Inspired by the regional desert flower Hymenocallis, the tower's Y-shaped floor plan minimizes wind vortex shedding while maximizing panoramic views over the Persian Gulf. During construction, high-strength concrete was pumped through specialized high-pressure systems at night to prevent premature curing under the fierce summer desert sun."
                    },
                    new AudioStoryDto
                    {
                        Id = "story_th_2",
                        SiteId = siteId,
                        TourId = "tour_th_palm",
                        Title = "The Palm Jumeirah: Sculpting an Island from the Ocean",
                        Subtitle = "GPS-guided vibro-compaction and the wonder of man-made archipelagos",
                        Category = "architecture",
                        DurationSeconds = 220,
                        FormattedDuration = "3m 40s",
                        AudioUrl = "https://actions.google.com/sounds/v1/water/ocean_waves.ogg",
                        CoverImage = "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&fit=crop",
                        NarratorName = "David Sterling",
                        Language = "en",
                        LandmarkName = "Palm Jumeirah",
                        Latitude = 25.1124,
                        Longitude = 55.1390,
                        PlayCount = 1350,
                        Tags = new List<string> { "Megaproject", "Luxury Coastline", "Satellite GPS" },
                        Transcript = "Visible from low Earth orbit with the naked eye, the Palm Jumeirah added over seventy-eight kilometers of pristine coastline to Dubai. Using vibro-compaction technology, over ninety-four million cubic meters of deep-sea sand and seven million tons of quarried rock were positioned using precision satellite GPS guidance to create an offshore paradise protected by an eleven-kilometer crescent breakwater."
                    },
                    new AudioStoryDto
                    {
                        Id = "story_th_3",
                        SiteId = siteId,
                        TourId = "tour_th_safari",
                        Title = "Tales of the Arabian Desert & Bedouin Falconry",
                        Subtitle = "Constellations, golden rolling dunes & ancient raptor bonds",
                        Category = "history",
                        DurationSeconds = 200,
                        FormattedDuration = "3m 20s",
                        AudioUrl = "https://actions.google.com/sounds/v1/animals/hawk_screech.ogg",
                        CoverImage = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&fit=crop",
                        NarratorName = "Saeed Al-Nuaimi",
                        Language = "en",
                        LandmarkName = "Al Marmoom Desert Reserve",
                        Latitude = 24.8860,
                        Longitude = 55.4420,
                        PlayCount = 890,
                        Tags = new List<string> { "Bedouin Heritage", "Falconry", "Red Dunes" },
                        Transcript = "Beneath the canopy of the desert stars, the Bedouin navigated vast rolling red sand dunes using celestial constellations. Central to this desert survival was falconry—a revered heritage passed down through generations where the Peregrine and Saker falcons were treated as cherished family members rather than mere hunting birds."
                    }
                };
            }

            // Default: GujjuTours
            return new List<AudioStoryDto>
            {
                new AudioStoryDto
                {
                    Id = "story_gj_1",
                    SiteId = siteId,
                    TourId = "tour_gj_somnath",
                    Title = "Somnath: The Eternal Shrine by the Arabian Sea",
                    Subtitle = "First of the twelve Jyotirlingas & the mystery of the Baan Stambh",
                    Category = "history",
                    DurationSeconds = 235,
                    FormattedDuration = "3m 55s",
                    AudioUrl = "https://actions.google.com/sounds/v1/water/ocean_waves.ogg",
                    CoverImage = "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&fit=crop",
                    NarratorName = "Dr. Kirit Vyas",
                    Language = "en",
                    LandmarkName = "Shree Somnath Jyotirlinga Temple",
                    Latitude = 20.8880,
                    Longitude = 70.4012,
                    PlayCount = 2850,
                    Tags = new List<string> { "Jyotirlinga", "Baan Stambh", "Saurashtra" },
                    Transcript = "Welcome to Prabhas Patan, where the holy Triveni Sangam meets the Arabian Sea. Somnath stands as the first among the twelve sacred Aadi Jyotirlings of Lord Shiva. According to ancient Puranic tradition, the Moon God Chandra built the first shrine in pure gold to regain his radiance. Through centuries of turbulent history, Somnath was rebuilt seven times, symbolizing the eternal triumph of spiritual resilience over time. As you face the ocean, notice the Baan Stambh—an ancient arrow pillar pointing south to Antarctica along an uninterrupted path of water with zero landmass."
                },
                new AudioStoryDto
                {
                    Id = "story_gj_2",
                    SiteId = siteId,
                    TourId = "tour_gj_dwarka",
                    Title = "Dwarka: The Sunken Kingdom of the Yadavas",
                    Subtitle = "Marine archaeology uncovering the golden underwater city",
                    Category = "legends",
                    DurationSeconds = 210,
                    FormattedDuration = "3m 30s",
                    AudioUrl = "https://actions.google.com/sounds/v1/ambiences/temple_bell.ogg",
                    CoverImage = "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&fit=crop",
                    NarratorName = "Ananya Mehta",
                    Language = "en",
                    LandmarkName = "Dwarkadhish Temple (Jagat Mandir)",
                    Latitude = 22.2376,
                    Longitude = 68.9678,
                    PlayCount = 1920,
                    Tags = new List<string> { "Underwater Archaeology", "Lord Krishna", "Gomti Ghat" },
                    Transcript = "Step into the golden realm of Lord Krishna. Marine archaeological expeditions led by the Archaeological Survey of India have uncovered stone anchors, fortified underwater walls, and pottery just off the coastline, confirming that the legendary submerged city of Dwarka was an architectural marvel of antiquity. The magnificent Jagat Mandir you see before you rises 78 meters high with a 52-yard flag that waves proudly, changed five times daily with sacred rituals."
                },
                new AudioStoryDto
                {
                    Id = "story_gj_3",
                    SiteId = siteId,
                    TourId = "tour_gj_gir",
                    Title = "Gir Forest: The Roar of the Last Asiatic Sanctuary",
                    Subtitle = "How royal conservation saved the majestic Persian-origin lion",
                    Category = "nature",
                    DurationSeconds = 195,
                    FormattedDuration = "3m 15s",
                    AudioUrl = "https://actions.google.com/sounds/v1/animals/lion_roar.ogg",
                    CoverImage = "https://images.unsplash.com/photo-1614027164847-1b28caa144b6?w=800&fit=crop",
                    NarratorName = "Rajesh Solanki",
                    Language = "en",
                    LandmarkName = "Gir National Park",
                    Latitude = 21.1243,
                    Longitude = 70.7946,
                    PlayCount = 1480,
                    Tags = new List<string> { "Asiatic Lion", "Wildlife", "Sasan Gir" },
                    Transcript = "Deep in the deciduous teaks of Saurashtra lies the sole remaining sanctuary of the Panthera leo persica—the regal Asiatic Lion. Once prowling from Persia to India, the population dwindled to barely a dozen before the visionary Nawab of Junagadh declared complete protection. Today, through dedicated Maldhari forest community coexistence and elite forest trackers, over 670 wild lions thrive here under the golden Gujarat sunrise."
                }
            };
        }
    }
}
