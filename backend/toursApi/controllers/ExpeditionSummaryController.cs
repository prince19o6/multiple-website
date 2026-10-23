using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/expedition-summary")]
    public class ExpeditionSummaryController : ControllerBase
    {
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly IWebsiteContext _websiteContext;
        private readonly ILogger<ExpeditionSummaryController> _logger;

        // In-memory simulation of claimed vouchers & review boosts during session
        private static readonly HashSet<string> _claimedVouchers = new();
        private static int _bonusPoints = 0;

        public ExpeditionSummaryController(
            IMongoDatabaseProvider dbProvider,
            IWebsiteContext websiteContext,
            ILogger<ExpeditionSummaryController> logger)
        {
            _dbProvider = dbProvider;
            _websiteContext = websiteContext;
            _logger = logger;
        }

        private string ResolveSiteId(string? overrideSiteId = null)
        {
            if (!string.IsNullOrWhiteSpace(overrideSiteId))
                return overrideSiteId.Trim().ToLowerInvariant();

            if (HttpContext.Items.TryGetValue("SiteId", out var siteObj) && siteObj is string siteStr && !string.IsNullOrWhiteSpace(siteStr))
                return siteStr.Trim().ToLowerInvariant();

            var host = HttpContext.Request.Headers["X-Website-Hostname"].ToString();
            if (host.Contains("technoheaven", StringComparison.OrdinalIgnoreCase)) return "technoheaven";
            if (host.Contains("gujjutours", StringComparison.OrdinalIgnoreCase)) return "gujjutours";

            return "tripgoasia";
        }

        [HttpGet("hub")]
        public IActionResult GetHub([FromQuery] string? siteId = null)
        {
            var site = ResolveSiteId(siteId);
            var hubData = BuildHubData(site);
            return Ok(new { success = true, data = hubData });
        }

        [HttpGet("wrapped")]
        public IActionResult GetWrappedStats([FromQuery] string? siteId = null)
        {
            var site = ResolveSiteId(siteId);
            var hubData = BuildHubData(site);
            return Ok(new { success = true, data = hubData.Wrapped });
        }

        [HttpGet("loyalty")]
        public IActionResult GetLoyaltyStatus([FromQuery] string? siteId = null)
        {
            var site = ResolveSiteId(siteId);
            var hubData = BuildHubData(site);
            return Ok(new { 
                success = true, 
                data = hubData.Loyalty, 
                rewards = hubData.AvailableRewards 
            });
        }

        [HttpPost("claim-reward")]
        public IActionResult ClaimReward([FromBody] ClaimRewardRequest request, [FromQuery] string? siteId = null)
        {
            if (string.IsNullOrWhiteSpace(request.VoucherCode))
            {
                return BadRequest(new { success = false, message = "Voucher code is required." });
            }

            var site = ResolveSiteId(siteId);
            var hubData = BuildHubData(site);
            var voucher = hubData.AvailableRewards.FirstOrDefault(v => v.VoucherCode.Equals(request.VoucherCode, StringComparison.OrdinalIgnoreCase));

            if (voucher == null)
            {
                return NotFound(new { success = false, message = "Reward voucher not found." });
            }

            if (hubData.Loyalty.CurrentPoints < voucher.PointsCost)
            {
                return BadRequest(new { success = false, message = $"Insufficient loyalty points. Required: {voucher.PointsCost}, Available: {hubData.Loyalty.CurrentPoints}" });
            }

            _claimedVouchers.Add(voucher.VoucherCode.ToUpperInvariant());
            voucher.IsClaimed = true;
            _bonusPoints -= voucher.PointsCost;

            _logger.LogInformation("Voucher {VoucherCode} claimed successfully for site {Site}. Deducted {Points} pts", voucher.VoucherCode, site, voucher.PointsCost);

            return Ok(new
            {
                success = true,
                message = $"Congratulations! Voucher {voucher.VoucherCode} has been unlocked.",
                data = new
                {
                    voucherCode = voucher.VoucherCode,
                    title = voucher.Title,
                    discountLabel = voucher.DiscountLabel,
                    expiryDate = voucher.ExpiryDate,
                    remainingPoints = Math.Max(0, hubData.Loyalty.CurrentPoints - voucher.PointsCost),
                    usageInstructions = "Apply this promotional code during checkout on your next expedition booking."
                }
            });
        }

        [HttpPost("review-boost")]
        public IActionResult SubmitReviewBoost([FromBody] ReviewBoostRequest request, [FromQuery] string? siteId = null)
        {
            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest(new { success = false, message = "Rating must be between 1 and 5 stars." });
            }

            var earnedBonus = 250;
            _bonusPoints += earnedBonus;

            var site = ResolveSiteId(siteId);
            _logger.LogInformation("Review submitted for tour {TourId} on site {Site}. Awarded {Bonus} loyalty points", request.TourId, site, earnedBonus);

            return Ok(new
            {
                success = true,
                message = "Thank you for documenting your memories! 250 VIP Loyalty Points have been credited.",
                pointsAwarded = earnedBonus,
                newTotalPoints = BuildHubData(site).Loyalty.CurrentPoints,
                boostBadge = "Verified Expedition Reviewer"
            });
        }

        [HttpGet("certificate")]
        public IActionResult GetCertificate([FromQuery] string? siteId = null)
        {
            var site = ResolveSiteId(siteId);
            var hubData = BuildHubData(site);
            return Ok(new { success = true, data = hubData.Certificate });
        }

        private ExpeditionSummaryHubDto BuildHubData(string siteId)
        {
            switch (siteId)
            {
                case "technoheaven":
                    return BuildTechnoheavenData();
                case "gujjutours":
                    return BuildGujjuToursData();
                default:
                    return BuildTripGoAsiaData();
            }
        }

        private ExpeditionSummaryHubDto BuildTripGoAsiaData()
        {
            var currentPoints = 3850 + _bonusPoints;
            return new ExpeditionSummaryHubDto
            {
                DestinationHub = "Thailand & Southeast Asia",
                CurrencySymbol = "฿",
                Wrapped = new ExpeditionWrappedStats
                {
                    TravelerName = "Alex Rivera",
                    Year = "2026",
                    TotalKmTraveled = 3420,
                    CountriesVisited = 3,
                    CitiesExplored = 5,
                    ToursCompleted = 6,
                    CarbonOffsetKg = 124.5m,
                    TreesPlantedEquivalent = 18,
                    TotalBargainingSavings = 4850,
                    TotalVatRefundClaimed = 3200,
                    AudioStoriesListenedMinutes = 95,
                    FavoriteCategory = "Tropical Islands & Heritage",
                    TopLandmarksVisited = new List<string> { "Wat Arun (Temple of Dawn)", "Maya Bay Coral Lagoon", "Chatuchak Art District", "Doi Suthep Sanctuary" },
                    UnlockedBadges = new List<string> { "Island Hopper", "Bargain Negotiator", "Mangrove Guardian", "Street Food Legend", "Temple Respect Champion" },
                    TravelerArchetype = "Tropical Eco-Explorer & Cultural Navigator",
                    HighlightQuote = "From Bangkok dawn chants to Andaman limestone cliffs, every mile etched memories of a lifetime."
                },
                Loyalty = new LoyaltyTierData
                {
                    MemberId = "TGA-VIP-88219",
                    MemberName = "Alex Rivera",
                    CurrentTier = "Gold Globetrotter",
                    TierBadgeEmoji = "👑",
                    CurrentPoints = currentPoints,
                    PointsToNextTier = Math.Max(0, 5000 - currentPoints),
                    NextTierName = "Platinum Legend",
                    ProgressPercentage = Math.Min(100, (int)(currentPoints / 5000.0 * 100)),
                    MultiplierBadge = "1.5x Multiplier",
                    Perks = new List<string>
                    {
                        "Free Priority Airport VIP Fast-Track Immigration",
                        "Complimentary 5GB Ultra-High-Speed eSIM Roaming",
                        "15% Flat Discount On All Day Expeditions",
                        "Dedicated 24/7 WhatsApp VIP Concierge Line",
                        "Free Cancellation up to 12 Hours Before Departure"
                    }
                },
                AvailableRewards = new List<LoyaltyRewardVoucher>
                {
                    new()
                    {
                        VoucherId = "rew-tga-1",
                        VoucherCode = "ANDAMAN25OFF",
                        Title = "25% Off Andaman Island Cruise",
                        Description = "Valid on Phi Phi Islands, James Bond Island, and Similan archipelago day tours.",
                        DiscountLabel = "25% OFF",
                        PointsCost = 1500,
                        IsClaimed = _claimedVouchers.Contains("ANDAMAN25OFF"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "Booking Discount"
                    },
                    new()
                    {
                        VoucherId = "rew-tga-2",
                        VoucherCode = "MIRACLEVIPLOUNGE",
                        Title = "Miracle VIP Airport Lounge Access",
                        Description = "Complimentary 3-hour lounge pass with hot gourmet buffet, showers, and bar at Suvarnabhumi Airport (BKK).",
                        DiscountLabel = "FREE PASS",
                        PointsCost = 900,
                        IsClaimed = _claimedVouchers.Contains("MIRACLEVIPLOUNGE"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "Airport Perk"
                    },
                    new()
                    {
                        VoucherId = "rew-tga-3",
                        VoucherCode = "THAIROAM5GB",
                        Title = "5GB High-Speed Southeast Asia eSIM",
                        Description = "Instant QR code eSIM voucher valid in Thailand, Malaysia, and Singapore on 5G networks.",
                        DiscountLabel = "100% FREE",
                        PointsCost = 600,
                        IsClaimed = _claimedVouchers.Contains("THAIROAM5GB"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "Connectivity"
                    },
                    new()
                    {
                        VoucherId = "rew-tga-4",
                        VoucherCode = "CHEFDINING500",
                        Title = "฿500 Michelin Guide Dining Credit",
                        Description = "Redeemable at participating Michelin Bib Gourmand restaurants in Bangkok and Phuket Old Town.",
                        DiscountLabel = "฿500 CREDIT",
                        PointsCost = 800,
                        IsClaimed = _claimedVouchers.Contains("CHEFDINING500"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "Culinary Pass"
                    }
                },
                Certificate = new ExpeditionCertificate
                {
                    CertificateId = "CERT-TGA-2026-8819",
                    RecipientName = "Alex Rivera",
                    Title = "Honorary Order of the Andaman Voyager",
                    Citation = "In recognition of demonstrating outstanding curiosity, cultural reverence, ecological stewardship, and adventurous spirit across the Kingdom of Thailand and Southeast Asia.",
                    IssueDate = "October 2026",
                    ExpeditionSignature = "Capt. Somchai Prasert, Royal Expedition Director",
                    GoldSealText = "TRIPGO ASIA SOVEREIGN SEAL • VERIFIED EXPEDITION"
                }
            };
        }

        private ExpeditionSummaryHubDto BuildGujjuToursData()
        {
            var currentPoints = 4200 + _bonusPoints;
            return new ExpeditionSummaryHubDto
            {
                DestinationHub = "India, Gujarat Heritage & International Circuit",
                CurrencySymbol = "₹",
                Wrapped = new ExpeditionWrappedStats
                {
                    TravelerName = "Parthiv & Charmi Shah",
                    Year = "2026",
                    TotalKmTraveled = 4890,
                    CountriesVisited = 2,
                    CitiesExplored = 7,
                    ToursCompleted = 8,
                    CarbonOffsetKg = 198.0m,
                    TreesPlantedEquivalent = 24,
                    TotalBargainingSavings = 12400,
                    TotalVatRefundClaimed = 8500,
                    AudioStoriesListenedMinutes = 135,
                    FavoriteCategory = "Family Heritage & Pure Veg Trails",
                    TopLandmarksVisited = new List<string> { "Somnath Shore Temple", "Gir National Asiatic Lion Reserve", "Wat Pho Reclining Buddha", "Pattaya Floating Market" },
                    UnlockedBadges = new List<string> { "Swaminarayan Pure Dining", "Heritage Custodian", "Family Caravan Pilot", "Grand Souk Haggler", "Green Pilgrim" },
                    TravelerArchetype = "Pure-Vegetarian Heritage Pilgrim & Family Explorer",
                    HighlightQuote = "Celebrating traditions with family while traversing oceans—pure vegetarian food and warmth accompanied every step."
                },
                Loyalty = new LoyaltyTierData
                {
                    MemberId = "GJT-ROYAL-7740",
                    MemberName = "Parthiv & Charmi Shah",
                    CurrentTier = "Gold Globetrotter",
                    TierBadgeEmoji = "🏆",
                    CurrentPoints = currentPoints,
                    PointsToNextTier = Math.Max(0, 5000 - currentPoints),
                    NextTierName = "Platinum Legend",
                    ProgressPercentage = Math.Min(100, (int)(currentPoints / 5000.0 * 100)),
                    MultiplierBadge = "1.5x Multiplier",
                    Perks = new List<string>
                    {
                        "Guaranteed Pure Jain / Swaminarayan Dining Coordinator on all tours",
                        "Complimentary Luxury Chauffeur Upgrade (Toyota Innova Crysta / Alphard)",
                        "₹2,500 Direct Discount on International Family Packages",
                        "Dedicated Gujarati & Hindi Speaking Tour Director Priority Line",
                        "Zero-Deductible Travel Insurance Extension"
                    }
                },
                AvailableRewards = new List<LoyaltyRewardVoucher>
                {
                    new()
                    {
                        VoucherId = "rew-gjt-1",
                        VoucherCode = "GUJJUFAMILY30",
                        Title = "₹3,000 Off International Family Package",
                        Description = "Direct cashback deduction on Thailand, Dubai, or Singapore multi-city family bookings.",
                        DiscountLabel = "₹3,000 OFF",
                        PointsCost = 1800,
                        IsClaimed = _claimedVouchers.Contains("GUJJUFAMILY30"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "Booking Discount"
                    },
                    new()
                    {
                        VoucherId = "rew-gjt-2",
                        VoucherCode = "JAINROYALMEAL",
                        Title = "Complimentary 5-Star Pure Jain Banquet",
                        Description = "Special multi-course authentic vegetarian dining voucher at our verified partner culinary pavilion.",
                        DiscountLabel = "FREE BANQUET",
                        PointsCost = 700,
                        IsClaimed = _claimedVouchers.Contains("JAINROYALMEAL"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "Culinary Pass"
                    },
                    new()
                    {
                        VoucherId = "rew-gjt-3",
                        VoucherCode = "AIRPORTCHAUFFEUR",
                        Title = "Free Airport Chauffeur Transfer",
                        Description = "Door-to-door private airport transfer to/from Ahmedabad SVPI or Mumbai CSMI airport.",
                        DiscountLabel = "100% FREE",
                        PointsCost = 1200,
                        IsClaimed = _claimedVouchers.Contains("AIRPORTCHAUFFEUR"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "Airport Perk"
                    }
                },
                Certificate = new ExpeditionCertificate
                {
                    CertificateId = "CERT-GJT-2026-9921",
                    RecipientName = "Parthiv & Charmi Shah",
                    Title = "Saurashtra to Siam Heritage Laureate",
                    Citation = "Honored for upholding timeless cultural values, supporting sustainable pilgrimage practices, and traveling with boundless unity and joy.",
                    IssueDate = "October 2026",
                    ExpeditionSignature = "Shri Bhaveshbhai Patel, Founder & Cultural Patron",
                    GoldSealText = "GUJJUTOURS HERITAGE EMBLEM • OFFICIAL HONORS DIPLOMA"
                }
            };
        }

        private ExpeditionSummaryHubDto BuildTechnoheavenData()
        {
            var currentPoints = 8900 + _bonusPoints;
            return new ExpeditionSummaryHubDto
            {
                DestinationHub = "United Arab Emirates & Global Luxury Capitals",
                CurrencySymbol = "AED",
                Wrapped = new ExpeditionWrappedStats
                {
                    TravelerName = "Marcus Vance",
                    Year = "2026",
                    TotalKmTraveled = 7150,
                    CountriesVisited = 4,
                    CitiesExplored = 8,
                    ToursCompleted = 10,
                    CarbonOffsetKg = 310.0m,
                    TreesPlantedEquivalent = 35,
                    TotalBargainingSavings = 1850,
                    TotalVatRefundClaimed = 2400,
                    AudioStoriesListenedMinutes = 180,
                    FavoriteCategory = "Ultra-Luxury & Skyline Architecture",
                    TopLandmarksVisited = new List<string> { "Burj Khalifa Apex 148th Floor", "Sheikh Zayed Grand Mosque", "Dubai Marina Royal Pier", "Museum of the Future" },
                    UnlockedBadges = new List<string> { "Skyline Vanguard", "Dune Master", "Michelin Tastemaker", "Helicopter Navigator", "VIP Club Laureate" },
                    TravelerArchetype = "Ultra-Luxury Jetsetter & Skyline Pioneer",
                    HighlightQuote = "From desert starlight to golden skyline horizons, true luxury is measured in flawless moments."
                },
                Loyalty = new LoyaltyTierData
                {
                    MemberId = "TH-LEGEND-0014",
                    MemberName = "Marcus Vance",
                    CurrentTier = "Platinum Legend",
                    TierBadgeEmoji = "💎",
                    CurrentPoints = currentPoints,
                    PointsToNextTier = 0,
                    NextTierName = "Top VIP Tier Reached",
                    ProgressPercentage = 100,
                    MultiplierBadge = "2.0x Double Points",
                    Perks = new List<string>
                    {
                        "Complimentary Private Chauffeur in Mercedes S-Class / BMW 7-Series",
                        "Unlimited Worldwide 5G Data Roaming Connectivity",
                        "Priority Access to Sold-Out Michelin Star Chef Tastings",
                        "Direct Line to Personal Executive Travel Butler",
                        "Exclusive Invitations to Sovereign Yacht & Golf Galas"
                    }
                },
                AvailableRewards = new List<LoyaltyRewardVoucher>
                {
                    new()
                    {
                        VoucherId = "rew-th-1",
                        VoucherCode = "ROYALYACHT50",
                        Title = "50% Off Private Luxury Yacht Charter",
                        Description = "Valid for 4-hour sunset cruise around Palm Jumeirah & Burj Al Arab.",
                        DiscountLabel = "50% OFF",
                        PointsCost = 3000,
                        IsClaimed = _claimedVouchers.Contains("ROYALYACHT50"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "VIP Experience"
                    },
                    new()
                    {
                        VoucherId = "rew-th-2",
                        VoucherCode = "BURJTEAPASS",
                        Title = "Burj Al Arab Skyview High Tea",
                        Description = "Exclusive high tea reservation for two at the iconic 27th floor Skyview Bar.",
                        DiscountLabel = "COMPLIMENTARY",
                        PointsCost = 2200,
                        IsClaimed = _claimedVouchers.Contains("BURJTEAPASS"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "Culinary Pass"
                    },
                    new()
                    {
                        VoucherId = "rew-th-3",
                        VoucherCode = "HELITRANSFER750",
                        Title = "750 AED Helicopter & Chauffeur Credit",
                        Description = "Redeemable towards city heli-tours or airport helipad transfers across Dubai.",
                        DiscountLabel = "750 AED CREDIT",
                        PointsCost = 1800,
                        IsClaimed = _claimedVouchers.Contains("HELITRANSFER750"),
                        ExpiryDate = "31 Dec 2026",
                        Category = "Airport Perk"
                    }
                },
                Certificate = new ExpeditionCertificate
                {
                    CertificateId = "CERT-TH-2026-0089",
                    RecipientName = "Marcus Vance",
                    Title = "Emirates Sovereign Explorer Laureate",
                    Citation = "Presented in tribute to exceptional elegance, cross-cultural diplomacy, and visionary appreciation of world architecture and heritage.",
                    IssueDate = "October 2026",
                    ExpeditionSignature = "Tariq Al-Maktoum, High Commissioner of Tourism",
                    GoldSealText = "TECHNOHEAVEN SOVEREIGN DIPLOMA • TOP 1% VIP CITATION"
                }
            };
        }
    }
}
