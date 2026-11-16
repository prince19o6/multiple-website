using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/passport")]
    public class PassportController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;

        public PassportController(IWebsiteContext websiteContext)
        {
            _websiteContext = websiteContext;
        }

        [HttpGet("profile")]
        public IActionResult GetPassportProfile()
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var profile = BuildPassportProfile(siteId);

            return Ok(new
            {
                success = true,
                data = profile
            });
        }

        [HttpPost("claim-stamp")]
        public IActionResult ClaimStamp([FromBody] ClaimStampRequestDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.StampId))
            {
                return BadRequest(new { success = false, message = "StampId is required." });
            }

            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var profile = BuildPassportProfile(siteId);
            var stamp = profile.Stamps.FirstOrDefault(s => s.Id == dto.StampId);

            if (stamp == null)
            {
                return NotFound(new { success = false, message = "Stamp not found in current brand catalog." });
            }

            stamp.Unlocked = true;
            stamp.UnlockedDate = DateTime.UtcNow.ToString("yyyy-MM-dd");

            return Ok(new
            {
                success = true,
                message = $"Congratulations! You've unlocked the '{stamp.Title}' official expedition stamp!",
                stamp,
                xpAwarded = stamp.XpReward
            });
        }

        [HttpPost("claim-challenge")]
        public IActionResult ClaimChallenge([FromBody] ClaimChallengeRequestDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.ChallengeId))
            {
                return BadRequest(new { success = false, message = "ChallengeId is required." });
            }

            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var profile = BuildPassportProfile(siteId);
            var challenge = profile.Challenges.FirstOrDefault(c => c.Id == dto.ChallengeId);

            if (challenge == null)
            {
                return NotFound(new { success = false, message = "Challenge not found." });
            }

            challenge.IsCompleted = true;
            challenge.CurrentCount = challenge.TargetCount;

            return Ok(new
            {
                success = true,
                message = $"Milestone challenge '{challenge.Title}' completed!",
                challenge,
                xpAwarded = challenge.XpReward
            });
        }

        private PassportProfileDto BuildPassportProfile(string siteId)
        {
            if (siteId.Contains("tripgo"))
            {
                var stamps = new List<ExpeditionStampDto>
                {
                    new ExpeditionStampDto
                    {
                        Id = "stamp_tg_phiphi",
                        Title = "Phi Phi Leh Viking Lagoon Entry Seal",
                        Destination = "Koh Phi Phi, Thailand",
                        IconName = "boat",
                        ColorHex = "#0284C7",
                        StampShape = "oval",
                        Unlocked = true,
                        UnlockedDate = "2026-10-18",
                        XpReward = 300,
                        Description = "Commemorates navigation into the sheer emerald cliffs of Pileh Lagoon and Viking Cave.",
                        Coordinates = "7.7407° N, 98.7784° E"
                    },
                    new ExpeditionStampDto
                    {
                        Id = "stamp_tg_watarun",
                        Title = "Wat Arun Temple of Dawn Chao Phraya Stamp",
                        Destination = "Bangkok, Thailand",
                        IconName = "sparkles",
                        ColorHex = "#D97706",
                        StampShape = "circle",
                        Unlocked = true,
                        UnlockedDate = "2026-10-19",
                        XpReward = 250,
                        Description = "Official seal for ascending the porcelain-adorned central prang along the River of Kings.",
                        Coordinates = "13.7437° N, 100.4889° E"
                    },
                    new ExpeditionStampDto
                    {
                        Id = "stamp_tg_jamesbond",
                        Title = "Phang Nga Bay 007 Karst Needle Stamp",
                        Destination = "Phang Nga, Thailand",
                        IconName = "camera",
                        ColorHex = "#059669",
                        StampShape = "hexagon",
                        Unlocked = false,
                        XpReward = 300,
                        Description = "Celebrates sea kayaking through prehistoric mangrove caves and Koh Ta Pu pinnacle.",
                        Coordinates = "8.2745° N, 98.5012° E"
                    },
                    new ExpeditionStampDto
                    {
                        Id = "stamp_tg_similan",
                        Title = "Similan Coral Archipelago Marine Stamp",
                        Destination = "Similan Islands, Andaman",
                        IconName = "fish",
                        ColorHex = "#2563EB",
                        StampShape = "shield",
                        Unlocked = false,
                        XpReward = 400,
                        Description = "Elite dive seal granted for exploring crystal water coral reefs and sea turtle sanctuaries.",
                        Coordinates = "8.6500° N, 97.6500° E"
                    }
                };

                return new PassportProfileDto
                {
                    PassportNumber = "TG-EXP-4891",
                    HolderName = "Guest Explorer",
                    SiteId = siteId,
                    BrandCrestTitle = "Southeast Asia Tropical Islands Expedition Passport",
                    IssuedDate = "2026-01-15",
                    TotalStampsCount = stamps.Count,
                    UnlockedStampsCount = stamps.Count(s => s.Unlocked),
                    Tier = new LoyaltyTierDto
                    {
                        TierName = "Gold Globetrotter",
                        TierBadgeColor = "#F59E0B",
                        CurrentXp = 2450,
                        NextTierXp = 3500,
                        ProgressPercent = 70,
                        Perks = new List<string>
                        {
                            "7% Instant Booking Discount on Thailand & Bali expeditions",
                            "Complimentary Speedboat Snorkel Equipment Upgrade",
                            "Priority Island Pier Boarding Pass",
                            "24/7 Island Marine Specialist Concierge Access"
                        }
                    },
                    Stamps = stamps,
                    Challenges = new List<MilestoneChallengeDto>
                    {
                        new MilestoneChallengeDto
                        {
                            Id = "ch_tg_audio",
                            Title = "Island Legend Listener",
                            Description = "Listen to an Andaman Sea audio guide story",
                            Category = "audio",
                            TargetCount = 1,
                            CurrentCount = 1,
                            IsCompleted = true,
                            XpReward = 150,
                            IconName = "headset"
                        },
                        new MilestoneChallengeDto
                        {
                            Id = "ch_tg_budget",
                            Title = "Group Bill Master",
                            Description = "Split an island excursion expense with fellow travelers",
                            Category = "budget",
                            TargetCount = 1,
                            CurrentCount = 1,
                            IsCompleted = true,
                            XpReward = 200,
                            IconName = "wallet"
                        },
                        new MilestoneChallengeDto
                        {
                            Id = "ch_tg_vault",
                            Title = "E-Visa & Passport Safeguard",
                            Description = "Store your passport or Thai E-Visa in Travel Vault",
                            Category = "vault",
                            TargetCount = 1,
                            CurrentCount = 1,
                            IsCompleted = true,
                            XpReward = 150,
                            IconName = "shield-checkmark"
                        },
                        new MilestoneChallengeDto
                        {
                            Id = "ch_tg_map",
                            Title = "Island Archipelago Explorer",
                            Description = "Inspect 3 island waypoints on Leaflet Expedition Map",
                            Category = "exploration",
                            TargetCount = 3,
                            CurrentCount = 2,
                            IsCompleted = false,
                            XpReward = 300,
                            IconName = "map"
                        }
                    }
                };
            }

            if (siteId.Contains("techno"))
            {
                var stamps = new List<ExpeditionStampDto>
                {
                    new ExpeditionStampDto
                    {
                        Id = "stamp_th_burj",
                        Title = "Burj Khalifa Apex Level 148 Sky Stamp",
                        Destination = "Downtown Dubai, UAE",
                        IconName = "business",
                        ColorHex = "#7C3AED",
                        StampShape = "shield",
                        Unlocked = true,
                        UnlockedDate = "2026-10-16",
                        XpReward = 350,
                        Description = "Official apex observation seal from 555 meters above the Dubai skyline.",
                        Coordinates = "25.1972° N, 55.2744° E"
                    },
                    new ExpeditionStampDto
                    {
                        Id = "stamp_th_safari",
                        Title = "Lahbab Red Dunes Sunset Safari Stamp",
                        Destination = "Al Marmoom Desert, Dubai",
                        IconName = "flame",
                        ColorHex = "#DC2626",
                        StampShape = "circle",
                        Unlocked = true,
                        UnlockedDate = "2026-10-18",
                        XpReward = 300,
                        Description = "Celebrates thrilling dune bashing, traditional falconry, and Bedouin starlight dinners.",
                        Coordinates = "24.8860° N, 55.4420° E"
                    },
                    new ExpeditionStampDto
                    {
                        Id = "stamp_th_palm",
                        Title = "The Palm Jumeirah Crescent Wonder Stamp",
                        Destination = "Palm Jumeirah, Dubai",
                        IconName = "globe",
                        ColorHex = "#0284C7",
                        StampShape = "oval",
                        Unlocked = false,
                        XpReward = 300,
                        Description = "Honors navigation along the world's most famous man-made offshore archipelago.",
                        Coordinates = "25.1124° N, 55.1390° E"
                    },
                    new ExpeditionStampDto
                    {
                        Id = "stamp_th_frame",
                        Title = "Dubai Frame Past & Future Golden Gate Stamp",
                        Destination = "Zabeel Park, Dubai",
                        IconName = "eye",
                        ColorHex = "#D97706",
                        StampShape = "hexagon",
                        Unlocked = false,
                        XpReward = 250,
                        Description = "Bridges the historic gold souks of Deira with the futuristic skyscrapers of Sheikh Zayed Road.",
                        Coordinates = "25.2345° N, 55.3003° E"
                    }
                };

                return new PassportProfileDto
                {
                    PassportNumber = "TH-VIP-9912",
                    HolderName = "Guest Explorer",
                    SiteId = siteId,
                    BrandCrestTitle = "Technoheaven VIP Luxury & Desert Expedition Passport",
                    IssuedDate = "2026-02-01",
                    TotalStampsCount = stamps.Count,
                    UnlockedStampsCount = stamps.Count(s => s.Unlocked),
                    Tier = new LoyaltyTierDto
                    {
                        TierName = "Platinum VIP Pioneer",
                        TierBadgeColor = "#8B5CF6",
                        CurrentXp = 4800,
                        NextTierXp = 5000,
                        ProgressPercent = 96,
                        Perks = new List<string>
                        {
                            "10% Elite Booking Discount on VIP Chauffeur & Private Yacht Tours",
                            "Guaranteed High-Floor Burj Khalifa Lounge Upgrade",
                            "Complimentary 24/7 Dedicated Chauffeur Dispatch",
                            "Complimentary Desert Safari Quad Bike Pass"
                        }
                    },
                    Stamps = stamps,
                    Challenges = new List<MilestoneChallengeDto>
                    {
                        new MilestoneChallengeDto
                        {
                            Id = "ch_th_audio",
                            Title = "Skyline Architectural Connoisseur",
                            Description = "Listen to Burj Khalifa engineering audio guide",
                            Category = "audio",
                            TargetCount = 1,
                            CurrentCount = 1,
                            IsCompleted = true,
                            XpReward = 200,
                            IconName = "headset"
                        },
                        new MilestoneChallengeDto
                        {
                            Id = "ch_th_budget",
                            Title = "Luxury Expense Balancer",
                            Description = "Log a multi-currency AED/USD luxury transaction",
                            Category = "budget",
                            TargetCount = 1,
                            CurrentCount = 1,
                            IsCompleted = true,
                            XpReward = 250,
                            IconName = "wallet"
                        },
                        new MilestoneChallengeDto
                        {
                            Id = "ch_th_vault",
                            Title = "VIP Document Fortress",
                            Description = "Protect boarding pass and travel credentials in Vault",
                            Category = "vault",
                            TargetCount = 1,
                            CurrentCount = 1,
                            IsCompleted = true,
                            XpReward = 200,
                            IconName = "shield-checkmark"
                        },
                        new MilestoneChallengeDto
                        {
                            Id = "ch_th_map",
                            Title = "Emirates Waypoint Navigator",
                            Description = "Inspect 3 VIP waypoints on Leaflet Expedition Map",
                            Category = "exploration",
                            TargetCount = 3,
                            CurrentCount = 2,
                            IsCompleted = false,
                            XpReward = 350,
                            IconName = "map"
                        }
                    }
                };
            }

            // Default: GujjuTours
            var defaultStamps = new List<ExpeditionStampDto>
            {
                new ExpeditionStampDto
                {
                    Id = "stamp_gj_dwarka",
                    Title = "Dwarkadhish Jagat Mandir Sanctuary Stamp",
                    Destination = "Dwarka, Gujarat",
                    IconName = "business",
                    ColorHex = "#D97706",
                    StampShape = "circle",
                    Unlocked = true,
                    UnlockedDate = "2026-10-15",
                    XpReward = 250,
                    Description = "Official entry seal commemorating darshan at the 2,500-year-old Jagat Mandir sanctum.",
                    Coordinates = "22.2376° N, 68.9678° E"
                },
                new ExpeditionStampDto
                {
                    Id = "stamp_gj_somnath",
                    Title = "Somnath Aadi Jyotirlinga Sea Shore Stamp",
                    Destination = "Prabhas Patan, Gujarat",
                    IconName = "water",
                    ColorHex = "#2563EB",
                    StampShape = "oval",
                    Unlocked = true,
                    UnlockedDate = "2026-10-17",
                    XpReward = 250,
                    Description = "First among the twelve divine Jyotirlingas overlooking the boundless Arabian Sea.",
                    Coordinates = "20.8880° N, 70.4012° E"
                },
                new ExpeditionStampDto
                {
                    Id = "stamp_gj_gir",
                    Title = "Sasan Gir Royal Lion Sanctuary Stamp",
                    Destination = "Gir National Park, Gujarat",
                    IconName = "paw",
                    ColorHex = "#059669",
                    StampShape = "shield",
                    Unlocked = false,
                    XpReward = 350,
                    Description = "Official jungle safari seal granted upon sighting the regal Asiatic Lion in Saurashtra teaks.",
                    Coordinates = "21.1243° N, 70.7946° E"
                },
                new ExpeditionStampDto
                {
                    Id = "stamp_gj_modhera",
                    Title = "Modhera Sun Temple Solstice Stamp",
                    Destination = "Modhera, Mehsana",
                    IconName = "sunny",
                    ColorHex = "#DC2626",
                    StampShape = "hexagon",
                    Unlocked = false,
                    XpReward = 250,
                    Description = "Commemorates the 11th-century Solanki architectural marvel where the dawn equinox illuminates the sanctum.",
                    Coordinates = "23.5836° N, 72.1330° E"
                },
                new ExpeditionStampDto
                {
                    Id = "stamp_gj_ranikivav",
                    Title = "Rani Ki Vav UNESCO Stepwell Heritage Stamp",
                    Destination = "Patan, Gujarat",
                    IconName = "layers",
                    ColorHex = "#7C3AED",
                    StampShape = "circle",
                    Unlocked = false,
                    XpReward = 300,
                    Description = "Celebrates the inverted subterranean temple with over 500 ornate stone sculptures.",
                    Coordinates = "23.8589° N, 72.1014° E"
                }
            };

            return new PassportProfileDto
            {
                PassportNumber = "GJ-EXP-7729",
                HolderName = "Guest Explorer",
                SiteId = siteId,
                BrandCrestTitle = "Official Gujarat Heritage & Pilgrim Expedition Passport",
                IssuedDate = "2026-01-10",
                TotalStampsCount = defaultStamps.Count,
                UnlockedStampsCount = defaultStamps.Count(s => s.Unlocked),
                Tier = new LoyaltyTierDto
                {
                    TierName = "Silver Adventurer",
                    TierBadgeColor = "#D97706",
                    CurrentXp = 1150,
                    NextTierXp = 2000,
                    ProgressPercent = 58,
                    Perks = new List<string>
                    {
                        "5% Instant Booking Discount across all Gujarat pilgrim circuits",
                        "Priority 24/7 Specialist Concierge support",
                        "Free Darshan Queue VIP Coordination Guide",
                        "Complimentary Kathiyawadi Dining Recommendation Kit"
                    }
                },
                Stamps = defaultStamps,
                Challenges = new List<MilestoneChallengeDto>
                {
                    new MilestoneChallengeDto
                    {
                        Id = "ch_gj_audio",
                        Title = "Pilgrimage Storyteller",
                        Description = "Listen to Somnath or Dwarka cultural audio guide story",
                        Category = "audio",
                        TargetCount = 1,
                        CurrentCount = 1,
                        IsCompleted = true,
                        XpReward = 150,
                        IconName = "headset"
                    },
                    new MilestoneChallengeDto
                    {
                        Id = "ch_gj_budget",
                        Title = "Prudent Pilgrim",
                        Description = "Log at least 2 in-trip expenses in Trip Budget tracker",
                        Category = "budget",
                        TargetCount = 2,
                        CurrentCount = 2,
                        IsCompleted = true,
                        XpReward = 200,
                        IconName = "wallet"
                    },
                    new MilestoneChallengeDto
                    {
                        Id = "ch_gj_vault",
                        Title = "Sanctum Safety Guard",
                        Description = "Store your travel ID or train pass in Travel Vault",
                        Category = "vault",
                        TargetCount = 1,
                        CurrentCount = 1,
                        IsCompleted = true,
                        XpReward = 150,
                        IconName = "shield-checkmark"
                    },
                    new MilestoneChallengeDto
                    {
                        Id = "ch_gj_map",
                        Title = "Saurashtra Wayfarer",
                        Description = "Explore 3 sacred temple waypoints on Expedition Map",
                        Category = "exploration",
                        TargetCount = 3,
                        CurrentCount = 1,
                        IsCompleted = false,
                        XpReward = 300,
                        IconName = "map"
                    }
                }
            };
        }
    }
}
