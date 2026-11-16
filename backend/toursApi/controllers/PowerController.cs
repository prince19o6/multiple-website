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
    [Route("api/power")]
    public class PowerController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<PowerController> _logger;

        public PowerController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<PowerController> logger)
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
        public IActionResult GetPowerHubData([FromQuery] string? siteId = null, [FromQuery] string? destination = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedPowerHub(resolvedSite);

            if (!string.IsNullOrWhiteSpace(destination))
            {
                hub.DestinationCountry = destination.Trim();
            }

            return Ok(new { success = true, data = hub });
        }

        [HttpPost("check-appliance")]
        public IActionResult CheckApplianceSafety([FromBody] CheckApplianceRequestDto request, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var ratedVoltage = (request.RatedVoltage ?? "100-240V").Trim();
            var category = (request.ApplianceCategory ?? "Smartphones & Laptops").Trim();
            var homePlug = (request.HomePlugType ?? "Type_D_India").Trim();

            bool isDualVoltage = ratedVoltage.Contains("100-240V", StringComparison.OrdinalIgnoreCase) ||
                                 ratedVoltage.Contains("110-240V", StringComparison.OrdinalIgnoreCase);

            bool isLowVoltageOnly = ratedVoltage.Contains("110-120V", StringComparison.OrdinalIgnoreCase) ||
                                    ratedVoltage.Contains("110V", StringComparison.OrdinalIgnoreCase) ||
                                    ratedVoltage.Contains("120V", StringComparison.OrdinalIgnoreCase);

            bool needsTransformer = isLowVoltageOnly;

            // Plug adapter necessity based on home plug type and destination (Thailand)
            bool needsPlugAdapter = false;
            if (homePlug.Contains("Type_G", StringComparison.OrdinalIgnoreCase))
            {
                // UK / UAE 3-pin rectangular plugs always need adapter in Thailand
                needsPlugAdapter = true;
            }
            else if (homePlug.Contains("Type_D", StringComparison.OrdinalIgnoreCase))
            {
                // Indian 3-pin large grounded plugs need adapter, though 2-pin round fits
                needsPlugAdapter = category.Contains("Heavy", StringComparison.OrdinalIgnoreCase) || category.Contains("CPAP", StringComparison.OrdinalIgnoreCase);
            }

            string verdictStatus;
            string headline;
            string detailedAdvice;
            bool isSafe;

            if (needsTransformer)
            {
                isSafe = false;
                verdictStatus = "Danger_Burn_Risk";
                headline = "DANGER: High Risk of Burning Appliance";
                detailedAdvice = $"Your {category} is rated strictly for 110V-120V. Thailand power outlets supply 220V-230V. Plugging this in directly will burn the internal motor or heating element and trip hotel fuses. You MUST use a step-down 220V-to-110V voltage transformer (at least 1500W for heating tools).";
            }
            else if (needsPlugAdapter)
            {
                isSafe = true;
                verdictStatus = "Safe_With_Adapter";
                headline = "Safe with Physical Plug Adapter";
                detailedAdvice = $"Your {category} is fully voltage-compatible ({ratedVoltage}), but your {homePlug.Replace('_', ' ')} physical pin configuration will not slide into Thai wall sockets. Use a standard universal plug adapter. No voltage transformer required.";
            }
            else
            {
                isSafe = true;
                verdictStatus = "Safe_Direct";
                headline = "100% Direct Plug-In Compatible";
                detailedAdvice = $"Your {category} features dual voltage ({ratedVoltage}) and your 2-pin flat/round plug fits directly into Thailand's hybrid wall sockets. No converter or adapter needed!";
            }

            var result = new CheckApplianceResultDto
            {
                IsSafe = isSafe,
                VerdictStatus = verdictStatus,
                Headline = headline,
                DetailedAdvice = detailedAdvice,
                PlugAdapterNeeded = needsPlugAdapter,
                VoltageTransformerNeeded = needsTransformer
            };

            return Ok(new { success = true, data = result });
        }

        private static PowerHubDataDto GetSeedPowerHub(string siteId)
        {
            if (siteId == "technoheaven")
            {
                return new PowerHubDataDto
                {
                    SiteId = "technoheaven",
                    DestinationCountry = "Thailand",
                    VoltageSpec = new VoltageSpecDto
                    {
                        DestinationCountry = "Thailand",
                        StandardVoltage = "220V",
                        StandardFrequency = "50Hz",
                        HomeCountryComparison = "UAE operates on 230V / 50Hz with Type G plugs. Thailand operates on 220V / 50Hz with Type A, B, C, and O sockets. Voltage is compatible, but UAE 3-pin British plugs require a plug adapter.",
                        AdapterRequired = true,
                        VoltageConverterRequired = false
                    },
                    SupportedPlugTypes = new List<PlugTypeDto>
                    {
                        new PlugTypeDto
                        {
                            PlugType = "A",
                            Name = "Type A (US 2-Pin Flat)",
                            PinCount = 2,
                            IsGrounded = false,
                            Description = "Two flat parallel pins. Widely accepted across all Thai hotel sockets.",
                            CompatibleWithHomePlugs = new List<string> { "US Flat 2-Pin" },
                            NeedsAdapterForHome = true
                        },
                        new PlugTypeDto
                        {
                            PlugType = "C",
                            Name = "Type C (Europlug 2-Pin Round)",
                            PinCount = 2,
                            IsGrounded = false,
                            Description = "Two round 4mm pins. Direct fit for European and multi-region chargers.",
                            CompatibleWithHomePlugs = new List<string> { "Europlug 2-Pin" },
                            NeedsAdapterForHome = true
                        },
                        new PlugTypeDto
                        {
                            PlugType = "O",
                            Name = "Type O (Thai Official 3-Pin)",
                            PinCount = 3,
                            IsGrounded = true,
                            Description = "Official Thai grounded 3-pin standard (TIS 166-2549). Outlets are hybrid and accept Type A and Type C.",
                            CompatibleWithHomePlugs = new List<string> { "Thai 3-Pin", "Type C", "Type A" },
                            NeedsAdapterForHome = true
                        }
                    },
                    ApplianceRules = new List<ApplianceVoltageRuleDto>
                    {
                        new ApplianceVoltageRuleDto
                        {
                            Id = "app-phones",
                            ApplianceCategory = "Smartphones, Laptops & Tablets",
                            TypicalRating = "100V - 240V Dual Voltage",
                            SafetyVerdict = "Safe_With_Plug_Adapter",
                            SafetyWarning = "Modern phone and laptop chargers automatically adapt between 100V and 240V.",
                            RecommendedAction = "Safe to charge with a simple Type G to Type A/C physical adapter.",
                            IconName = "phone-portrait"
                        },
                        new ApplianceVoltageRuleDto
                        {
                            Id = "app-dryer",
                            ApplianceCategory = "Hair Dryers, Straighteners & Curlers",
                            TypicalRating = "Single Voltage (110V or 230V)",
                            SafetyVerdict = "Safe_Direct",
                            SafetyWarning = "UAE 230V styling tools run safely on Thailand 220V. Check US 110V devices which will burn without a transformer.",
                            RecommendedAction = "Most 4-star and 5-star Thai hotels provide high-wattage hair dryers in the bathroom.",
                            IconName = "flash"
                        }
                    },
                    PowerBankKiosks = new List<PowerBankKioskDto>
                    {
                        new PowerBankKioskDto
                        {
                            Id = "pb-chargespot",
                            NetworkName = "ChargeSPOT Thailand",
                            Locations = "Installed at all BTS Skytrain stations, MRT stations, Siam Paragon, and EmQuartier.",
                            Pricing = "15-20 THB/hr (~$0.50 USD), refundable deposit via Visa / Apple Pay.",
                            CableTypes = new List<string> { "USB-C", "Lightning", "Micro-USB" },
                            HowToUse = "Download ChargeSPOT app or scan QR with camera to unlock battery. Return at any kiosk across the city.",
                            IconName = "battery-charging"
                        },
                        new PowerBankKioskDto
                        {
                            Id = "pb-hotel",
                            NetworkName = "Hotel Concierge Loaner Adapters",
                            Locations = "Available at hotel front desks in Bangkok, Phuket & Dubai.",
                            Pricing = "Complimentary (100-200 THB refundable deposit).",
                            CableTypes = new List<string> { "Universal Plug Adapter", "USB-C Multi-Cord" },
                            HowToUse = "Dial '0' from your room phone to request a plug adapter delivered to your room.",
                            IconName = "business"
                        }
                    },
                    QuickTips = new List<string>
                    {
                        "Thailand sockets are hybrid and accept both 2-pin flat and 2-pin round plugs.",
                        "UK/UAE 3-pin rectangular plugs (Type G) will NOT fit directly without a plug adapter.",
                        "Airports and airlines strictly ban power banks larger than 32,000 mAh (160 Wh) in checked or carry-on luggage."
                    }
                };
            }

            if (siteId == "tripgoasia")
            {
                return new PowerHubDataDto
                {
                    SiteId = "tripgoasia",
                    DestinationCountry = "Thailand",
                    VoltageSpec = new VoltageSpecDto
                    {
                        DestinationCountry = "Thailand",
                        StandardVoltage = "220V",
                        StandardFrequency = "50Hz",
                        HomeCountryComparison = "UK & Europe operate on 230V / 50Hz. Thailand operates on 220V / 50Hz. European 2-pin round plugs fit directly; UK 3-pin plugs require a compact travel adapter.",
                        AdapterRequired = true,
                        VoltageConverterRequired = false
                    },
                    SupportedPlugTypes = new List<PlugTypeDto>
                    {
                        new PlugTypeDto
                        {
                            PlugType = "C",
                            Name = "Type C (Europlug 2-Pin Round)",
                            PinCount = 2,
                            IsGrounded = false,
                            Description = "Standard European two-pin round plug. Plugs directly into Thai sockets without any adapter.",
                            CompatibleWithHomePlugs = new List<string> { "European Type C", "Type F" },
                            NeedsAdapterForHome = false
                        },
                        new PlugTypeDto
                        {
                            PlugType = "A",
                            Name = "Type A (US 2-Pin Flat)",
                            PinCount = 2,
                            IsGrounded = false,
                            Description = "Two flat parallel pins. Standard across all Bangkok and island resorts.",
                            CompatibleWithHomePlugs = new List<string> { "US Flat 2-Pin" },
                            NeedsAdapterForHome = true
                        },
                        new PlugTypeDto
                        {
                            PlugType = "B",
                            Name = "Type B (US 3-Pin with Ground)",
                            PinCount = 3,
                            IsGrounded = true,
                            Description = "Two flat parallel pins with a round grounding pin. Fits in modern grounded hotel outlets.",
                            CompatibleWithHomePlugs = new List<string> { "US 3-Pin" },
                            NeedsAdapterForHome = true
                        }
                    },
                    ApplianceRules = new List<ApplianceVoltageRuleDto>
                    {
                        new ApplianceVoltageRuleDto
                        {
                            Id = "app-electronics",
                            ApplianceCategory = "Smartphones, MacBooks & Cameras",
                            TypicalRating = "100V - 240V Dual Voltage",
                            SafetyVerdict = "Safe_With_Plug_Adapter",
                            SafetyWarning = "Automatic switching power supplies handle 100V-240V smoothly.",
                            RecommendedAction = "Use a UK-to-US/EU plug adapter for British plugs. Europlugs plug directly in.",
                            IconName = "laptop-outline"
                        },
                        new ApplianceVoltageRuleDto
                        {
                            Id = "app-heat",
                            ApplianceCategory = "Styling Irons & Hair Dryers",
                            TypicalRating = "220V - 240V (UK/EU models)",
                            SafetyVerdict = "Safe_With_Plug_Adapter",
                            SafetyWarning = "UK 230V models are safe with plug adapter. US 110V models will fry unless dual-voltage.",
                            RecommendedAction = "Verify your hair tool label says '100-240V' before packing.",
                            IconName = "flash"
                        }
                    },
                    PowerBankKiosks = new List<PowerBankKioskDto>
                    {
                        new PowerBankKioskDto
                        {
                            Id = "pb-chargespot",
                            NetworkName = "ChargeSPOT Thailand",
                            Locations = "Available at all BTS Skytrain, MRT subway stations, and CentralWorld.",
                            Pricing = "15-20 THB/hr (~£0.45 GBP), instant unlock with Apple Pay / credit card.",
                            CableTypes = new List<string> { "USB-C", "Lightning", "Micro-USB" },
                            HowToUse = "Scan QR code at the stand to pop out a portable battery. Return at any station.",
                            IconName = "battery-charging"
                        },
                        new PowerBankKioskDto
                        {
                            Id = "pb-7eleven",
                            NetworkName = "7-Eleven Battery Rentals",
                            Locations = "Over 13,000 7-Eleven convenience stores across Thailand.",
                            Pricing = "20 THB for 2 hours.",
                            CableTypes = new List<string> { "Built-in Tri-Cable" },
                            HowToUse = "Ask counter staff or scan the front kiosk to rent.",
                            IconName = "storefront"
                        }
                    },
                    QuickTips = new List<string>
                    {
                        "British 3-pin rectangular plugs (Type G) DO NOT fit into Thai wall outlets without an adapter.",
                        "European 2-pin round plugs (Type C) fit directly into almost every Thai outlet.",
                        "Carry power banks in your carry-on luggage only; they are strictly forbidden in checked bags."
                    }
                };
            }

            // Default: GujjuTours (Indian Travelers going to Thailand)
            return new PowerHubDataDto
            {
                SiteId = "gujjutours",
                DestinationCountry = "Thailand",
                VoltageSpec = new VoltageSpecDto
                {
                    DestinationCountry = "Thailand",
                    StandardVoltage = "220V",
                    StandardFrequency = "50Hz",
                    HomeCountryComparison = "India operates on 230V / 50Hz (Type C & D). Thailand operates on 220V / 50Hz (Type A, B, C, O). Standard Indian 2-pin mobile phone and camera chargers fit DIRECTLY into Thai sockets without any adapter!",
                    AdapterRequired = false,
                    VoltageConverterRequired = false
                },
                SupportedPlugTypes = new List<PlugTypeDto>
                {
                    new PlugTypeDto
                    {
                        PlugType = "C",
                        Name = "Type C (Euro / Indian 2-Pin Round)",
                        PinCount = 2,
                        IsGrounded = false,
                        Description = "Standard Indian 2-pin phone and device chargers. Fits directly into Thai hotel sockets without needing an adapter!",
                        CompatibleWithHomePlugs = new List<string> { "Indian 2-Pin Round", "Europlug" },
                        NeedsAdapterForHome = false
                    },
                    new PlugTypeDto
                    {
                        PlugType = "A",
                        Name = "Type A (US 2-Pin Flat)",
                        PinCount = 2,
                        IsGrounded = false,
                        Description = "Two flat pins. Thailand outlets have hybrid slots that fit both flat pins and round pins.",
                        CompatibleWithHomePlugs = new List<string> { "Flat 2-Pin" },
                        NeedsAdapterForHome = false
                    },
                    new PlugTypeDto
                    {
                        PlugType = "D",
                        Name = "Type D (Indian 3-Pin Large Round)",
                        PinCount = 3,
                        IsGrounded = true,
                        Description = "Indian heavy 3-pin plugs (for heavy laptop bricks). The large round ground pin does not fit Thai sockets; a 3-pin to 2-pin adapter is needed.",
                        CompatibleWithHomePlugs = new List<string> { "Indian 3-Pin (Needs Adapter)" },
                        NeedsAdapterForHome = true
                    }
                },
                ApplianceRules = new List<ApplianceVoltageRuleDto>
                {
                    new ApplianceVoltageRuleDto
                    {
                        Id = "app-mobile",
                        ApplianceCategory = "Smartphones, Tablets & Power Banks",
                        TypicalRating = "100V - 240V Dual Voltage",
                        SafetyVerdict = "Safe_Direct",
                        SafetyWarning = "100% compatible. Indian 2-pin mobile chargers fit directly into Thai wall sockets.",
                        RecommendedAction = "No adapter needed. Plug straight into hotel room sockets.",
                        IconName = "phone-portrait"
                    },
                    new ApplianceVoltageRuleDto
                    {
                        Id = "app-laptop",
                        ApplianceCategory = "Laptops & Camera Battery Chargers",
                        TypicalRating = "100V - 240V Dual Voltage",
                        SafetyVerdict = "Safe_With_Plug_Adapter",
                        SafetyWarning = "If your laptop power cord has a heavy Indian 3-pin plug (Type D), the center grounding pin will not fit into Thai sockets.",
                        RecommendedAction = "Carry a small 3-pin to 2-pin Indian adapter (₹50-100 INR) or use a USB-C laptop charger.",
                        IconName = "laptop-outline"
                    },
                    new ApplianceVoltageRuleDto
                    {
                        Id = "app-shaver",
                        ApplianceCategory = "Hair Dryers, Shavers & Trimmers",
                        TypicalRating = "220V - 240V (Indian models)",
                        SafetyVerdict = "Safe_Direct",
                        SafetyWarning = "Indian personal grooming appliances operate at 230V and run perfectly on Thailand's 220V power grid.",
                        RecommendedAction = "Safe to use directly. Thai hotel bathrooms also provide built-in 110V/220V shaver outlets.",
                        IconName = "flash"
                    }
                },
                PowerBankKiosks = new List<PowerBankKioskDto>
                {
                    new PowerBankKioskDto
                    {
                        Id = "pb-chargespot",
                        NetworkName = "ChargeSPOT Thailand",
                        Locations = "All Bangkok BTS Skytrain and MRT stations, CentralWorld, Iconsiam, and MBK Center.",
                        Pricing = "15-20 THB/hr (~₹40-50 INR), refundable deposit via Visa / Mastercard.",
                        CableTypes = new List<string> { "USB-C", "Lightning", "Micro-USB" },
                        HowToUse = "Scan QR code at the stand to unlock a 5000mAh battery with built-in fast cables. Return at any station.",
                        IconName = "battery-charging"
                    },
                    new PowerBankKioskDto
                    {
                        Id = "pb-7eleven",
                        NetworkName = "7-Eleven Battery Station",
                        Locations = "At almost every street corner in Bangkok, Pattaya, and Phuket.",
                        Pricing = "20 THB (~₹50 INR) for 2 hours.",
                        CableTypes = new List<string> { "USB-C", "iPhone Lightning" },
                        HowToUse = "Scan with your phone camera or ask the cashier to rent a battery pack.",
                        IconName = "storefront"
                    },
                    new PowerBankKioskDto
                    {
                        Id = "pb-concierge",
                        NetworkName = "Hotel Concierge Emergency Adapters",
                        Locations = "At the front desk of all partner hotels.",
                        Pricing = "Free loaner for hotel guests.",
                        CableTypes = new List<string> { "Universal Multi-Pin Adapters" },
                        HowToUse = "Contact reception or dial '0' from your room phone if you need an extra adapter.",
                        IconName = "business"
                    }
                },
                QuickTips = new List<string>
                {
                    "Good news for Indian travelers: Your 2-pin phone and camera chargers fit straight into Thailand wall sockets!",
                    "Thailand outlets are hybrid: they fit both flat US pins and round European/Indian pins.",
                    "If your laptop charger has a 3-pin Indian plug with a thick ground pin, take a simple 3-to-2 pin adapter.",
                    "Never put power banks in checked flight luggage; Indian and Thai airport security will confiscate them. Keep in carry-on."
                }
            };
        }
    }
}
