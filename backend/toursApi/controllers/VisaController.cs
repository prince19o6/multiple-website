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
    [Route("api/visa")]
    public class VisaController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<VisaController> _logger;

        public VisaController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<VisaController> logger)
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
        public IActionResult GetVisaHubData([FromQuery] string? siteId = null, [FromQuery] string? nationality = null, [FromQuery] string? destination = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedVisaHub(resolvedSite);

            if (!string.IsNullOrWhiteSpace(nationality))
            {
                hub.DefaultNationality = nationality.Trim();
            }

            if (!string.IsNullOrWhiteSpace(destination))
            {
                hub.DefaultDestination = destination.Trim();
            }

            return Ok(new { success = true, data = hub });
        }

        [HttpGet("check")]
        public IActionResult CheckVisaRule([FromQuery] string nationality, [FromQuery] string destination, [FromQuery] string? siteId = null)
        {
            if (string.IsNullOrWhiteSpace(nationality) || string.IsNullOrWhiteSpace(destination))
            {
                return BadRequest(new { success = false, message = "Both nationality and destination country are required." });
            }

            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedVisaHub(resolvedSite);

            var rule = hub.VisaRequirements.FirstOrDefault(r =>
                r.DestinationCountry.Equals(destination.Trim(), StringComparison.OrdinalIgnoreCase) &&
                r.PassportNationality.Equals(nationality.Trim(), StringComparison.OrdinalIgnoreCase));

            if (rule == null)
            {
                // General fallback rule
                rule = new VisaRequirementDto
                {
                    Id = "fallback-" + Guid.NewGuid().ToString("N")[..6],
                    DestinationCountry = destination.Trim(),
                    PassportNationality = nationality.Trim(),
                    Status = "Visa_On_Arrival",
                    StatusBadge = "Standard Tourist Entry / VoA",
                    MaxStayDays = 30,
                    ProcessingTime = "Available at international airport border",
                    EstimatedFee = "$35 - $60 USD",
                    PassportValidityMonthsRequired = 6,
                    BlankPagesRequired = 2,
                    MandatoryDocuments = new List<string>
                    {
                        "Passport valid for at least 6 months",
                        "Confirmed return or onward ticket",
                        "Proof of accommodation / tour voucher",
                        "Sufficient funds for duration of stay"
                    },
                    OfficialPortalUrl = "https://www.immigration.gov",
                    Notes = "Please verify with local embassy before departure."
                };
            }

            return Ok(new { success = true, data = rule });
        }

        [HttpPost("check-validity")]
        public IActionResult CheckPassportValidity([FromBody] PassportValidityCheckRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.PassportExpiryDate) || string.IsNullOrWhiteSpace(request.TripDepartureDate))
            {
                return BadRequest(new { success = false, message = "Passport expiry date and trip departure date are required (YYYY-MM-DD)." });
            }

            if (!DateTime.TryParse(request.PassportExpiryDate, out var expiry) ||
                !DateTime.TryParse(request.TripDepartureDate, out var departure))
            {
                return BadRequest(new { success = false, message = "Dates must be valid YYYY-MM-DD formats." });
            }

            var daysRemaining = (int)(expiry.Date - departure.Date).TotalDays;
            var monthsRemaining = Math.Round(daysRemaining / 30.4375, 1);
            const int requiredMonths = 6;

            var result = new PassportValidityCheckResultDto
            {
                DaysRemainingOnDeparture = daysRemaining,
                MonthsRemaining = Math.Max(0, monthsRemaining),
                MinimumMonthsRequired = requiredMonths
            };

            if (daysRemaining < 0)
            {
                result.IsValid = false;
                result.Status = "Invalid_Expired";
                result.RenewalRecommended = true;
                result.Message = $"Your passport will ALREADY BE EXPIRED on your departure date ({departure:dd MMM yyyy}). You will be denied boarding at airport check-in.";
            }
            else if (monthsRemaining < requiredMonths)
            {
                result.IsValid = false;
                result.Status = "Warning";
                result.RenewalRecommended = true;
                result.Message = $"High Risk: Your passport has only {monthsRemaining:F1} months validity on departure date ({departure:dd MMM yyyy}). International civil aviation (ICAO) and immigration require at least {requiredMonths} full months. Airline gate agents may deny boarding.";
            }
            else
            {
                result.IsValid = true;
                result.Status = "Valid";
                result.RenewalRecommended = false;
                result.Message = $"Passport valid! You have {monthsRemaining:F1} months ({daysRemaining} days) validity from departure date, which exceeds the mandatory {requiredMonths}-month international immigration requirement.";
            }

            return Ok(new { success = true, data = result });
        }

        [HttpGet("embassies")]
        public IActionResult GetEmbassies([FromQuery] string? city, [FromQuery] string? homeCountry, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedVisaHub(resolvedSite);
            var list = hub.Embassies.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(city) && city.ToLowerInvariant() != "all")
            {
                list = list.Where(e => e.City.Equals(city.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(homeCountry))
            {
                list = list.Where(e => e.HomeCountry.Equals(homeCountry.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            return Ok(new { success = true, count = list.Count(), data = list.ToList() });
        }

        private static VisaHubDataDto GetSeedVisaHub(string siteId)
        {
            if (siteId == "technoheaven")
            {
                return new VisaHubDataDto
                {
                    SiteId = "technoheaven",
                    DefaultNationality = "United Arab Emirates",
                    DefaultDestination = "Thailand",
                    SupportedDestinations = new List<string> { "Thailand", "United Kingdom", "France", "Switzerland", "Japan", "Singapore" },
                    SupportedNationalities = new List<string> { "United Arab Emirates", "Saudi Arabia", "India", "United Kingdom", "United States" },
                    VisaRequirements = new List<VisaRequirementDto>
                    {
                        new VisaRequirementDto
                        {
                            Id = "req-th-uae",
                            DestinationCountry = "Thailand",
                            PassportNationality = "United Arab Emirates",
                            Status = "Visa_Free",
                            StatusBadge = "60 Days Visa-Free Exemption",
                            MaxStayDays = 60,
                            ProcessingTime = "Instant at Border Immigration",
                            EstimatedFee = "Free (0 THB)",
                            PassportValidityMonthsRequired = 6,
                            BlankPagesRequired = 2,
                            MandatoryDocuments = new List<string>
                            {
                                "Valid biometric UAE passport (min 6 months)",
                                "Confirmed return ticket within 60 days",
                                "Hotel or luxury villa booking confirmation",
                                "Digital TM6 arrival form submitted within 72h"
                            },
                            OfficialPortalUrl = "https://www.immigration.go.th",
                            Notes = "Extendable for an additional 30 days at any Thai Immigration Office for 1,900 THB."
                        },
                        new VisaRequirementDto
                        {
                            Id = "req-uk-uae",
                            DestinationCountry = "United Kingdom",
                            PassportNationality = "United Arab Emirates",
                            Status = "eVisa",
                            StatusBadge = "Electronic Travel Authorisation (ETA)",
                            MaxStayDays = 180,
                            ProcessingTime = "Under 2 hours via UK ETA App",
                            EstimatedFee = "£10 GBP (~$13 USD)",
                            PassportValidityMonthsRequired = 6,
                            BlankPagesRequired = 1,
                            MandatoryDocuments = new List<string>
                            {
                                "Valid biometric passport",
                                "Digital photo meeting UK passport specifications",
                                "Approved UK ETA app digital confirmation"
                            },
                            OfficialPortalUrl = "https://www.gov.uk/electronic-travel-authorisation",
                            Notes = "Valid for 2 years of multiple visits up to 6 months each."
                        }
                    },
                    ArrivalCards = new List<DigitalArrivalCardDto>
                    {
                        new DigitalArrivalCardDto
                        {
                            CardId = "card-th-tm6",
                            DestinationCountry = "Thailand",
                            CardName = "Thailand Digital Arrival Exemption & Health Card",
                            SubmissionWindow = "Within 72 hours before international flight departure",
                            IsMandatory = true,
                            OfficialSubmissionUrl = "https://www.immigration.go.th",
                            RequiredDetails = new List<string> { "Flight Number & Seat", "Hotel/Resort Address", "Passport biodata", "Length of stay" },
                            CustomsDutyRules = "Up to 1 liter of alcoholic beverage and 200 cigarettes duty-free. Electronic cigarettes and vaporizers are strictly prohibited in Thailand."
                        }
                    },
                    Embassies = new List<EmbassyConsulateDto>
                    {
                        new EmbassyConsulateDto
                        {
                            Id = "emb-uae-bkk",
                            HomeCountry = "United Arab Emirates",
                            DestinationCountry = "Thailand",
                            City = "Bangkok",
                            MissionName = "Embassy of the United Arab Emirates in Bangkok",
                            Address = "87/2 CRC Tower, 29th Floor, All Seasons Place, Wireless Road, Lumpini, Pathumwan, Bangkok 10330",
                            EmergencyPhone = "+66 2 402 4000",
                            ConsularEmail = "bangkokemb@mofaic.gov.ae",
                            WorkingHours = "Mon - Fri: 09:00 - 16:00",
                            LostPassportInstructions = "Contact the 24/7 consular hotline immediately. Bring a Thai police report and digital passport copy to issue an Emergency Travel Document."
                        }
                    }
                };
            }

            if (siteId == "tripgoasia")
            {
                return new VisaHubDataDto
                {
                    SiteId = "tripgoasia",
                    DefaultNationality = "United States",
                    DefaultDestination = "Thailand",
                    SupportedDestinations = new List<string> { "Thailand", "Vietnam", "Indonesia", "Malaysia", "Singapore", "Japan" },
                    SupportedNationalities = new List<string> { "United States", "United Kingdom", "Australia", "Canada", "Germany", "India" },
                    VisaRequirements = new List<VisaRequirementDto>
                    {
                        new VisaRequirementDto
                        {
                            Id = "req-th-us",
                            DestinationCountry = "Thailand",
                            PassportNationality = "United States",
                            Status = "Visa_Free",
                            StatusBadge = "60 Days Visa Exemption",
                            MaxStayDays = 60,
                            ProcessingTime = "Instant at Border Immigration",
                            EstimatedFee = "Free (0 THB)",
                            PassportValidityMonthsRequired = 6,
                            BlankPagesRequired = 2,
                            MandatoryDocuments = new List<string>
                            {
                                "US Passport with min 6 months validity",
                                "Confirmed return/onward flight within 60 days",
                                "Proof of funds (min $300 USD cash/card)",
                                "Hotel or hostel reservation voucher"
                            },
                            OfficialPortalUrl = "https://www.thaievisa.go.th",
                            Notes = "Extendable in-country for 30 more days at Bangkok or Phuket immigration office."
                        },
                        new VisaRequirementDto
                        {
                            Id = "req-vn-us",
                            DestinationCountry = "Vietnam",
                            PassportNationality = "United States",
                            Status = "eVisa",
                            StatusBadge = "90 Days Multiple Entry eVisa",
                            MaxStayDays = 90,
                            ProcessingTime = "3 Business Days",
                            EstimatedFee = "$25 USD Single / $50 Multiple",
                            PassportValidityMonthsRequired = 6,
                            BlankPagesRequired = 2,
                            MandatoryDocuments = new List<string>
                            {
                                "Clear passport photo scan",
                                "Portrait photo without glasses",
                                "Online Vietnam eVisa approval letter printout"
                            },
                            OfficialPortalUrl = "https://evisa.xuatnhapcanh.gov.vn",
                            Notes = "Print 2 hard copies of the approved eVisa letter for airport check-in and border immigration."
                        },
                        new VisaRequirementDto
                        {
                            Id = "req-id-us",
                            DestinationCountry = "Indonesia",
                            PassportNationality = "United States",
                            Status = "Visa_On_Arrival",
                            StatusBadge = "30 Days e-VoA (Extendable)",
                            MaxStayDays = 30,
                            ProcessingTime = "Instant Online or at Bali Denpasar Airport",
                            EstimatedFee = "500,000 IDR (~$32 USD)",
                            PassportValidityMonthsRequired = 6,
                            BlankPagesRequired = 2,
                            MandatoryDocuments = new List<string>
                            {
                                "Passport valid for at least 6 months",
                                "Return ticket out of Indonesia",
                                "Electronic Customs Declaration (e-CD) QR code"
                            },
                            OfficialPortalUrl = "https://molina.imigrasi.go.id",
                            Notes = "Can be purchased online prior to flight or on arrival at DPS/CGK airports."
                        }
                    },
                    ArrivalCards = new List<DigitalArrivalCardDto>
                    {
                        new DigitalArrivalCardDto
                        {
                            CardId = "card-th-tm6",
                            DestinationCountry = "Thailand",
                            CardName = "Thailand Digital Arrival Exemption Form",
                            SubmissionWindow = "Within 72 hours before landing in BKK / HKT",
                            IsMandatory = true,
                            OfficialSubmissionUrl = "https://www.immigration.go.th",
                            RequiredDetails = new List<string> { "Flight Number & Seat", "Hotel/Resort Address", "Passport biodata", "Length of stay" },
                            CustomsDutyRules = "Up to 1 liter of alcoholic beverage and 200 cigarettes duty-free. Electronic cigarettes and vaporizers are strictly prohibited in Thailand."
                        },
                        new DigitalArrivalCardDto
                        {
                            CardId = "card-id-ecd",
                            DestinationCountry = "Indonesia",
                            CardName = "Indonesia Electronic Customs Declaration (e-CD)",
                            SubmissionWindow = "Within 3 days of arrival in Bali / Jakarta",
                            IsMandatory = true,
                            OfficialSubmissionUrl = "https://ecd.beacukai.go.id",
                            RequiredDetails = new List<string> { "Flight details", "Baggage piece count", "Customs declaration", "IMEI phone registration if staying >90 days" },
                            CustomsDutyRules = "Maximum 1 liter of alcohol and 200 cigarettes per adult."
                        }
                    },
                    Embassies = new List<EmbassyConsulateDto>
                    {
                        new EmbassyConsulateDto
                        {
                            Id = "emb-us-bkk",
                            HomeCountry = "United States",
                            DestinationCountry = "Thailand",
                            City = "Bangkok",
                            MissionName = "Embassy of the United States, Bangkok",
                            Address = "95 Wireless Road, Lumpini, Pathumwan, Bangkok 10330",
                            EmergencyPhone = "+66 2 205 4000",
                            ConsularEmail = "acsbkk@state.gov",
                            WorkingHours = "Mon - Fri: 07:00 - 16:00 (24/7 Emergency Line Available)",
                            LostPassportInstructions = "For lost or stolen US passports, report to Thai Tourist Police for a police report, then book an emergency appointment at the US Embassy for an Emergency Photo-digitized Passport."
                        },
                        new EmbassyConsulateDto
                        {
                            Id = "emb-uk-bkk",
                            HomeCountry = "United Kingdom",
                            DestinationCountry = "Thailand",
                            City = "Bangkok",
                            MissionName = "British Embassy Bangkok",
                            Address = "AIA Sathorn Tower, 11/1 South Sathorn Road, Yan Nawa, Sathon, Bangkok 10120",
                            EmergencyPhone = "+66 2 305 8333",
                            ConsularEmail = "consular.bangkok@fcdo.gov.uk",
                            WorkingHours = "Mon - Fri: 08:00 - 16:30",
                            LostPassportInstructions = "Apply online for an Emergency Travel Document (ETD). It can be issued within 2 working days after consular review."
                        }
                    }
                };
            }

            // Default: GujjuTours
            return new VisaHubDataDto
            {
                SiteId = "gujjutours",
                DefaultNationality = "India",
                DefaultDestination = "Thailand",
                SupportedDestinations = new List<string> { "Thailand", "United Arab Emirates", "Singapore", "Malaysia", "Vietnam", "Indonesia" },
                SupportedNationalities = new List<string> { "India", "United States", "United Kingdom", "United Arab Emirates", "Australia" },
                VisaRequirements = new List<VisaRequirementDto>
                {
                    new VisaRequirementDto
                    {
                        Id = "req-th-in",
                        DestinationCountry = "Thailand",
                        PassportNationality = "India",
                        Status = "Visa_Free",
                        StatusBadge = "60 Days Visa-Free Exemption",
                        MaxStayDays = 60,
                        ProcessingTime = "Instant at Border Immigration",
                        EstimatedFee = "Free (0 THB)",
                        PassportValidityMonthsRequired = 6,
                        BlankPagesRequired = 2,
                        MandatoryDocuments = new List<string>
                        {
                            "Indian Passport valid for min 6 months",
                            "Confirmed return flight ticket within 60 days",
                            "Hotel booking voucher or host address in Thailand",
                            "Proof of funds (10,000 THB / ₹23,000 per person or 20,000 THB per family)"
                        },
                        OfficialPortalUrl = "https://www.immigration.go.th",
                        Notes = "Under the latest Thai bilateral tourism agreement, Indian passport holders enjoy 60 days visa-free entry with zero visa fee."
                    },
                    new VisaRequirementDto
                    {
                        Id = "req-uae-in",
                        DestinationCountry = "United Arab Emirates",
                        PassportNationality = "India",
                        Status = "eVisa",
                        StatusBadge = "30 Days Tourist eVisa / 14 Days VoA",
                        MaxStayDays = 30,
                        ProcessingTime = "24-48 Hours Online (Instant VoA with US/UK Visa)",
                        EstimatedFee = "$95 USD (~₹7,800 INR)",
                        PassportValidityMonthsRequired = 6,
                        BlankPagesRequired = 2,
                        MandatoryDocuments = new List<string>
                        {
                            "Scanned color passport copy",
                            "Passport photo with white background",
                            "Confirmed return flight on Emirates/FlyDubai/Air India",
                            "Valid US/UK/Schengen visa allows 14-day VoA on arrival at DXB"
                        },
                        OfficialPortalUrl = "https://smartservices.icp.gov.ae",
                        Notes = "Indian citizens with a valid US B1/B2, Green Card, UK or EU residence visa get instant 14-day Visa on Arrival at Dubai airport."
                    },
                    new VisaRequirementDto
                    {
                        Id = "req-my-in",
                        DestinationCountry = "Malaysia",
                        PassportNationality = "India",
                        Status = "Visa_Free",
                        StatusBadge = "30 Days Visa-Free Exemption",
                        MaxStayDays = 30,
                        ProcessingTime = "Instant with MDAC Digital Pass",
                        EstimatedFee = "Free (0 MYR)",
                        PassportValidityMonthsRequired = 6,
                        BlankPagesRequired = 2,
                        MandatoryDocuments = new List<string>
                        {
                            "Passport valid for at least 6 months",
                            "Confirmed return flight ticket to India",
                            "Completed Malaysia Digital Arrival Card (MDAC) within 3 days",
                            "Hotel confirmation voucher"
                        },
                        OfficialPortalUrl = "https://imigresen-online.imi.gov.my/mdac/main",
                        Notes = "Mandatory MDAC online submission must be completed within 3 days prior to arrival."
                    },
                    new VisaRequirementDto
                    {
                        Id = "req-sg-in",
                        DestinationCountry = "Singapore",
                        PassportNationality = "India",
                        Status = "eVisa",
                        StatusBadge = "30 Days Pre-Approved eVisa",
                        MaxStayDays = 30,
                        ProcessingTime = "2-3 Business Days",
                        EstimatedFee = "30 SGD (~₹1,900 INR)",
                        PassportValidityMonthsRequired = 6,
                        BlankPagesRequired = 2,
                        MandatoryDocuments = new List<string>
                        {
                            "Authorized visa agent submission",
                            "6 months bank statement",
                            "SG Arrival Card (SGAC) submitted within 3 days prior to arrival",
                            "Confirmed roundtrip flights"
                        },
                        OfficialPortalUrl = "https://eservices.ica.gov.sg/esvclandingpage/save",
                        Notes = "Singapore eVisa must be processed before boarding. SG Arrival Card is mandatory for all entries."
                    }
                },
                ArrivalCards = new List<DigitalArrivalCardDto>
                {
                    new DigitalArrivalCardDto
                    {
                        CardId = "card-th-tm6",
                        DestinationCountry = "Thailand",
                        CardName = "Thailand Digital Arrival Exemption (TM6)",
                        SubmissionWindow = "Within 72 hours before flight boarding",
                        IsMandatory = true,
                        OfficialSubmissionUrl = "https://www.immigration.go.th",
                        RequiredDetails = new List<string> { "Flight Number & Seat", "Hotel Address in Bangkok/Phuket", "Passport biodata", "Length of stay" },
                        CustomsDutyRules = "Up to 1 liter of spirits and 200 cigarettes duty-free. Electronic cigarettes and vaporizers are strictly prohibited in Thailand."
                    },
                    new DigitalArrivalCardDto
                    {
                        CardId = "card-my-mdac",
                        DestinationCountry = "Malaysia",
                        CardName = "Malaysia Digital Arrival Card (MDAC)",
                        SubmissionWindow = "Within 3 days before arrival at KUL airport",
                        IsMandatory = true,
                        OfficialSubmissionUrl = "https://imigresen-online.imi.gov.my/mdac/main",
                        RequiredDetails = new List<string> { "Date of Arrival", "Date of Departure", "Mode of Transport", "Accommodation in Malaysia" },
                        CustomsDutyRules = "1 liter alcohol, 225g tobacco, personal goods up to 1,000 MYR."
                    },
                    new DigitalArrivalCardDto
                    {
                        CardId = "card-sg-sgac",
                        DestinationCountry = "Singapore",
                        CardName = "Singapore SG Arrival Card & Electronic Health Declaration",
                        SubmissionWindow = "Within 3 days prior to landing at Changi Airport",
                        IsMandatory = true,
                        OfficialSubmissionUrl = "https://eservices.ica.gov.sg/sgarrivalcard",
                        RequiredDetails = new List<string> { "Flight code", "Hotel name & postal code", "Health questionnaire", "Next country of travel" },
                        CustomsDutyRules = "Chewing gum is strictly illegal. Tobacco products carry heavy duty and must be declared at the Red Channel."
                    }
                },
                Embassies = new List<EmbassyConsulateDto>
                {
                    new EmbassyConsulateDto
                    {
                        Id = "emb-in-bkk",
                        HomeCountry = "India",
                        DestinationCountry = "Thailand",
                        City = "Bangkok",
                        MissionName = "Embassy of India in Bangkok",
                        Address = "75/120-121, 42nd Floor, Ocean Tower II, Soi Sukhumvit 19, Wattana, Bangkok 10110",
                        EmergencyPhone = "+66 2 258 0300",
                        ConsularEmail = "cons.bangkok@mea.gov.in",
                        WorkingHours = "Mon - Fri: 09:00 - 17:30 (Consular: 09:00 - 12:00)",
                        LostPassportInstructions = "File an immediate FIR with Thai Tourist Police (call 1155). Visit the Embassy with the police report, 4 passport photos, and digital copy of Indian passport for an Emergency Certificate (EC)."
                    },
                    new EmbassyConsulateDto
                    {
                        Id = "emb-in-dxb",
                        HomeCountry = "India",
                        DestinationCountry = "United Arab Emirates",
                        City = "Dubai",
                        MissionName = "Consulate General of India, Dubai",
                        Address = "Al Hamriya, Diplomatic Enclave, P.O. Box 737, Dubai, UAE",
                        EmergencyPhone = "+971 4 397 1222",
                        ConsularEmail = "cgoffice.dubai@mea.gov.in",
                        WorkingHours = "Mon - Fri: 08:30 - 17:00",
                        LostPassportInstructions = "Lodge lost passport complaint on Dubai Police App, then visit the Indian Consulate for fast-track Emergency Certificate or duplicate passport."
                    },
                    new EmbassyConsulateDto
                    {
                        Id = "emb-in-sg",
                        HomeCountry = "India",
                        DestinationCountry = "Singapore",
                        City = "Singapore",
                        MissionName = "High Commission of India, Singapore",
                        Address = "31 Grange Road, Singapore 239702",
                        EmergencyPhone = "+65 6737 6777",
                        ConsularEmail = "cons.singapore@mea.gov.in",
                        WorkingHours = "Mon - Fri: 09:00 - 17:30",
                        LostPassportInstructions = "Contact the emergency consular helpdesk. Present Singapore Police report and Indian Aadhaar/voter ID copy for express repatriation paperwork."
                    }
                }
            };
        }
    }
}
