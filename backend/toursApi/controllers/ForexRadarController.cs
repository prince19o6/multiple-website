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
    [Route("api/forex")]
    public class ForexRadarController : ControllerBase
    {
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly IWebsiteContext _websiteContext;
        private readonly ILogger<ForexRadarController> _logger;

        public ForexRadarController(
            IMongoDatabaseProvider dbProvider,
            IWebsiteContext websiteContext,
            ILogger<ForexRadarController> logger)
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

        [HttpGet("radar")]
        public IActionResult GetForexRadar([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            ForexRadarDataDto radarData = resolvedSite switch
            {
                "technoheaven" => GetUaeForexRadar(),
                "gujjutours" => GetIndiaForexRadar(),
                _ => GetThailandForexRadar()
            };

            return Ok(new { success = true, data = radarData });
        }

        [HttpGet("kiosks")]
        public IActionResult GetVerifiedKiosks([FromQuery] string? siteId = null, [FromQuery] string? city = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var radar = resolvedSite switch
            {
                "technoheaven" => GetUaeForexRadar(),
                "gujjutours" => GetIndiaForexRadar(),
                _ => GetThailandForexRadar()
            };
            var kiosks = radar.VerifiedKiosks;

            if (!string.IsNullOrWhiteSpace(city))
            {
                kiosks = kiosks.Where(k => k.City.Equals(city, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            return Ok(new { success = true, data = kiosks });
        }

        private static ForexRadarDataDto GetThailandForexRadar()
        {
            return new ForexRadarDataDto
            {
                DestinationCountry = "Thailand",
                DestinationCurrencyCode = "THB",
                DestinationCurrencySymbol = "฿",
                LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm UTC"),
                PassportRuleNotice = "By Bank of Thailand law, your original physical passport is required for all foreign currency cash exchange transactions.",
                BaseRates = new List<ForexCounterRate>
                {
                    new ForexCounterRate
                    {
                        CurrencyCode = "USD",
                        CurrencyName = "US Dollar (100/50)",
                        FlagEmoji = "🇺🇸",
                        BankAirportBuyRate = 33.25m,
                        CityCounterBuyRate = 35.85m,
                        CityCounterSellRate = 35.95m,
                        SpreadPercent = "0.28% (Ultra-Tight)",
                        AirportLossPercent = "7.2% worse at airport banks",
                        NoteConditionTips = "Crisp Series 2013+ bills with 3D blue ribbon required. Zero stamps, ink marks or tears accepted. Smaller $1-$20 bills fetch 0.40฿ lower rate."
                    },
                    new ForexCounterRate
                    {
                        CurrencyCode = "EUR",
                        CurrencyName = "Euro (50-500)",
                        FlagEmoji = "🇪🇺",
                        BankAirportBuyRate = 36.20m,
                        CityCounterBuyRate = 38.65m,
                        CityCounterSellRate = 38.80m,
                        SpreadPercent = "0.38%",
                        AirportLossPercent = "6.3% worse at airport banks",
                        NoteConditionTips = "All standard 50€, 100€, and 200€ euro notes accepted with minimal handling marks."
                    },
                    new ForexCounterRate
                    {
                        CurrencyCode = "GBP",
                        CurrencyName = "British Pound",
                        FlagEmoji = "🇬🇧",
                        BankAirportBuyRate = 42.40m,
                        CityCounterBuyRate = 45.45m,
                        CityCounterSellRate = 45.70m,
                        SpreadPercent = "0.55%",
                        AirportLossPercent = "6.7% worse at airport banks",
                        NoteConditionTips = "Only polymer Bank of England notes accepted. Old paper notes are completely rejected in Thailand."
                    },
                    new ForexCounterRate
                    {
                        CurrencyCode = "INR",
                        CurrencyName = "Indian Rupee (500)",
                        FlagEmoji = "🇮🇳",
                        BankAirportBuyRate = 0.360m,
                        CityCounterBuyRate = 0.418m,
                        CityCounterSellRate = 0.428m,
                        SpreadPercent = "2.3%",
                        AirportLossPercent = "13.8% worse at airport banks",
                        NoteConditionTips = "Only new Mahatma Gandhi series 500 INR notes in crisp condition. Exchanged primarily at SuperRich Rajdamri HQ and Vasu Nana."
                    },
                    new ForexCounterRate
                    {
                        CurrencyCode = "SGD",
                        CurrencyName = "Singapore Dollar",
                        FlagEmoji = "🇸🇬",
                        BankAirportBuyRate = 25.10m,
                        CityCounterBuyRate = 26.95m,
                        CityCounterSellRate = 27.10m,
                        SpreadPercent = "0.55%",
                        AirportLossPercent = "6.8% worse at airport banks",
                        NoteConditionTips = "Polymer notes accepted in all denominations with zero penalty."
                    },
                    new ForexCounterRate
                    {
                        CurrencyCode = "AUD",
                        CurrencyName = "Australian Dollar",
                        FlagEmoji = "🇦🇺",
                        BankAirportBuyRate = 21.80m,
                        CityCounterBuyRate = 23.45m,
                        CityCounterSellRate = 23.65m,
                        SpreadPercent = "0.85%",
                        AirportLossPercent = "7.0% worse at airport banks",
                        NoteConditionTips = "Australian polymer notes accepted freely. Clear plastic window must be undamaged."
                    }
                },
                AtmDccShield = new List<AtmDccTip>
                {
                    new AtmDccTip
                    {
                        TipKey = "dcc-trap",
                        Title = "The ATM Dynamic Currency Conversion (DCC) Trap",
                        Severity = "CRITICAL",
                        ActionPrompt = "ALWAYS SELECT 'WITHOUT CONVERSION' (CONTINUE IN THB)",
                        Explanation = "When the Thai ATM asks: 'Convert to USD at guaranteed rate?' vs 'Continue without conversion in THB', ALWAYS choose without conversion! The ATM's guaranteed conversion applies an extortionate 8% to 11% markup. If you decline conversion, your home bank converts at the real Visa/Mastercard wholesale rate.",
                        AtmWithdrawalFeeNotice = "Standard Thai ATM fee is 220 THB (~$6.50) per withdrawal for all foreign cards. Withdraw 20,000–30,000 THB in one go to keep fee percentage under 0.8%."
                    },
                    new AtmDccTip
                    {
                        TipKey = "airport-secret",
                        Title = "Bangkok Airport SuperRich Secret (B Floor)",
                        Severity = "RECOMMENDED",
                        ActionPrompt = "DO NOT EXCHANGE AT BAGGAGE CLAIM BANKS",
                        Explanation = "Bank counters at arrivals (SCB, Kasikorn, Bangkok Bank) pay 7% to 10% lower rates. Instead, take the elevator down to the Airport Rail Link station on Level B. You will find SuperRich Orange and HappyRich booths with identical city-center rates 50 meters away!",
                        AtmWithdrawalFeeNotice = "Zero exchange fee at SuperRich booths. Bring exact cash and original passport."
                    },
                    new AtmDccTip
                    {
                        TipKey = "counterfeit-and-damage",
                        Title = "Pristine Bill Requirements",
                        Severity = "TIP",
                        ActionPrompt = "INSPECT BILLS BEFORE FLYING OUT",
                        Explanation = "Thai currency exchangers will reject foreign bills with ink stamps, small pen marks, tears or folded corners. Bring crisp, flat, unblemished high-denomination bills to receive top-tier counter rates.",
                        AtmWithdrawalFeeNotice = "Damaged notes can only be exchanged at major commercial bank headquarters at a steep 10%-15% discount."
                    }
                },
                VerifiedKiosks = new List<ForexKioskItem>
                {
                    new ForexKioskItem
                    {
                        KioskId = "sr-bkk-b",
                        BrandName = "SuperRich Thailand (Orange)",
                        BranchName = "Suvarnabhumi Airport (Airport Rail Link Level B)",
                        City = "Bangkok",
                        Address = "Level B, Airport Rail Link Station, Suvarnabhumi Airport, Samut Prakan",
                        OperatingHours = "05:30 - 23:30 Daily",
                        IsAirportBasementKiosk = true,
                        GoogleMapsQuery = "SuperRich Suvarnabhumi Airport Basement",
                        Rating = 4.8,
                        HighlightBadge = "BEST AIRPORT RATE"
                    },
                    new ForexKioskItem
                    {
                        KioskId = "sr-green-hq",
                        BrandName = "SuperRich 1965 (Green Flagship)",
                        BranchName = "Rajdamri Head Office (Opposite CentralWorld)",
                        City = "Bangkok",
                        Address = "47/11-13 Ratchadamri Rd, Lumphini, Pathum Wan, Bangkok",
                        OperatingHours = "09:00 - 18:00 (Mon-Sat), 09:30 - 17:00 (Sun)",
                        IsAirportBasementKiosk = false,
                        GoogleMapsQuery = "SuperRich 1965 Head Office Rajdamri",
                        Rating = 4.9,
                        HighlightBadge = "FLAGSHIP SPREAD"
                    },
                    new ForexKioskItem
                    {
                        KioskId = "vasu-nana",
                        BrandName = "Vasu Exchange",
                        BranchName = "Sukhumvit Soi 7/1 (BTS Nana)",
                        City = "Bangkok",
                        Address = "Sukhumvit Soi 7/1, Khlong Toei Nuea, Watthana, Bangkok (Under BTS Nana Exit 1)",
                        OperatingHours = "09:00 - 18:00 (Mon-Fri), 09:00 - 17:00 (Sat)",
                        IsAirportBasementKiosk = false,
                        GoogleMapsQuery = "Vasu Exchange Sukhumvit",
                        Rating = 4.7,
                        HighlightBadge = "INR & USD SPECIALIST"
                    },
                    new ForexKioskItem
                    {
                        KioskId = "siam-exchange",
                        BrandName = "Siam Exchange",
                        BranchName = "Pathum Wan (Next to MBK / BTS National Stadium)",
                        City = "Bangkok",
                        Address = "422/1-3 Phaya Thai Rd, Wang Mai, Pathum Wan, Bangkok",
                        OperatingHours = "09:30 - 18:30 (Mon-Sat)",
                        IsAirportBasementKiosk = false,
                        GoogleMapsQuery = "Siam Exchange Bangkok",
                        Rating = 4.7,
                        HighlightBadge = "TOP DOWNTOWN RATE"
                    },
                    new ForexKioskItem
                    {
                        KioskId = "sr-phuket-patong",
                        BrandName = "SuperRich Phuket",
                        BranchName = "Patong Beach / Rat-U-Thit Rd",
                        City = "Phuket",
                        Address = "Rat-U-Thit 200 Pee Rd, Pa Tong, Kathu District, Phuket",
                        OperatingHours = "10:00 - 21:00 Daily",
                        IsAirportBasementKiosk = false,
                        GoogleMapsQuery = "SuperRich Patong Phuket",
                        Rating = 4.6,
                        HighlightBadge = "BEACH HUB BEST RATE"
                    }
                }
            };
        }

        private static ForexRadarDataDto GetUaeForexRadar()
        {
            return new ForexRadarDataDto
            {
                DestinationCountry = "United Arab Emirates",
                DestinationCurrencyCode = "AED",
                DestinationCurrencySymbol = "AED",
                LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm UTC"),
                PassportRuleNotice = "Original passport or Emirates ID required for foreign exchange in UAE by Central Bank regulations.",
                BaseRates = new List<ForexCounterRate>
                {
                    new ForexCounterRate
                    {
                        CurrencyCode = "USD",
                        CurrencyName = "US Dollar (Pegged)",
                        FlagEmoji = "🇺🇸",
                        BankAirportBuyRate = 3.55m,
                        CityCounterBuyRate = 3.665m,
                        CityCounterSellRate = 3.675m,
                        SpreadPercent = "0.27% (Pegged: 3.6725)",
                        AirportLossPercent = "3.2% worse at DXB airport banks",
                        NoteConditionTips = "All USD denominations accepted with official Central Bank peg rates at city counters."
                    },
                    new ForexCounterRate
                    {
                        CurrencyCode = "EUR",
                        CurrencyName = "Euro",
                        FlagEmoji = "🇪🇺",
                        BankAirportBuyRate = 3.75m,
                        CityCounterBuyRate = 3.96m,
                        CityCounterSellRate = 4.02m,
                        SpreadPercent = "1.5%",
                        AirportLossPercent = "5.3% worse at DXB airport banks",
                        NoteConditionTips = "Clean euro notes accepted at Al Ansari, LuLu and Al Fardan counters across malls."
                    },
                    new ForexCounterRate
                    {
                        CurrencyCode = "GBP",
                        CurrencyName = "British Pound",
                        FlagEmoji = "🇬🇧",
                        BankAirportBuyRate = 4.38m,
                        CityCounterBuyRate = 4.65m,
                        CityCounterSellRate = 4.72m,
                        SpreadPercent = "1.5%",
                        AirportLossPercent = "5.8% worse at DXB airport banks",
                        NoteConditionTips = "Polymer Bank of England notes only."
                    },
                    new ForexCounterRate
                    {
                        CurrencyCode = "INR",
                        CurrencyName = "Indian Rupee",
                        FlagEmoji = "🇮🇳",
                        BankAirportBuyRate = 0.038m,
                        CityCounterBuyRate = 0.043m,
                        CityCounterSellRate = 0.044m,
                        SpreadPercent = "2.3%",
                        AirportLossPercent = "11.6% worse at DXB airport banks",
                        NoteConditionTips = "500 INR notes accepted widely in Deira and Bur Dubai exchange houses."
                    }
                },
                AtmDccShield = new List<AtmDccTip>
                {
                    new AtmDccTip
                    {
                        TipKey = "uae-atm-dcc",
                        Title = "DCC Prompt on UAE Bank ATMs",
                        Severity = "CRITICAL",
                        ActionPrompt = "CHOOSE 'CHARGE IN AED (LOCAL CURRENCY)'",
                        Explanation = "Emirates NBD, Mashreq, and ADCB ATMs will ask whether you want your card charged in your home currency. Choosing home currency triggers a 6%-9% mark-up. Always select AED to let your home bank convert at mid-market rates.",
                        AtmWithdrawalFeeNotice = "UAE local ATM operator fee typically ranges from 15 to 25 AED for foreign cards."
                    },
                    new AtmDccTip
                    {
                        TipKey = "mall-exchange-houses",
                        Title = "Al Ansari vs Airport Kiosks",
                        Severity = "RECOMMENDED",
                        ActionPrompt = "EXCHANGE AT DUBAI MALL OR DEIRA",
                        Explanation = "DXB airport Travelex kiosks charge wider spreads. Mall branches of Al Ansari Exchange and LuLu Exchange offer transparent rates with minimal processing fees.",
                        AtmWithdrawalFeeNotice = "Standard 3 to 5 AED transaction receipt fee at exchange houses."
                    }
                },
                VerifiedKiosks = new List<ForexKioskItem>
                {
                    new ForexKioskItem
                    {
                        KioskId = "al-ansari-dubai-mall",
                        BrandName = "Al Ansari Exchange",
                        BranchName = "The Dubai Mall (Lower Ground Level)",
                        City = "Dubai",
                        Address = "Lower Ground Level, Near Waitrose, The Dubai Mall, Downtown Dubai",
                        OperatingHours = "10:00 - 00:00 Daily",
                        IsAirportBasementKiosk = false,
                        GoogleMapsQuery = "Al Ansari Exchange The Dubai Mall",
                        Rating = 4.8,
                        HighlightBadge = "PRIME DOWNTOWN"
                    },
                    new ForexKioskItem
                    {
                        KioskId = "lulu-exchange-moe",
                        BrandName = "LuLu Exchange",
                        BranchName = "Mall of the Emirates (Ground Floor)",
                        City = "Dubai",
                        Address = "Ground Floor, Mall of the Emirates, Al Barsha 1, Dubai",
                        OperatingHours = "10:00 - 23:00 Daily",
                        IsAirportBasementKiosk = false,
                        GoogleMapsQuery = "LuLu Exchange Mall of the Emirates",
                        Rating = 4.7,
                        HighlightBadge = "TOP METRO ACCESS"
                    }
                }
            };
        }

        private static ForexRadarDataDto GetIndiaForexRadar()
        {
            return new ForexRadarDataDto
            {
                DestinationCountry = "India",
                DestinationCurrencyCode = "INR",
                DestinationCurrencySymbol = "₹",
                LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm UTC"),
                PassportRuleNotice = "Government ID / Passport and flight ticket are required for foreign exchange transactions in India.",
                BaseRates = new List<ForexCounterRate>
                {
                    new ForexCounterRate
                    {
                        CurrencyCode = "USD",
                        CurrencyName = "US Dollar",
                        FlagEmoji = "🇺🇸",
                        BankAirportBuyRate = 81.20m,
                        CityCounterBuyRate = 85.80m,
                        CityCounterSellRate = 86.40m,
                        SpreadPercent = "0.7%",
                        AirportLossPercent = "5.3% worse at airport",
                        NoteConditionTips = "Series 2013+ bills in clean condition required."
                    },
                    new ForexCounterRate
                    {
                        CurrencyCode = "EUR",
                        CurrencyName = "Euro",
                        FlagEmoji = "🇪🇺",
                        BankAirportBuyRate = 88.50m,
                        CityCounterBuyRate = 92.40m,
                        CityCounterSellRate = 93.20m,
                        SpreadPercent = "0.86%",
                        AirportLossPercent = "4.2% worse at airport",
                        NoteConditionTips = "Standard 50/100 euro bills."
                    }
                },
                AtmDccShield = new List<AtmDccTip>
                {
                    new AtmDccTip
                    {
                        TipKey = "in-atm-dcc",
                        Title = "Indian ATM Conversion Prompts",
                        Severity = "CRITICAL",
                        ActionPrompt = "DECLINE CONVERSION / CHARGE IN INR",
                        Explanation = "State Bank of India (SBI) and private ATMs prompt for foreign card conversion. Always decline conversion to avoid 7% forex markups.",
                        AtmWithdrawalFeeNotice = "Local ATM fee usually 150 to 250 INR."
                    }
                },
                VerifiedKiosks = new List<ForexKioskItem>
                {
                    new ForexKioskItem
                    {
                        KioskId = "thomas-cook-in",
                        BrandName = "Thomas Cook Forex",
                        BranchName = "Ahmedabad / Mumbai Flagship",
                        City = "Ahmedabad",
                        Address = "C.G. Road, Navrangpura, Ahmedabad, Gujarat",
                        OperatingHours = "09:30 - 18:30 (Mon-Sat)",
                        IsAirportBasementKiosk = false,
                        GoogleMapsQuery = "Thomas Cook Forex CG Road Ahmedabad",
                        Rating = 4.8,
                        HighlightBadge = "RBI LICENSED"
                    }
                }
            };
        }
    }
}
