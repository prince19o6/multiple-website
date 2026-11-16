using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/eco")]
    public class EcoController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<EcoController> _logger;

        public EcoController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<EcoController> logger)
        {
            _websiteContext = websiteContext;
            _dbProvider = dbProvider;
            _logger = logger;
        }

        private string ResolveSiteId(string? overrideSiteId = null)
        {
            if (!string.IsNullOrWhiteSpace(overrideSiteId))
                return overrideSiteId.Trim().ToLowerInvariant();

            if (HttpContext.Items.TryGetValue("SiteId", out var siteObj) && siteObj is string siteStr && !string.IsNullOrWhiteSpace(siteStr))
                return siteStr.Trim().ToLowerInvariant();

            var host = HttpContext.Request.Headers["X-Website-Hostname"].ToString();
            if (host.Contains("tripgoasia", StringComparison.OrdinalIgnoreCase)) return "tripgoasia";
            if (host.Contains("technoheaven", StringComparison.OrdinalIgnoreCase)) return "technoheaven";
            return "gujjutours";
        }

        [HttpGet("hub")]
        public IActionResult GetEcoHubData([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedEcoHub(resolvedSite);
            return Ok(new { success = true, data = hub });
        }

        [HttpPost("calculate")]
        public IActionResult CalculateEmissions([FromBody] CalculateEmissionsRequestDto request)
        {
            var pax = Math.Max(1, request.PaxCount);
            var nights = Math.Max(1, request.NightsCount);

            // Flight distance factor based on airports
            double flightMultiplier = 420.5;
            var origin = (request.OriginAirport ?? "BOM").ToUpperInvariant();
            var dest = (request.DestinationAirport ?? "BKK").ToUpperInvariant();

            if (origin.Contains("LHR") || origin.Contains("JFK") || origin.Contains("LAX") || origin.Contains("SYD"))
            {
                flightMultiplier = 980.0;
            }
            else if (origin.Contains("DXB") || origin.Contains("DOH"))
            {
                flightMultiplier = 550.0;
            }
            else if (origin.Contains("SIN") || origin.Contains("KUL"))
            {
                flightMultiplier = 210.0;
            }

            // Cabin class factor
            var classFactor = request.FlightClass?.ToLowerInvariant() switch
            {
                "business" => 2.2,
                "premiumeconomy" => 1.4,
                _ => 1.0
            };

            var flightKg = Math.Round(flightMultiplier * classFactor * pax, 1);
            var groundKg = Math.Round(38.2 * pax, 1);
            var hotelKg = Math.Round(nights * 12.8 * pax, 1);
            var totalKg = Math.Round(flightKg + groundKg + hotelKg, 1);

            var result = new CarbonEmissionBreakdownDto
            {
                FlightEmissionsKg = flightKg,
                GroundTransportEmissionsKg = groundKg,
                HotelStayEmissionsKg = hotelKg,
                TotalEmissionsKg = totalKg,
                TreesEquivalentCount = (int)Math.Ceiling(totalKg / 20.0),
                CarKmEquivalent = (int)Math.Round(totalKg * 4.12)
            };

            return Ok(new
            {
                success = true,
                origin = origin,
                destination = dest,
                cabinClass = request.FlightClass ?? "Economy",
                data = result
            });
        }

        [HttpPost("offset")]
        public IActionResult SubmitOffset([FromBody] SubmitOffsetRequestDto request, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedEcoHub(resolvedSite);

            var project = hub.Projects.FirstOrDefault(p => p.ProjectId == request.ProjectId) ?? hub.Projects[0];
            var certNum = "ECO-CERT-" + DateTime.UtcNow.Year + "-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
            var amountTonnes = request.OffsetAmountKg / 1000.0;
            var price = Math.Round(amountTonnes * project.PricePerTonneUsd, 2);

            var contribution = new OffsetContributionDto
            {
                ContributionId = "contrib-" + Guid.NewGuid().ToString("N")[..8],
                SiteId = resolvedSite,
                TravelerName = string.IsNullOrWhiteSpace(request.TravelerName) ? "Eco Traveler" : request.TravelerName.Trim(),
                BookingId = string.IsNullOrWhiteSpace(request.BookingId) ? "BK-LIVE-" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant() : request.BookingId.Trim(),
                ProjectId = project.ProjectId,
                ProjectName = project.Name,
                OffsetAmountKg = request.OffsetAmountKg,
                AmountPaidUsd = price,
                CertificateNumber = certNum,
                CertifiedDate = DateTime.UtcNow.ToString("dd MMM yyyy"),
                Status = "Verified_Retired"
            };

            return Ok(new
            {
                success = true,
                message = $"Successfully retired {request.OffsetAmountKg:F1} kg of CO2e through {project.Name}.",
                certificateNumber = certNum,
                data = contribution
            });
        }

        [HttpPost("pledge")]
        public IActionResult TogglePledge([FromBody] TogglePledgeRequestDto request)
        {
            return Ok(new
            {
                success = true,
                pledgeId = request.PledgeId,
                isPledged = request.IsPledged,
                message = request.IsPledged
                    ? "Thank you for taking the Sustainable Traveler Pledge!"
                    : "Pledge status updated."
            });
        }

        private static EcoHubDataDto GetSeedEcoHub(string siteId)
        {
            if (siteId == "technoheaven")
            {
                return new EcoHubDataDto
                {
                    SiteId = "technoheaven",
                    DefaultFlightRoute = "DXB ✈ BKK",
                    Emissions = new CarbonEmissionBreakdownDto
                    {
                        FlightEmissionsKg = 550.0,
                        GroundTransportEmissionsKg = 45.0,
                        HotelStayEmissionsKg = 95.0,
                        TotalEmissionsKg = 690.0,
                        TreesEquivalentCount = 35,
                        CarKmEquivalent = 2840
                    },
                    Projects = new List<VerifiedClimateProjectDto>
                    {
                        new VerifiedClimateProjectDto
                        {
                            ProjectId = "proj-dxb-bluecarbon",
                            SiteId = "technoheaven",
                            Name = "Arabian Gulf Coastal Blue Carbon & Mangrove Reserve",
                            Location = "Al Zorah & Sir Bani Yas, UAE",
                            Standard = "Verra VCS & CCB Verified",
                            PricePerTonneUsd = 20.00,
                            PricePerTonneLocal = "75 AED (~$20 USD)",
                            Description = "Protects coastal saline mangroves, creating high-capacity coastal blue carbon sinks and breeding habitats for endangered flamingos and green sea turtles.",
                            ImpactMetric = "120,000 mangrove seedlings protected across 450 hectares of coastal biosphere.",
                            BadgeAwarded = "Arabian Mangrove Pioneer",
                            IconName = "water"
                        },
                        new VerifiedClimateProjectDto
                        {
                            ProjectId = "proj-seasia-peat",
                            SiteId = "technoheaven",
                            Name = "Southeast Asia Peatland Carbon Sink & Wildlife Corridor",
                            Location = "Kalimantan & Sumatra",
                            Standard = "Gold Standard Verified",
                            PricePerTonneUsd = 16.00,
                            PricePerTonneLocal = "60 AED (~$16 USD)",
                            Description = "Prevents deep peatland fires and restores tropical rainforest corridors essential for wild orangutans and hornbills.",
                            ImpactMetric = "Over 1.2 million tonnes of CO2e avoided from peat oxidisation.",
                            BadgeAwarded = "Peatland Guardian",
                            IconName = "leaf"
                        }
                    },
                    MyContributions = new List<OffsetContributionDto>
                    {
                        new OffsetContributionDto
                        {
                            ContributionId = "contrib-th-01",
                            SiteId = "technoheaven",
                            TravelerName = "Sheikh Al Maktoum Family Trip",
                            BookingId = "BK-VIP-881920",
                            ProjectId = "proj-dxb-bluecarbon",
                            ProjectName = "Arabian Gulf Coastal Blue Carbon & Mangrove Reserve",
                            OffsetAmountKg = 690.0,
                            AmountPaidUsd = 13.80,
                            CertificateNumber = "ECO-CERT-2026-DXB7718",
                            CertifiedDate = "15 Oct 2026",
                            Status = "Verified_Retired"
                        }
                    },
                    Pledges = new List<EcoPledgeItemDto>
                    {
                        new EcoPledgeItemDto
                        {
                            Id = "pld-reef",
                            Title = "Reef-Safe Mineral Sunscreen Only",
                            Description = "I pledge to only use non-nano Zinc Oxide sunscreens to protect coral reefs from chemical bleaching.",
                            Category = "Oceans",
                            IsPledged = true,
                            IconName = "shield-checkmark"
                        },
                        new EcoPledgeItemDto
                        {
                            Id = "pld-elephant",
                            Title = "Ethical Elephant Observation Only",
                            Description = "I commit to visit observation-only sanctuaries with zero riding, bathing, or performance shows.",
                            Category = "Wildlife",
                            IsPledged = true,
                            IconName = "paw"
                        },
                        new EcoPledgeItemDto
                        {
                            Id = "pld-singleuse",
                            Title = "Zero Single-Use Plastic Water Bottles",
                            Description = "I carry a reusable thermos flask and utilize hotel/van purified water refill stations.",
                            Category = "PlasticFree",
                            IsPledged = false,
                            IconName = "refresh"
                        }
                    },
                    EcoExplorerLevel = "Carbon Neutral Explorer",
                    TotalKgOffset = 690.0
                };
            }

            if (siteId == "tripgoasia")
            {
                return new EcoHubDataDto
                {
                    SiteId = "tripgoasia",
                    DefaultFlightRoute = "LHR ✈ BKK",
                    Emissions = new CarbonEmissionBreakdownDto
                    {
                        FlightEmissionsKg = 980.0,
                        GroundTransportEmissionsKg = 45.0,
                        HotelStayEmissionsKg = 80.0,
                        TotalEmissionsKg = 1105.0,
                        TreesEquivalentCount = 55,
                        CarKmEquivalent = 4550
                    },
                    Projects = new List<VerifiedClimateProjectDto>
                    {
                        new VerifiedClimateProjectDto
                        {
                            ProjectId = "proj-th-gibbon",
                            SiteId = "tripgoasia",
                            Name = "Northern Thailand Highland Canopy Reforestation",
                            Location = "Chiang Mai & Mae Hong Son, Thailand",
                            Standard = "Plan Vivo Standard",
                            PricePerTonneUsd = 18.00,
                            PricePerTonneLocal = "620 THB (~$18 USD)",
                            Description = "Community-led agroforestry planting indigenous dipterocarp trees, reconnecting canopy habitats for the endangered white-handed gibbon.",
                            ImpactMetric = "80,000 native hardwood trees planted with 14 indigenous Karen hilltribe villages.",
                            BadgeAwarded = "Canopy Protector",
                            IconName = "leaf"
                        },
                        new VerifiedClimateProjectDto
                        {
                            ProjectId = "proj-kohtao-reef",
                            SiteId = "tripgoasia",
                            Name = "Koh Tao Coral Super-Nursery & Marine Sanctuary",
                            Location = "Gulf of Thailand",
                            Standard = "Verra VCS Verified",
                            PricePerTonneUsd = 22.00,
                            PricePerTonneLocal = "760 THB (~$22 USD)",
                            Description = "Micro-fragmentation nursery cultivating heat-resilient coral polyps to restore damaged coral bommies in Shark Bay.",
                            ImpactMetric = "2,500 heat-resilient coral colonies successfully transplanted onto natural reefs.",
                            BadgeAwarded = "Ocean Reef Champion",
                            IconName = "water"
                        }
                    },
                    MyContributions = new List<OffsetContributionDto>
                    {
                        new OffsetContributionDto
                        {
                            ContributionId = "contrib-tga-01",
                            SiteId = "tripgoasia",
                            TravelerName = "Alex Mercer",
                            BookingId = "BK-TGA-991204",
                            ProjectId = "proj-th-gibbon",
                            ProjectName = "Northern Thailand Highland Canopy Reforestation",
                            OffsetAmountKg = 1105.0,
                            AmountPaidUsd = 19.89,
                            CertificateNumber = "ECO-CERT-2026-TGA9921",
                            CertifiedDate = "18 Oct 2026",
                            Status = "Verified_Retired"
                        }
                    },
                    Pledges = new List<EcoPledgeItemDto>
                    {
                        new EcoPledgeItemDto
                        {
                            Id = "pld-reef",
                            Title = "Reef-Safe Mineral Sunscreen Only",
                            Description = "I pledge to only use non-nano Zinc Oxide sunscreens to protect coral reefs from chemical bleaching.",
                            Category = "Oceans",
                            IsPledged = true,
                            IconName = "shield-checkmark"
                        },
                        new EcoPledgeItemDto
                        {
                            Id = "pld-elephant",
                            Title = "Ethical Wildlife Encounters Only",
                            Description = "No elephant riding, tiger selfies, or dolphin captivity shows. Observation-only sanctuaries.",
                            Category = "Wildlife",
                            IsPledged = true,
                            IconName = "paw"
                        },
                        new EcoPledgeItemDto
                        {
                            Id = "pld-community",
                            Title = "Support Indigenous Community Crafts",
                            Description = "Purchase directly from local artisan cooperatives and eat at family-owned neighborhood stalls.",
                            Category = "Community",
                            IsPledged = true,
                            IconName = "people"
                        }
                    },
                    EcoExplorerLevel = "Biodiversity Guardian",
                    TotalKgOffset = 1105.0
                };
            }

            // Default: GujjuTours
            return new EcoHubDataDto
            {
                SiteId = "gujjutours",
                DefaultFlightRoute = "BOM ✈ BKK",
                Emissions = new CarbonEmissionBreakdownDto
                {
                    FlightEmissionsKg = 420.5,
                    GroundTransportEmissionsKg = 38.2,
                    HotelStayEmissionsKg = 64.0,
                    TotalEmissionsKg = 522.7,
                    TreesEquivalentCount = 26,
                    CarKmEquivalent = 2150
                },
                Projects = new List<VerifiedClimateProjectDto>
                {
                    new VerifiedClimateProjectDto
                    {
                        ProjectId = "proj-andaman-mangrove",
                        SiteId = "gujjutours",
                        Name = "Andaman Sea Mangrove & Dugong Habitat Restoration",
                        Location = "Krabi & Phang Nga Bay, Thailand",
                        Standard = "Gold Standard Verified",
                        PricePerTonneUsd = 14.50,
                        PricePerTonneLocal = "₹1,200 INR (500 THB)",
                        Description = "Restores mangrove delta forests that store 4x more carbon than land rainforests, creating sheltered nurseries for baby reef sharks and wild dugongs.",
                        ImpactMetric = "45,000 mangrove trees planted, sequestering ~18,000 tonnes of carbon over 20 years.",
                        BadgeAwarded = "Mangrove Guardian",
                        IconName = "leaf"
                    },
                    new VerifiedClimateProjectDto
                    {
                        ProjectId = "proj-thar-solar",
                        SiteId = "gujjutours",
                        Name = "Thar Desert Clean Solar & Wind Energy Grid",
                        Location = "Jaisalmer, Rajasthan, India",
                        Standard = "Verra VCS Verified",
                        PricePerTonneUsd = 12.00,
                        PricePerTonneLocal = "₹990 INR (~$12 USD)",
                        Description = "Displaces thermal coal generation with clean solar arrays, providing clean power and groundwater solar pumps to rural desert villages.",
                        ImpactMetric = "650 GWh of clean energy produced annually with zero emissions.",
                        BadgeAwarded = "Desert Sun Champion",
                        IconName = "sunny"
                    }
                },
                MyContributions = new List<OffsetContributionDto>
                {
                    new OffsetContributionDto
                    {
                        ContributionId = "contrib-gt-01",
                        SiteId = "gujjutours",
                        TravelerName = "Chirag & Meera Patel",
                        BookingId = "BK-TH-88192",
                        ProjectId = "proj-andaman-mangrove",
                        ProjectName = "Andaman Sea Mangrove & Dugong Habitat Restoration",
                        OffsetAmountKg = 522.7,
                        AmountPaidUsd = 7.58,
                        CertificateNumber = "ECO-CERT-2026-GT5510",
                        CertifiedDate = "20 Oct 2026",
                        Status = "Verified_Retired"
                    }
                },
                Pledges = new List<EcoPledgeItemDto>
                {
                    new EcoPledgeItemDto
                    {
                        Id = "pld-reef",
                        Title = "Reef-Safe Mineral Sunscreen Only",
                        Description = "I pledge to only use non-nano Zinc Oxide sunscreens to protect coral reefs from chemical bleaching.",
                        Category = "Oceans",
                        IsPledged = true,
                        IconName = "shield-checkmark"
                    },
                    new EcoPledgeItemDto
                    {
                        Id = "pld-elephant",
                        Title = "Ethical Elephant Sanctuaries Only",
                        Description = "Never ride elephants or attend shows. Support rescue centers where elephants roam freely.",
                        Category = "Wildlife",
                        IsPledged = true,
                        IconName = "paw"
                    },
                    new EcoPledgeItemDto
                    {
                        Id = "pld-veg",
                        Title = "Sattvic & Vegetarian Culinary Days",
                        Description = "Enjoy local vegetarian and plant-based dishes during the trip, cutting dining emissions in half.",
                        Category = "Community",
                        IsPledged = true,
                        IconName = "restaurant"
                    },
                    new EcoPledgeItemDto
                    {
                        Id = "pld-plastic",
                        Title = "Refuse Single-Use Plastic Straws & Bags",
                        Description = "Carry cloth bags for street markets and refuse plastic straws at beach shacks.",
                        Category = "PlasticFree",
                        IsPledged = false,
                        IconName = "trash-outline"
                    }
                },
                EcoExplorerLevel = "Eco Pioneer",
                TotalKgOffset = 522.7
            };
        }
    }
}
