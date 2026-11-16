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
    [Route("api/tipping")]
    public class TippingController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<TippingController> _logger;

        public TippingController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<TippingController> logger)
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

        [HttpGet("guide")]
        public IActionResult GetTippingGuide([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var guide = GetSeedTippingGuide(resolvedSite);
            return Ok(new { success = true, data = guide });
        }

        [HttpPost("calculate")]
        public IActionResult CalculateTip([FromBody] CalculateTipRequestDto request, [FromQuery] string? siteId = null)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid calculate request" });
            }

            var resolvedSite = ResolveSiteId(siteId);
            var guide = GetSeedTippingGuide(resolvedSite);
            var bill = Math.Max(0m, request.BillAmount);
            var splitCount = Math.Max(1, request.SplitCount);

            decimal tip = 0m;
            string serviceChargeNote;
            string advice;

            if (request.CustomTipAmount.HasValue && request.CustomTipAmount.Value > 0)
            {
                tip = Math.Round(request.CustomTipAmount.Value, 2);
                serviceChargeNote = "Custom gratuity entered directly.";
                advice = "Hand tip directly in cash to ensure it goes directly to the staff member.";
            }
            else
            {
                var percentage = request.TipPercentage ?? 10m;

                if (request.ServiceChargeAlreadyIncluded)
                {
                    // If service charge (usually 10%) is already on the bill, customary tip is lower (e.g. 0-5% or small round up)
                    tip = Math.Round(bill * (Math.Max(0m, percentage - 10m) / 100m), 2);
                    if (tip == 0m && bill > 0)
                    {
                        // Standard round up advice
                        tip = (bill <= 500) ? 20m : 50m;
                    }
                    serviceChargeNote = "10% Service Charge is already included in your bill. A small cash token is optional for exceptional service.";
                    advice = "Leaving small coin change or 20-50 THB in cash directly on the bill tray is appreciated.";
                }
                else
                {
                    tip = Math.Round(bill * (percentage / 100m), 2);
                    serviceChargeNote = "No service charge included. Customary tip applied.";
                    advice = $"A {percentage}% gratuity reflects standard polite etiquette in {guide.Country}.";
                }
            }

            var total = bill + tip;
            var perPersonTotal = Math.Round(total / splitCount, 2);
            var perPersonTip = Math.Round(tip / splitCount, 2);

            var result = new CalculateTipResultDto
            {
                BillAmount = bill,
                TipAmount = tip,
                TotalAmount = total,
                SplitCount = splitCount,
                PerPersonTotal = perPersonTotal,
                PerPersonTip = perPersonTip,
                ServiceChargeNote = serviceChargeNote,
                EtiquetteAdvice = advice,
                CurrencyCode = guide.CurrencyCode,
                CurrencySymbol = guide.CurrencySymbol,
            };

            return Ok(new { success = true, data = result });
        }

        private static TippingCountryGuideDto GetSeedTippingGuide(string siteId)
        {
            if (siteId == "technoheaven")
            {
                var uaeCategories = new List<TippingServiceCategoryDto>
                {
                    new TippingServiceCategoryDto
                    {
                        CategoryKey = "Dining",
                        CategoryName = "Restaurants & Lounges",
                        Icon = "restaurant-outline",
                        RecommendedTip = "10% - 15% of bill",
                        CustomaryRule = "Most upscale Dubai restaurants include 10% service charge + 5% VAT. If service was memorable, an extra 5-10% cash tip is standard.",
                        DefaultPercentage = 10m,
                        TypicalFixedAmount = 25m,
                        ServiceChargeExplanation = "Check if 'Service Charge' is listed on your bill before adding tip."
                    },
                    new TippingServiceCategoryDto
                    {
                        CategoryKey = "Private_Driver",
                        CategoryName = "Desert Safari Driver / Chauffeur",
                        Icon = "car-outline",
                        RecommendedTip = "AED 50 - 100 per group",
                        CustomaryRule = "Desert dune bashing drivers work in extreme conditions. Hand cash at drop-off.",
                        DefaultPercentage = 10m,
                        TypicalFixedAmount = 50m,
                        ServiceChargeExplanation = "Never included in tour booking packages."
                    },
                    new TippingServiceCategoryDto
                    {
                        CategoryKey = "Tour_Guide",
                        CategoryName = "Licensed City Tour Guide",
                        Icon = "person-outline",
                        RecommendedTip = "AED 50 - 100 for half-day / AED 150 for full-day",
                        CustomaryRule = "Appreciated at the conclusion of cultural walking tours.",
                        DefaultPercentage = 10m,
                        TypicalFixedAmount = 100m,
                        ServiceChargeExplanation = "Not included in basic tour price."
                    },
                    new TippingServiceCategoryDto
                    {
                        CategoryKey = "Hotel_Porter",
                        CategoryName = "Hotel Bellhop / Valet",
                        Icon = "briefcase-outline",
                        RecommendedTip = "AED 10 - 20",
                        CustomaryRule = "AED 10 for standard luggage assistance or valet car return.",
                        DefaultPercentage = 0m,
                        TypicalFixedAmount = 10m,
                        ServiceChargeExplanation = "Always given in direct cash notes."
                    },
                    new TippingServiceCategoryDto
                    {
                        CategoryKey = "Taxi",
                        CategoryName = "RTA Meter Taxi / Careem",
                        Icon = "speedometer-outline",
                        RecommendedTip = "Round up to nearest 5 or 10 AED",
                        CustomaryRule = "Tell driver 'keep the change' or add AED 5 on card terminal.",
                        DefaultPercentage = 5m,
                        TypicalFixedAmount = 5m,
                        ServiceChargeExplanation = "Taxis do not have service charges."
                    }
                };

                return new TippingCountryGuideDto
                {
                    SiteId = "technoheaven",
                    Country = "United Arab Emirates",
                    CurrencyCode = "AED",
                    CurrencySymbol = "AED ",
                    GeneralTippingCulture = "Tipping in Dubai is common and expected in hospitality, though not legally mandatory. Service staff from all around the world appreciate direct cash tips.",
                    TaxAndServiceChargeNote = "5% VAT is standard across UAE. High-end restaurants and hotel cafes often add a 10% municipality / service charge.",
                    Categories = uaeCategories,
                    LocalThankYouPhrase = "شكراً جزيلاً لخدمتك الممتازة",
                    LocalThankYouPhonetic = "Shukran jazeelan li-khidmatika al-mumtazah"
                };
            }

            // Default: GujjuTours & TripGoAsia (Thailand)
            var thaiCategories = new List<TippingServiceCategoryDto>
            {
                new TippingServiceCategoryDto
                {
                    CategoryKey = "Spa_Massage",
                    CategoryName = "Traditional Thai Massage & Spa",
                    Icon = "sparkles-outline",
                    RecommendedTip = "50 - 100 THB / hr (100 - 200 THB for 2hr luxury spa)",
                    CustomaryRule = "VERY IMPORTANT! Masseuses earn a low base wage. Always hand cash directly to your therapist after the session in the private room or reception.",
                    DefaultPercentage = 15m,
                    TypicalFixedAmount = 100m,
                    ServiceChargeExplanation = "Spa reception rarely distributes card tips to individual masseuses."
                },
                new TippingServiceCategoryDto
                {
                    CategoryKey = "Dining",
                    CategoryName = "Sit-Down Restaurants & Cafes",
                    Icon = "restaurant-outline",
                    RecommendedTip = "20 - 50 THB cash or 5% - 10%",
                    CustomaryRule = "Street food stalls expect NO tip. At casual sit-down places, leave coin change or 20-50 THB note. At upscale restaurants, check if 10% '++' is already included.",
                    DefaultPercentage = 10m,
                    TypicalFixedAmount = 50m,
                    ServiceChargeExplanation = "Menus showing '++' add 10% Service Charge and 7% VAT."
                },
                new TippingServiceCategoryDto
                {
                    CategoryKey = "Tour_Guide",
                    CategoryName = "Private Tour Specialist & Island Guide",
                    Icon = "compass-outline",
                    RecommendedTip = "300 - 500 THB per day (Group total)",
                    CustomaryRule = "Given at the end of island speedboats or cultural city tours. For group tours, 50-100 THB per traveler is customary.",
                    DefaultPercentage = 10m,
                    TypicalFixedAmount = 300m,
                    ServiceChargeExplanation = "Excursion tour prices do not include guide gratuity."
                },
                new TippingServiceCategoryDto
                {
                    CategoryKey = "Private_Driver",
                    CategoryName = "Private Van Chauffeur",
                    Icon = "car-outline",
                    RecommendedTip = "200 - 300 THB per day (Group total)",
                    CustomaryRule = "Bangkok traffic is challenging; courteous drivers navigating heavy traffic appreciate 200-300 THB at final drop-off.",
                    DefaultPercentage = 10m,
                    TypicalFixedAmount = 200m,
                    ServiceChargeExplanation = "Independent of tour booking fees."
                },
                new TippingServiceCategoryDto
                {
                    CategoryKey = "Hotel_Porter",
                    CategoryName = "Hotel Bellboy & Luggage Porter",
                    Icon = "briefcase-outline",
                    RecommendedTip = "20 - 50 THB per bag",
                    CustomaryRule = "Hand a 20 or 50 THB banknote when bags are delivered to your room.",
                    DefaultPercentage = 0m,
                    TypicalFixedAmount = 40m,
                    ServiceChargeExplanation = "Even in 5-star hotels with service charge, cash to the porter is polite."
                },
                new TippingServiceCategoryDto
                {
                    CategoryKey = "Taxi",
                    CategoryName = "Meter Taxi & Tuk-Tuk",
                    Icon = "speedometer-outline",
                    RecommendedTip = "Round up to nearest 10 or 20 THB",
                    CustomaryRule = "If fare is 72 THB, give 80 or 100 THB and let driver keep the change. Tuk-Tuks are negotiated flat-rate with no tip expected.",
                    DefaultPercentage = 5m,
                    TypicalFixedAmount = 15m,
                    ServiceChargeExplanation = "Taxi meters do not include gratuity."
                }
            };

            return new TippingCountryGuideDto
            {
                SiteId = siteId,
                Country = "Thailand",
                CurrencyCode = "THB",
                CurrencySymbol = "฿",
                GeneralTippingCulture = "Tipping is not traditional in Thailand, but has become standard in tourist areas. It is deeply appreciated and directly benefits hardworking service workers.",
                TaxAndServiceChargeNote = "Watch for '++' on restaurant bills: The first '+' is 10% Service Charge, the second is 7% Government VAT. If 10% is already included, an extra large tip is unnecessary.",
                Categories = thaiCategories,
                LocalThankYouPhrase = "ขอบคุณมากครับ/ค่ะ สำหรับการบริการที่ดีเยี่ยม",
                LocalThankYouPhonetic = "Khob khun maak khrap/kha sam-rap gaan-bori-gaan thee dee yiam"
            };
        }
    }
}
