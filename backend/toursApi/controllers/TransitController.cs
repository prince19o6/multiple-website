using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/transit")]
    public class TransitController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<TransitController> _logger;

        public TransitController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<TransitController> logger)
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
        public IActionResult GetTransitHubData([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedTransitHub(resolvedSite);
            return Ok(new { success = true, data = hub });
        }

        [HttpPost("calculate-fare")]
        public IActionResult CalculateFare([FromBody] CalculateTransitFareRequestDto request, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var isDubai = resolvedSite == "technoheaven";

            var orig = (request.Origin ?? "Siam").Trim();
            var dest = (request.Destination ?? "Chatuchak").Trim();

            int duration = 18;
            int stops = 7;
            double fare = isDubai ? 7.50 : 47.0;
            string currency = isDubai ? "AED" : "THB";
            string line = isDubai ? "Dubai Metro Red Line" : "BTS Sukhumvit Line";
            string instruction = isDubai
                ? $"Board Dubai Metro Red Line from {orig} towards {dest}. Tap your Silver Nol card at fare gates."
                : $"Take BTS Sukhumvit Line from {orig} towards {dest}. Direct travel, no train transfers required.";

            if (orig.Contains("Airport", StringComparison.OrdinalIgnoreCase) || dest.Contains("Airport", StringComparison.OrdinalIgnoreCase))
            {
                fare = isDubai ? 8.50 : 45.0;
                duration = isDubai ? 28 : 26;
                stops = isDubai ? 9 : 6;
                line = isDubai ? "Dubai Metro Red Line (Airport T1/T3)" : "Airport Rail Link (City Line)";
                instruction = isDubai
                    ? $"Direct Dubai Metro from Terminal 3 to Downtown Dubai ({duration} mins). Standard Nol Silver fare."
                    : $"Take Airport Rail Link from Suvarnabhumi Airport B1 level to Phaya Thai station ({duration} mins, 45 THB), avoiding all highway traffic.";
            }
            else if (orig.Contains("Grand Palace", StringComparison.OrdinalIgnoreCase) || dest.Contains("Grand Palace", StringComparison.OrdinalIgnoreCase) ||
                     orig.Contains("Chinatown", StringComparison.OrdinalIgnoreCase) || dest.Contains("Chinatown", StringComparison.OrdinalIgnoreCase))
            {
                line = "MRT Blue Line (Underground)";
                fare = 38.0;
                duration = 20;
                stops = 8;
                instruction = "Take MRT Blue Line to Sanam Chai station (Exit 1) for Grand Palace & Wat Pho, or Wat Mangkon station for Chinatown night food street.";
            }

            var result = new CalculateTransitFareResultDto
            {
                Origin = orig,
                Destination = dest,
                FareAmount = $"{fare:0.##} {currency}",
                FareLocalPrice = fare,
                CurrencySymbol = currency,
                DurationMins = duration,
                StopsCount = stops,
                Transfers = 0,
                RecommendedLine = line,
                Instruction = instruction
            };

            return Ok(new { success = true, data = result });
        }

        [HttpPost("estimate-taxi")]
        public IActionResult EstimateTaxiFare([FromBody] EstimateTaxiFareRequestDto request, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            bool isDubai = resolvedSite == "technoheaven";

            double dist = Math.Max(1.0, request.DistanceKm);
            double trafficMultiplier = request.TrafficCondition switch
            {
                "Heavy_Gridlock" => 1.5,
                "Light" => 1.0,
                _ => 1.2
            };

            if (isDubai)
            {
                double baseFare = 12.0;
                double perKm = 2.19;
                double meterEst = Math.Round((baseFare + (dist * perKm)) * trafficMultiplier, 0);
                double highEst = Math.Round(meterEst * 1.2, 0);
                double tollFees = request.UseExpressway ? 8.0 : 0.0; // Salik toll gate

                return Ok(new
                {
                    success = true,
                    data = new EstimateTaxiFareResultDto
                    {
                        DistanceKm = dist,
                        FairMeterRange = $"{meterEst} - {highEst} AED",
                        EstimatedTollFees = request.UseExpressway ? "8 AED (Salik toll gate)" : "0 AED",
                        TotalEstimatedCost = $"{meterEst + tollFees} - {highEst + tollFees} AED",
                        GrabBoltEstimate = $"{Math.Round((meterEst + tollFees) * 1.25, 0)} - {Math.Round((highEst + tollFees) * 1.35, 0)} AED (Careem / Uber)",
                        ScamAlertThreshold = $"Above {Math.Round(highEst * 1.8, 0)} AED",
                        DriverAdvice = "Official Dubai RTA taxis operate strictly on digital calibrated meters. Card payment is accepted in all cabs."
                    }
                });
            }

            // Bangkok Taxi Meter Logic
            // Base fare: 35 THB 1st km, ~6.50 THB/km up to 10km, 7.00 THB/km thereafter
            double bkkBase = 35.0;
            double variableKm = dist <= 10.0 ? (dist - 1.0) * 6.50 : (9.0 * 6.50) + ((dist - 10.0) * 7.50);
            double meterLow = Math.Round((bkkBase + variableKm) * trafficMultiplier, 0);
            double meterHigh = Math.Round(meterLow * 1.25, 0);
            double tollCost = request.UseExpressway ? 50.0 : 0.0;

            var bkkResult = new EstimateTaxiFareResultDto
            {
                DistanceKm = dist,
                FairMeterRange = $"{meterLow} - {meterHigh} THB",
                EstimatedTollFees = request.UseExpressway ? "50 - 75 THB (Expressway Tolls)" : "0 THB",
                TotalEstimatedCost = $"{meterLow + tollCost} - {meterHigh + tollCost} THB",
                GrabBoltEstimate = $"{Math.Round((meterLow + tollCost) * 1.3, 0)} - {Math.Round((meterHigh + tollCost) * 1.45, 0)} THB (Grab / Bolt)",
                ScamAlertThreshold = $"Above {Math.Round((meterHigh + tollCost) * 2.2, 0)} THB (Refuse flat-rate offer!)",
                DriverAdvice = "Always insist on the meter (บอกว่า 'เปิดมิเตอร์'). If a driver standing outside quotes 400-600 THB, walk 20 meters away and hail a moving pink/green taxi with illuminated 'ว่าง' (Vacant) sign."
            };

            return Ok(new { success = true, data = bkkResult });
        }

        private static TransitHubDataDto GetSeedTransitHub(string siteId)
        {
            if (siteId == "technoheaven")
            {
                var dubaiLines = new List<TransitLineDto>
                {
                    new TransitLineDto
                    {
                        LineId = "dubai-red",
                        LineName = "Dubai Metro Red Line",
                        SystemType = "Skytrain",
                        ColorHex = "#dc2626",
                        OperatingHours = "05:00 - 00:00 (Mon-Sat), 08:00 - 00:00 (Sun)",
                        PaymentMethods = new List<string> { "Nol Silver Card", "Nol Gold Card", "Red Ticket" },
                        KeyStations = new List<string> { "DXB Airport T3", "Burjuman", "Union", "Burj Khalifa / Dubai Mall", "Mall of the Emirates", "DMCC (Dubai Marina)", "Expo City" }
                    },
                    new TransitLineDto
                    {
                        LineId = "dubai-green",
                        LineName = "Dubai Metro Green Line",
                        SystemType = "Underground_Metro",
                        ColorHex = "#16a34a",
                        OperatingHours = "05:00 - 00:00 (Mon-Sat), 08:00 - 00:00 (Sun)",
                        PaymentMethods = new List<string> { "Nol Card" },
                        KeyStations = new List<string> { "Etisalat", "Gold Souk", "Al Ras (Spice Souk)", "Al Ghubaiba", "Burjuman Interchange" }
                    },
                    new TransitLineDto
                    {
                        LineId = "dubai-tram",
                        LineName = "Dubai Tram & Palm Monorail",
                        SystemType = "Monorail",
                        ColorHex = "#0284c7",
                        OperatingHours = "06:00 - 01:00 Daily",
                        PaymentMethods = new List<string> { "Nol Card (Tram)", "Separate Ticket (Palm Monorail)" },
                        KeyStations = new List<string> { "JBR 1", "JBR 2", "Dubai Marina", "Palm Jumeirah Gateway", "Atlantis The Palm" }
                    }
                };

                var dubaiRoutes = new List<TransitRouteQueryDto>
                {
                    new TransitRouteQueryDto
                    {
                        OriginStation = "DXB Airport T3",
                        DestinationStation = "Burj Khalifa / Dubai Mall",
                        EstimatedFare = "7.50 AED",
                        TravelTimeMins = 24,
                        TransfersRequired = 0,
                        RouteSummary = "Direct Red Line ride from Airport T3 to Burj Khalifa"
                    },
                    new TransitRouteQueryDto
                    {
                        OriginStation = "Dubai Mall",
                        DestinationStation = "Dubai Marina (DMCC)",
                        EstimatedFare = "7.50 AED",
                        TravelTimeMins = 22,
                        TransfersRequired = 0,
                        RouteSummary = "Direct Red Line ride along Sheikh Zayed Road"
                    },
                    new TransitRouteQueryDto
                    {
                        OriginStation = "Burjuman",
                        DestinationStation = "Gold Souk",
                        EstimatedFare = "5.00 AED",
                        TravelTimeMins = 12,
                        TransfersRequired = 0,
                        RouteSummary = "Direct Green Line ride across Dubai Creek"
                    }
                };

                var dubaiTaxi = new TaxiFareEstimatorDto
                {
                    City = "Dubai",
                    BaseMeterFare = "12 AED (street hail) / 25 AED (Airport DXB pickup)",
                    RatePerKm = "2.19 AED / km",
                    AirportSurcharge = "25 AED airport starting flagfall",
                    ScamPreventionTips = new List<string>
                    {
                        "Official RTA taxis are cream-colored with red, blue, green, or yellow roofs.",
                        "All Dubai taxis must use calibrated electronic meters and accept Visa/Mastercard.",
                        "Salik highway toll gates cost 8 AED each and are automatically added to the meter fare."
                    },
                    DriverPhrases = new List<TransitPhraseDto>
                    {
                        new TransitPhraseDto { English = "Please turn on the meter", NativeText = "الرجاء تشغيل العداد", Phonetic = "Al-rajaa' tashgheel al-'addaad" },
                        new TransitPhraseDto { English = "Receipt please", NativeText = "إيصال لو سمحت", Phonetic = "Eesaal law samaht" },
                        new TransitPhraseDto { English = "Can I pay by credit card?", NativeText = "هل يمكنني الدفع بالبطاقة؟", Phonetic = "Hal yumkinuni al-daf' bil-bitaqah?" }
                    }
                };

                return new TransitHubDataDto
                {
                    SiteId = "technoheaven",
                    City = "Dubai",
                    Lines = dubaiLines,
                    PopularRoutes = dubaiRoutes,
                    TaxiGuide = dubaiTaxi,
                    TransitPassAdvice = "Buy a Silver Nol Card (25 AED, includes 19 AED balance) at any metro station. Tap in and out at gates. Gold Class requires a Gold Nol Card for double fare."
                };
            }

            // Default: GujjuTours & TripGoAsia (Bangkok, Thailand)
            var bkkLines = new List<TransitLineDto>
            {
                new TransitLineDto
                {
                    LineId = "bts-sukhumvit",
                    LineName = "BTS Sukhumvit Line",
                    SystemType = "Skytrain",
                    ColorHex = "#10b981",
                    OperatingHours = "06:00 - 00:00 Daily",
                    PaymentMethods = new List<string> { "Rabbit Card", "Single Journey QR Ticket", "Line Pay" },
                    KeyStations = new List<string> { "Mo Chit (Chatuchak)", "Ari", "Phaya Thai (Airport Train)", "Siam (Interchange)", "Chit Lom", "Asok (MRT Interchange)", "Thong Lo", "On Nut" }
                },
                new TransitLineDto
                {
                    LineId = "bts-silom",
                    LineName = "BTS Silom Line",
                    SystemType = "Skytrain",
                    ColorHex = "#047857",
                    OperatingHours = "06:00 - 00:00 Daily",
                    PaymentMethods = new List<string> { "Rabbit Card", "Single Journey Ticket" },
                    KeyStations = new List<string> { "National Stadium (MBK)", "Siam (Central Interchange)", "Sala Daeng (Silom)", "Saphan Taksin (River Pier to Iconsiam)", "Krung Thon Buri" }
                },
                new TransitLineDto
                {
                    LineId = "mrt-blue",
                    LineName = "MRT Blue Line (Circle)",
                    SystemType = "Underground_Metro",
                    ColorHex = "#1d4ed8",
                    OperatingHours = "06:00 - 00:00 Daily",
                    PaymentMethods = new List<string> { "Contactless Visa/Mastercard Tap Directly", "Black Token", "MRT Card" },
                    KeyStations = new List<string> { "Chatuchak Park", "Sukhumvit (Asok BTS)", "Silom", "Hua Lamphong", "Wat Mangkon (Chinatown)", "Sanam Chai (Grand Palace)", "Tha Phra" }
                },
                new TransitLineDto
                {
                    LineId = "arl-city",
                    LineName = "Airport Rail Link (ARL)",
                    SystemType = "Airport_Train",
                    ColorHex = "#831843",
                    OperatingHours = "05:30 - 00:00 Daily",
                    PaymentMethods = new List<string> { "Single Journey Token", "ARL SmartPass" },
                    KeyStations = new List<string> { "Suvarnabhumi Airport (BKK)", "Makkasan (MRT Phetchaburi)", "Phaya Thai (BTS Interchange)" }
                }
            };

            var bkkRoutes = new List<TransitRouteQueryDto>
            {
                new TransitRouteQueryDto
                {
                    OriginStation = "Suvarnabhumi Airport (BKK)",
                    DestinationStation = "Siam / Sukhumvit",
                    EstimatedFare = "62 THB (~₹150 INR)",
                    TravelTimeMins = 38,
                    TransfersRequired = 1,
                    RouteSummary = "ARL from Airport to Phaya Thai (45 THB) + BTS to Siam (17 THB). Bypass 1.5 hours of highway gridlock!"
                },
                new TransitRouteQueryDto
                {
                    OriginStation = "Siam",
                    DestinationStation = "Chatuchak Weekend Market (Mo Chit)",
                    EstimatedFare = "47 THB (~₹115 INR)",
                    TravelTimeMins = 16,
                    TransfersRequired = 0,
                    RouteSummary = "Direct BTS Sukhumvit Line North to Mo Chit Exit 1."
                },
                new TransitRouteQueryDto
                {
                    OriginStation = "Asok / Sukhumvit",
                    DestinationStation = "Chinatown (Wat Mangkon Night Street)",
                    EstimatedFare = "35 THB (~₹85 INR)",
                    TravelTimeMins = 18,
                    TransfersRequired = 0,
                    RouteSummary = "Direct MRT Blue Line underground ride from Sukhumvit to Wat Mangkon Exit 1."
                },
                new TransitRouteQueryDto
                {
                    OriginStation = "Siam",
                    DestinationStation = "Grand Palace & Wat Pho (Sanam Chai)",
                    EstimatedFare = "44 THB (~₹105 INR)",
                    TravelTimeMins = 22,
                    TransfersRequired = 1,
                    RouteSummary = "BTS to Sala Daeng, transfer to MRT Silom to Sanam Chai (Museum Exit)."
                }
            };

            var bkkTaxi = new TaxiFareEstimatorDto
            {
                City = "Bangkok",
                BaseMeterFare = "35 THB for 1st km",
                RatePerKm = "6.50 THB / km (1-10 km), 7.00 THB / km (10-20 km)",
                AirportSurcharge = "50 THB official airport queue surcharge + expressway tolls (50-75 THB paid by passenger)",
                ScamPreventionTips = new List<string>
                {
                    "NEVER take a parked taxi outside major tourist sites (Grand Palace, MBK, Khao San) that refuses to turn on the meter and quotes 400-800 THB flat rate.",
                    "Hail moving taxis with the glowing red/green 'ว่าง' (Vacant) sign on the windshield.",
                    "If driver says 'meter broken' or 'heavy traffic, 500 baht flat', immediately say 'No thank you' and step out.",
                    "Tuk-Tuks are fun for 5-minute novelty rides, but ALWAYS agree on the total price BEFORE stepping in (expect 100-150 THB for short trips; beware gemstone/tailor scam stops!).",
                    "Keep Grab or Bolt installed on your phone to compare fair baseline prices before hailing street cabs."
                },
                DriverPhrases = new List<TransitPhraseDto>
                {
                    new TransitPhraseDto { English = "Please turn on the meter", NativeText = "กรุณาเปิดมิเตอร์ด้วยครับ", Phonetic = "Krù-naa bpə̀ət míi-dtə̂ə dûai kráp" },
                    new TransitPhraseDto { English = "No flat rate / by meter only", NativeText = "ไม่เอาเหมาครับ คิดตามมิเตอร์", Phonetic = "Mâi ao mǎo kráp, kít dtaam míi-dtə̂ə" },
                    new TransitPhraseDto { English = "Please take the expressway (I will pay toll)", NativeText = "ขึ้นทางด่วนครับ เดี๋ยวจ่ายค่าผ่านทาง", Phonetic = "Kʉ̂n taang-dùan kráp, dǐao jàai kâa pàan taang" },
                    new TransitPhraseDto { English = "Please stop here, thank you", NativeText = "จอดตรงนี้ครับ ขอบคุณครับ", Phonetic = "Jɔ̀ɔt dtrong níi kráp, kɔ̀ɔp-kun kráp" },
                    new TransitPhraseDto { English = "Receipt please", NativeText = "ขอใบเสร็จด้วยครับ", Phonetic = "Kɔ̌ɔ bai-sèt dûai kráp" }
                }
            };

            return new TransitHubDataDto
            {
                SiteId = siteId,
                City = "Bangkok",
                Lines = bkkLines,
                PopularRoutes = bkkRoutes,
                TaxiGuide = bkkTaxi,
                TransitPassAdvice = "MRT Blue Line directly accepts Contactless Visa/Mastercard credit cards at fare gates! For BTS Skytrain, buy a Rabbit Card (200 THB with 100 THB credit) at any ticket counter to skip long ticket vending machine queues."
            };
        }
    }
}
