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
    [Route("api/baggage")]
    public class BaggageController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<BaggageController> _logger;

        public BaggageController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<BaggageController> logger)
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
        public IActionResult GetBaggageHubData([FromQuery] string? siteId = null, [FromQuery] string? airlineCode = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedBaggageHub(resolvedSite);

            if (!string.IsNullOrWhiteSpace(airlineCode))
            {
                var matched = hub.SupportedAirlines.FirstOrDefault(a => a.AirlineCode.Equals(airlineCode.Trim(), StringComparison.OrdinalIgnoreCase));
                if (matched != null)
                {
                    hub.DefaultAirline = matched;
                }
            }

            return Ok(new { success = true, data = hub });
        }

        [HttpPost("calculate-excess")]
        public IActionResult CalculateExcessBaggage([FromBody] CalculateBaggageFeeRequestDto request, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedBaggageHub(resolvedSite);

            var code = (request.AirlineCode ?? "6E").Trim();
            var airline = hub.SupportedAirlines.FirstOrDefault(a => a.AirlineCode.Equals(code, StringComparison.OrdinalIgnoreCase)) ?? hub.DefaultAirline;

            // Allowances adjustment based on fare class
            double checkedAllowance = airline.CheckedAllowanceKg;
            if (request.FareClass == "Economy_Light")
            {
                checkedAllowance = 0.0; // Hand luggage only
            }
            else if (request.FareClass == "Flexi_Business")
            {
                checkedAllowance += 10.0; // Bonus 10kg for flexi/business
            }

            double cabinAllowance = airline.CabinAllowanceKg;

            double cabinExcess = Math.Max(0.0, Math.Round(request.CabinWeightKg - cabinAllowance, 1));
            double checkedExcess = Math.Max(0.0, Math.Round(request.CheckedWeightKg - checkedAllowance, 1));

            bool isCabinOver = cabinExcess > 0;
            bool isCheckedOver = checkedExcess > 0;

            // Fee Estimation (Using Indian Rupee or THB or USD based on tenant)
            double feePerKgAirport = resolvedSite == "technoheaven" ? 35.0 : (resolvedSite == "tripgoasia" ? 15.0 : 600.0);
            double feePerKgPrepaid = resolvedSite == "technoheaven" ? 20.0 : (resolvedSite == "tripgoasia" ? 8.0 : 400.0);
            string currencyPrefix = resolvedSite == "technoheaven" ? "$" : (resolvedSite == "tripgoasia" ? "£" : "₹");

            double totalAirportFee = Math.Round(checkedExcess * feePerKgAirport, 0);
            double totalPrepaidFee = Math.Round(checkedExcess * feePerKgPrepaid, 0);
            double potentialSavings = Math.Max(0.0, totalAirportFee - totalPrepaidFee);

            string verdictStatus;
            string headline;
            string recommendation;

            if (isCheckedOver && isCabinOver)
            {
                verdictStatus = "Checked_Overweight_Penalty";
                headline = $"Overweight: {checkedExcess}kg Checked + {cabinExcess}kg Cabin Over";
                recommendation = $"Both bags exceed airline weight limits. Gate security may force you to check your carry-on bag for a heavy last-minute gate fee ({currencyPrefix}{totalAirportFee}). Pre-purchase {Math.Ceiling(checkedExcess)}kg extra luggage online now to save {currencyPrefix}{potentialSavings}.";
            }
            else if (isCheckedOver)
            {
                verdictStatus = "Checked_Overweight_Penalty";
                headline = $"Checked Baggage is {checkedExcess}kg Over Limit";
                recommendation = $"Your suitcase is {request.CheckedWeightKg}kg against the {checkedAllowance}kg allowance. You will be billed approx {currencyPrefix}{totalAirportFee} at the airport check-in counter. Tip: Transfer heavy clothes or shoes into your {cabinAllowance}kg carry-on bag to eliminate this fee.";
            }
            else if (isCabinOver)
            {
                verdictStatus = "Cabin_Heavy_Warning";
                headline = $"Cabin Carry-On is {cabinExcess}kg Over Limit";
                recommendation = $"Airlines strictly enforce the {cabinAllowance}kg carry-on weight scale at the boarding gate. Wear your heaviest jacket or shift items to your checked bag ({checkedAllowance - request.CheckedWeightKg}kg remaining headroom).";
            }
            else
            {
                verdictStatus = "Under_Limit_Safe";
                headline = "Baggage Within Allowances (Zero Extra Fees)";
                double remaining = Math.Round(checkedAllowance - request.CheckedWeightKg, 1);
                recommendation = $"You have {remaining}kg of free headroom in your checked suitcase and {Math.Round(cabinAllowance - request.CabinWeightKg, 1)}kg in your carry-on. You are ready for smooth airport check-in!";
            }

            var result = new CalculateBaggageFeeResultDto
            {
                IsCabinOverweight = isCabinOver,
                CabinExcessKg = cabinExcess,
                IsCheckedOverweight = isCheckedOver,
                CheckedExcessKg = checkedExcess,
                AirportCounterFeeEst = $"{currencyPrefix}{totalAirportFee}",
                PrepaidFeeEst = $"{currencyPrefix}{totalPrepaidFee}",
                PotentialSavings = $"{currencyPrefix}{potentialSavings}",
                VerdictStatus = verdictStatus,
                Headline = headline,
                Recommendation = recommendation
            };

            return Ok(new { success = true, data = result });
        }

        private static BaggageHubDataDto GetSeedBaggageHub(string siteId)
        {
            var prohibitedCabin = new List<string>
            {
                "Liquids, aerosols & gels exceeding 100ml per container (must fit inside 1 clear transparent 1-liter bag).",
                "Sharp scissors, pocket knives, or blades longer than 6cm.",
                "Fresh durian and whole coconuts (prohibited on most Asian airlines due to odor & liquid scan opacity).",
                "Toy guns, replica weapons, or martial arts items."
            };

            var prohibitedChecked = new List<string>
            {
                "Lithium power banks & external battery packs (MUST be packed in carry-on bag only; max 32,000 mAh).",
                "E-cigarettes, vape devices, and spare rechargeable vape batteries.",
                "Safety matches and small cigarette lighters (carry 1 on person only).",
                "High-value jewelry, passports, cash, and essential daily prescription medication."
            };

            var packingTips = new List<string>
            {
                "Wear your heaviest jacket, hoodie, and bulky sneakers during flight check-in to save 2-3kg of suitcase weight.",
                "Place duty-free liquids bought after airport security in a sealed tamper-evident bag (STEB) with receipt visible.",
                "Weigh your bags at your hotel room with a portable luggage scale before calling your airport taxi transfer.",
                "Pre-purchasing extra luggage allowance online at least 24 hours before flight departure saves up to 50% vs airport counter rates."
            };

            if (siteId == "technoheaven")
            {
                var airlines = new List<AirlineBaggagePolicyDto>
                {
                    new AirlineBaggagePolicyDto
                    {
                        AirlineCode = "EK",
                        AirlineName = "Emirates",
                        CabinAllowanceKg = 7.0,
                        CabinPieceCount = 1,
                        CabinDimensions = "55 x 38 x 20 cm (Max 115 cm)",
                        CheckedAllowanceKg = 25.0,
                        CheckedPieceLimit = "1 or 2 Pieces (Max 300 cm total)",
                        AirportExcessFeePerKg = "$35 USD per kg",
                        PrepaidExcessFeePerKg = "$20 USD per kg",
                        SpecialRules = new List<string> { "Economy Flex fares receive 30kg allowance.", "Free handbag or briefcase allowed in cabin." }
                    },
                    new AirlineBaggagePolicyDto
                    {
                        AirlineCode = "FZ",
                        AirlineName = "Flydubai",
                        CabinAllowanceKg = 7.0,
                        CabinPieceCount = 1,
                        CabinDimensions = "55 x 38 x 20 cm",
                        CheckedAllowanceKg = 20.0,
                        CheckedPieceLimit = "Up to 3 Pieces",
                        AirportExcessFeePerKg = "$25 USD per kg",
                        PrepaidExcessFeePerKg = "$15 USD per kg",
                        SpecialRules = new List<string> { "Lite fares do not include checked luggage." }
                    },
                    new AirlineBaggagePolicyDto
                    {
                        AirlineCode = "QR",
                        AirlineName = "Qatar Airways",
                        CabinAllowanceKg = 7.0,
                        CabinPieceCount = 1,
                        CabinDimensions = "50 x 37 x 25 cm",
                        CheckedAllowanceKg = 25.0,
                        CheckedPieceLimit = "Weight concept (Up to 300 cm)",
                        AirportExcessFeePerKg = "$30 USD per kg",
                        PrepaidExcessFeePerKg = "$18 USD per kg",
                        SpecialRules = new List<string> { "Students receive 10kg additional baggage allowance with valid ID." }
                    }
                };

                return new BaggageHubDataDto
                {
                    SiteId = "technoheaven",
                    DefaultAirline = airlines[0],
                    SupportedAirlines = airlines,
                    ProhibitedCabinItems = prohibitedCabin,
                    ProhibitedCheckedItems = prohibitedChecked,
                    PackingTips = packingTips
                };
            }

            if (siteId == "tripgoasia")
            {
                var airlines = new List<AirlineBaggagePolicyDto>
                {
                    new AirlineBaggagePolicyDto
                    {
                        AirlineCode = "TG",
                        AirlineName = "Thai Airways",
                        CabinAllowanceKg = 7.0,
                        CabinPieceCount = 1,
                        CabinDimensions = "56 x 45 x 25 cm (Max 115 cm)",
                        CheckedAllowanceKg = 20.0,
                        CheckedPieceLimit = "Weight concept (Max 158 cm per bag)",
                        AirportExcessFeePerKg = "£15 GBP / 650 THB per kg",
                        PrepaidExcessFeePerKg = "£8 GBP / 350 THB per kg",
                        SpecialRules = new List<string> { "Plus 1 personal item (purse/laptop) max 1.5kg allowed in cabin.", "Royal Silk Business receives 40kg." }
                    },
                    new AirlineBaggagePolicyDto
                    {
                        AirlineCode = "BA",
                        AirlineName = "British Airways",
                        CabinAllowanceKg = 23.0,
                        CabinPieceCount = 2,
                        CabinDimensions = "56 x 45 x 25 cm + Handbag 40 x 30 x 15 cm",
                        CheckedAllowanceKg = 23.0,
                        CheckedPieceLimit = "1 Piece (Max 90 x 75 x 43 cm)",
                        AirportExcessFeePerKg = "£65 GBP flat per extra bag",
                        PrepaidExcessFeePerKg = "£45 GBP flat per extra bag",
                        SpecialRules = new List<string> { "Generous 23kg cabin baggage limit applies." }
                    },
                    new AirlineBaggagePolicyDto
                    {
                        AirlineCode = "SQ",
                        AirlineName = "Singapore Airlines",
                        CabinAllowanceKg = 7.0,
                        CabinPieceCount = 1,
                        CabinDimensions = "55 x 40 x 20 cm",
                        CheckedAllowanceKg = 25.0,
                        CheckedPieceLimit = "Weight concept (Max 32kg per piece)",
                        AirportExcessFeePerKg = "$20 USD per kg",
                        PrepaidExcessFeePerKg = "$12 USD per kg",
                        SpecialRules = new List<string> { "KrisFlyer members enjoy 5kg bonus allowance." }
                    }
                };

                return new BaggageHubDataDto
                {
                    SiteId = "tripgoasia",
                    DefaultAirline = airlines[0],
                    SupportedAirlines = airlines,
                    ProhibitedCabinItems = prohibitedCabin,
                    ProhibitedCheckedItems = prohibitedChecked,
                    PackingTips = packingTips
                };
            }

            // Default: GujjuTours
            var gujjuAirlines = new List<AirlineBaggagePolicyDto>
            {
                new AirlineBaggagePolicyDto
                {
                    AirlineCode = "6E",
                    AirlineName = "IndiGo Airlines",
                    CabinAllowanceKg = 7.0,
                    CabinPieceCount = 1,
                    CabinDimensions = "55 x 35 x 25 cm (Max 115 cm)",
                    CheckedAllowanceKg = 20.0,
                    CheckedPieceLimit = "1 Piece (International flights to Bangkok/Phuket)",
                    AirportExcessFeePerKg = "₹600 INR / ~300 THB per kg",
                    PrepaidExcessFeePerKg = "₹400 INR / ~200 THB per kg",
                    SpecialRules = new List<string>
                    {
                        "Free 1 additional small personal handbag or laptop bag (up to 3kg) allowed in cabin.",
                        "Direct international flights (India-Thailand) include 20kg checked baggage."
                    }
                },
                new AirlineBaggagePolicyDto
                {
                    AirlineCode = "AI",
                    AirlineName = "Air India",
                    CabinAllowanceKg = 7.0,
                    CabinPieceCount = 1,
                    CabinDimensions = "55 x 35 x 25 cm",
                    CheckedAllowanceKg = 25.0,
                    CheckedPieceLimit = "1 or 2 Pieces (Max 158 cm total)",
                    AirportExcessFeePerKg = "₹800 INR per kg",
                    PrepaidExcessFeePerKg = "₹500 INR per kg",
                    SpecialRules = new List<string> { "Standard economy tickets include 25kg free checked baggage." }
                },
                new AirlineBaggagePolicyDto
                {
                    AirlineCode = "TG",
                    AirlineName = "Thai Airways",
                    CabinAllowanceKg = 7.0,
                    CabinPieceCount = 1,
                    CabinDimensions = "56 x 45 x 25 cm",
                    CheckedAllowanceKg = 20.0,
                    CheckedPieceLimit = "Weight concept",
                    AirportExcessFeePerKg = "₹1,200 INR / ~500 THB per kg",
                    PrepaidExcessFeePerKg = "₹650 INR / ~280 THB per kg",
                    SpecialRules = new List<string> { "Generous hospitality with free hot meals and 20-30kg checked bags." }
                },
                new AirlineBaggagePolicyDto
                {
                    AirlineCode = "SG",
                    AirlineName = "SpiceJet",
                    CabinAllowanceKg = 7.0,
                    CabinPieceCount = 1,
                    CabinDimensions = "55 x 35 x 25 cm",
                    CheckedAllowanceKg = 20.0,
                    CheckedPieceLimit = "1 Piece",
                    AirportExcessFeePerKg = "₹600 INR per kg",
                    PrepaidExcessFeePerKg = "₹400 INR per kg",
                    SpecialRules = new List<string> { "Pre-booking baggage slots available up to 2 hours before departure." }
                }
            };

            return new BaggageHubDataDto
            {
                SiteId = "gujjutours",
                DefaultAirline = gujjuAirlines[0],
                SupportedAirlines = gujjuAirlines,
                ProhibitedCabinItems = prohibitedCabin,
                ProhibitedCheckedItems = prohibitedChecked,
                PackingTips = packingTips
            };
        }
    }
}
