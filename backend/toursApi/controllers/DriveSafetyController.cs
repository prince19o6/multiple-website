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
    [Route("api/drive-safety")]
    public class DriveSafetyController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<DriveSafetyController> _logger;

        public DriveSafetyController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<DriveSafetyController> logger)
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
        public IActionResult GetDriveSafetyHub([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hubData = GetSeedDriveSafetyHub(resolvedSite);
            return Ok(new { success = true, data = hubData });
        }

        [HttpGet("rules")]
        public IActionResult GetRoadRules([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hubData = GetSeedDriveSafetyHub(resolvedSite);
            return Ok(new { success = true, data = hubData.RoadRules });
        }

        private static DriveSafetyHubDataDto GetSeedDriveSafetyHub(string siteId)
        {
            if (siteId == "technoheaven")
            {
                var uaeRules = new List<RoadRuleItemDto>
                {
                    new RoadRuleItemDto
                    {
                        RuleKey = "DrivingSide",
                        Title = "Drive on the RIGHT",
                        Value = "Right-Hand Traffic",
                        Icon = "navigate-outline",
                        Description = "Vehicles drive on the right side of the road. Overtake on the left.",
                        PenaltyWarning = "Wrong way driving incurs impoundment and AED 1,000 fine.",
                        IsHighRisk = true
                    },
                    new RoadRuleItemDto
                    {
                        RuleKey = "AlcoholLimit",
                        Title = "Blood Alcohol Limit (BAC)",
                        Value = "STRICT ZERO (0.00%)",
                        Icon = "warning-outline",
                        Description = "The UAE enforces zero tolerance for alcohol while operating any motorized vehicle.",
                        PenaltyWarning = "Mandatory arrest, minimum AED 20,000 fine, jail term, and deportation.",
                        IsHighRisk = true
                    },
                    new RoadRuleItemDto
                    {
                        RuleKey = "SpeedLimits",
                        Title = "Speed Cameras & Radars",
                        Value = "Urban 60-80 / Highway 100-140 km/h",
                        Icon = "speedometer-outline",
                        Description = "Fixed and mobile Doppler radar cameras exist every 1-2 km on major highways. No grace margin.",
                        PenaltyWarning = "Fines range from AED 300 to AED 3,000 depending on km/h over limit.",
                        IsHighRisk = false
                    },
                    new RoadRuleItemDto
                    {
                        RuleKey = "Seatbelt",
                        Title = "Mandatory Seatbelts",
                        Value = "All Passengers",
                        Icon = "shield-checkmark-outline",
                        Description = "Every passenger in both front and rear seats must wear a seatbelt at all times.",
                        PenaltyWarning = "AED 400 fine + 4 black points per unbelted passenger.",
                        IsHighRisk = false
                    },
                    new RoadRuleItemDto
                    {
                        RuleKey = "Tailgating",
                        Title = "Tailgating & Safe Distance",
                        Value = "Minimum 2-Second Gap",
                        Icon = "car-outline",
                        Description = "High-speed tailgating or flashing headlights aggressively is captured by smart highway cameras.",
                        PenaltyWarning = "AED 400 fine + 4 black points.",
                        IsHighRisk = false
                    }
                };

                var uaeScamWarnings = new List<RentalScamTipDto>
                {
                    new RentalScamTipDto
                    {
                        TipKey = "SupercarDeposit",
                        Title = "Supercar Security Deposit Hold Scam",
                        Severity = "CRITICAL",
                        Icon = "card-outline",
                        ActionRequired = "Rent only from licensed corporate agencies. Verify refund timeline in writing (standard 14-21 working days for traffic fine reconciliation).",
                        ScamExplanation = "Shady luxury rental outfits may delay returning AED 3,000 - 10,000 credit card holds claiming phantom damage or late camera fines."
                    },
                    new RentalScamTipDto
                    {
                        TipKey = "SalikTolls",
                        Title = "Salik Toll Gate Admin Fee Markups",
                        Severity = "WARNING",
                        Icon = "cash-outline",
                        ActionRequired = "Confirm Salik admin surcharge on rental agreement. Government toll is AED 4; fair rental markup is AED 5-6.",
                        ScamExplanation = "Some independent agencies quietly charge AED 10-15 per toll gate crossing."
                    },
                    new RentalScamTipDto
                    {
                        TipKey = "RimRash",
                        Title = "Alloy Wheel Kerb Scrape Penalties",
                        Severity = "WARNING",
                        Icon = "disc-outline",
                        ActionRequired = "Take close-up photos of all 4 wheel rims and tire sidewalls before driving away.",
                        ScamExplanation = "Rental shops inspect rim edges upon return and bill up to AED 1,500 per refurbished wheel."
                    }
                };

                var uaePreRide = new List<PreRideChecklistStepDto>
                {
                    new PreRideChecklistStepDto
                    {
                        StepId = "step1",
                        Title = "Bodywork 360 Video",
                        Detail = "Record continuous walkaround video showing bumpers, mirrors, and roof in daylight.",
                        Icon = "videocam-outline",
                        RequiresPhoto = true
                    },
                    new PreRideChecklistStepDto
                    {
                        StepId = "step2",
                        Title = "All 4 Wheel Rims",
                        Detail = "Inspect all alloy wheel rims for preexisting kerb rash or curb scratches.",
                        Icon = "disc-outline",
                        RequiresPhoto = true
                    },
                    new PreRideChecklistStepDto
                    {
                        StepId = "step3",
                        Title = "Fuel Gauge & Odometer",
                        Detail = "Photograph dashboard cluster to record exact fuel level and starting mileage.",
                        Icon = "speedometer-outline",
                        RequiresPhoto = true
                    },
                    new PreRideChecklistStepDto
                    {
                        StepId = "step4",
                        Title = "Insurance Excess Document",
                        Detail = "Verify whether rental contract includes CDW (Collision Damage Waiver) and check maximum excess liability.",
                        Icon = "document-text-outline",
                        RequiresPhoto = false
                    }
                };

                return new DriveSafetyHubDataDto
                {
                    SiteId = "technoheaven",
                    Country = "United Arab Emirates",
                    DrivingSide = "RIGHT (Drive on the Right Side)",
                    IdpRequirementSummary = "Tourists require an International Driving Permit (IDP) alongside their original national driver's license, passport, and UAE tourist visa. GCC/US/EU license holders can drive directly without IDP.",
                    SpeedLimitCity = "60 - 80 km/h",
                    SpeedLimitHighway = "100 - 140 km/h",
                    BloodAlcoholLimit = "0.00% (Strict Zero Tolerance)",
                    HelmetLaw = "Mandatory for motorcycles and delivery riders. Helmets must meet ECE or DOT standards.",
                    RoadsideAssistanceNumber = "800 9090",
                    HighwayPoliceNumber = "999",
                    RoadRules = uaeRules,
                    ScamWarnings = uaeScamWarnings,
                    PreRideChecklist = uaePreRide
                };
            }

            // Default: GujjuTours & TripGoAsia (Thailand)
            var thaiRules = new List<RoadRuleItemDto>
            {
                new RoadRuleItemDto
                {
                    RuleKey = "DrivingSide",
                    Title = "Drive on the LEFT",
                    Value = "Left-Hand Traffic (Same as UK / India)",
                    Icon = "navigate-outline",
                    Description = "Traffic drives on the left side of the road. Driver sits on the right. Overtake on the right.",
                    PenaltyWarning = "Wrong-side driving against one-way sois causes severe collisions and fines.",
                    IsHighRisk = true
                },
                new RoadRuleItemDto
                {
                    RuleKey = "IDPRequirement",
                    Title = "International Driving Permit (IDP)",
                    Value = "MANDATORY (Category A for Scooters)",
                    Icon = "id-card-outline",
                    Description = "You MUST carry a valid 1949 or 1968 Geneva Convention IDP + original home motorcycle license. Note: Driving without Category A endorsement VOIDS your travel medical insurance in case of an accident!",
                    PenaltyWarning = "Police checkpoint fine: 500 - 1,000 THB. Vehicle may be temporarily impounded.",
                    IsHighRisk = true
                },
                new RoadRuleItemDto
                {
                    RuleKey = "HelmetLaw",
                    Title = "Helmet Mandate",
                    Value = "100% Mandatory for Driver & Pillion",
                    Icon = "shield-outline",
                    Description = "Both rider and passenger must wear a securely buckled helmet at all times, even for short 2-minute trips.",
                    PenaltyWarning = "Instant 500 - 1,000 THB on-the-spot fine at regular Phuket / Pattaya checkpoints.",
                    IsHighRisk = true
                },
                new RoadRuleItemDto
                {
                    RuleKey = "BloodAlcohol",
                    Title = "Blood Alcohol Limit (BAC)",
                    Value = "0.05% (0.02% for New/Probationary Drivers)",
                    Icon = "warning-outline",
                    Description = "Thailand police conduct frequent breathalyzer checkpoints near Patong Bangla Road and Pattaya Walking Street.",
                    PenaltyWarning = "Up to 1 year imprisonment, 20,000 THB fine, and immediate court appearance.",
                    IsHighRisk = true
                },
                new RoadRuleItemDto
                {
                    RuleKey = "LeftTurnOnRed",
                    Title = "Turning Left at Red Signals",
                    Value = "Permitted unless sign says otherwise",
                    Icon = "arrow-undo-outline",
                    Description = "In Thailand, you can turn left on a red traffic signal after coming to a complete stop, UNLESS a sign specifically prohibits it ('เลี้ยวซ้ายผ่านตลอด').",
                    PenaltyWarning = "Ensure path is clear for straight-moving oncoming traffic.",
                    IsHighRisk = false
                },
                new RoadRuleItemDto
                {
                    RuleKey = "SpeedLimits",
                    Title = "Speed Limits",
                    Value = "City: 50-60 km/h | Open Road: 90 km/h",
                    Icon = "speedometer-outline",
                    Description = "Watch out for sudden speed humps, stray animals, loose gravel, and tourists walking in sois.",
                    PenaltyWarning = "Speeding fines are 500 - 1,000 THB.",
                    IsHighRisk = false
                }
            };

            var thaiScams = new List<RentalScamTipDto>
            {
                new RentalScamTipDto
                {
                    TipKey = "PassportHostage",
                    Title = "Original Passport Hostage Scam",
                    Severity = "CRITICAL",
                    Icon = "lock-closed-outline",
                    ActionRequired = "NEVER leave your original passport as a rental deposit under ANY circumstance! Provide a high-quality paper copy + 1,000 - 3,000 THB refundable cash deposit instead.",
                    ScamExplanation = "Shady shops keep your physical passport so when you return the scooter, they can hold your passport hostage and demand 10,000 - 30,000 THB for preexisting scratches you didn't cause!"
                },
                new RentalScamTipDto
                {
                    TipKey = "PreExistingDamage",
                    Title = "Pre-Existing Scratch Extortion",
                    Severity = "CRITICAL",
                    Icon = "videocam-outline",
                    ActionRequired = "Take a continuous 360-degree high-definition video of the entire scooter in front of the rental agent before touching the keys.",
                    ScamExplanation = "Inspect the underside of the front fender, kickstand area, brake lever tips, and exhaust heat shield where scrapes are common."
                },
                new RentalScamTipDto
                {
                    TipKey = "BrakeTireFailure",
                    Title = "Worn-Out Brakes & Bald Tires",
                    Severity = "WARNING",
                    Icon = "build-outline",
                    ActionRequired = "Test both front and rear brake levers before signing. Check tire grooves for deep tread. Wet Thai asphalt is very slippery with bald tires.",
                    ScamExplanation = "Many budget rentals rarely replace brake pads or tires. If the lever pulls all the way to the handlebar, refuse the bike."
                },
                new RentalScamTipDto
                {
                    TipKey = "InsuranceVoid",
                    Title = "Travel Insurance Invalidation Alert",
                    Severity = "CRITICAL",
                    Icon = "shield-alert-outline",
                    ActionRequired = "Ensure your home driver's license explicitly has a motorcycle endorsement (Category A on IDP).",
                    ScamExplanation = "Almost ALL international travel insurance policies strictly deny claims if you ride a motorcycle over 50cc without a valid motorcycle license endorsement!"
                }
            };

            var thaiPreRide = new List<PreRideChecklistStepDto>
            {
                new PreRideChecklistStepDto
                {
                    StepId = "step1",
                    Title = "Full 360° Walkaround Video",
                    Detail = "Record a slow video showing all fairings, mirrors, undercarriage, and exhaust pipe in bright sunlight.",
                    Icon = "videocam-outline",
                    RequiresPhoto = true
                },
                new PreRideChecklistStepDto
                {
                    StepId = "step2",
                    Title = "Inspect Brake Levers & Cables",
                    Detail = "Squeeze both levers firmly. The bike should come to a dead stop without levers touching grips.",
                    Icon = "hand-left-outline",
                    RequiresPhoto = false
                },
                new PreRideChecklistStepDto
                {
                    StepId = "step3",
                    Title = "Tire Tread & Air Pressure",
                    Detail = "Check that front and rear tires have visible grooves and are not smooth or dry-rotted.",
                    Icon = "disc-outline",
                    RequiresPhoto = true
                },
                new PreRideChecklistStepDto
                {
                    StepId = "step4",
                    Title = "Fuel Gauge & Odometer Photo",
                    Detail = "Photograph the dashboard cluster showing current fuel level and km counter.",
                    Icon = "speedometer-outline",
                    RequiresPhoto = true
                },
                new PreRideChecklistStepDto
                {
                    StepId = "step5",
                    Title = "Helmet Chin Strap & Visor",
                    Detail = "Check that the rental helmets have working chin buckles and clean visors for night riding.",
                    Icon = "shield-outline",
                    RequiresPhoto = false
                }
            };

            return new DriveSafetyHubDataDto
            {
                SiteId = siteId,
                Country = "Thailand",
                DrivingSide = "LEFT (Drive on the Left Side)",
                IdpRequirementSummary = "An International Driving Permit (IDP) with Category A (Motorcycle) endorsement is required by Thai law and police checkpoints. Driving without Category A completely voids travel insurance.",
                SpeedLimitCity = "50 - 60 km/h",
                SpeedLimitHighway = "90 - 120 km/h",
                BloodAlcoholLimit = "0.05% (0.02% for New/Probationary Drivers)",
                HelmetLaw = "MANDATORY for driver AND passenger. Police enforce 500-1000 THB fines at major tourist checkpoints.",
                RoadsideAssistanceNumber = "1155 (Tourist Police)",
                HighwayPoliceNumber = "1193 (Highway Police)",
                RoadRules = thaiRules,
                ScamWarnings = thaiScams,
                PreRideChecklist = thaiPreRide
            };
        }
    }
}
