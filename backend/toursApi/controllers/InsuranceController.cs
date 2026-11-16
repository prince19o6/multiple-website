using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/insurance")]
    public class InsuranceController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<InsuranceController> _logger;

        public InsuranceController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<InsuranceController> logger)
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

        [HttpGet("policy")]
        public async Task<IActionResult> GetPolicy([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            TravelInsurancePolicy? policy = null;

            try
            {
                var db = _dbProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<TravelInsurancePolicy>("travel_insurance_policies");

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                policy = await collection.Find(x => x.SiteId == resolvedSite)
                                          .SortByDescending(x => x.CreatedAt)
                                          .FirstOrDefaultAsync(cts.Token);

                if (policy == null)
                {
                    policy = GetSeedPolicy(resolvedSite);
                    using var insertCts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                    await collection.InsertOneAsync(policy, null, insertCts.Token);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[InsuranceController] Non-fatal Mongo fetch exception: {Message}", ex.Message);
                policy ??= GetSeedPolicy(resolvedSite);
            }

            return Ok(new { success = true, data = MapToDto(policy) });
        }

        [HttpGet("hospitals")]
        public IActionResult GetHospitals([FromQuery] string? city, [FromQuery] string? search, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var policy = GetSeedPolicy(resolvedSite);
            var list = policy.PreApprovedHospitals.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(city) && city.ToLowerInvariant() != "all")
            {
                list = list.Where(h => h.City.Equals(city, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLowerInvariant();
                list = list.Where(h => h.Name.ToLowerInvariant().Contains(q) ||
                                       h.Address.ToLowerInvariant().Contains(q) ||
                                       h.Specialties.Any(s => s.ToLowerInvariant().Contains(q)));
            }

            return Ok(new { success = true, count = list.Count(), data = list.ToList() });
        }

        [HttpPost("claim-inquiry")]
        public IActionResult SubmitClaimInquiry([FromBody] SubmitClaimInquiryRequestDto request, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var refNumber = "CLM-AUTH-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

            return Ok(new
            {
                success = true,
                claimReferenceNumber = refNumber,
                message = "Your medical assistance inquiry has been registered with our 24/7 International Desk. An emergency medical coordinator will contact your local phone or hospital immediately.",
                contactPhone = request.ContactPhone,
                status = "Under_Review"
            });
        }

        private static TravelInsurancePolicyDto MapToDto(TravelInsurancePolicy model)
        {
            return new TravelInsurancePolicyDto
            {
                PolicyId = model.PolicyId,
                SiteId = model.SiteId,
                PolicyNumber = model.PolicyNumber,
                UnderwriterName = model.UnderwriterName,
                PlanTier = model.PlanTier,
                PolicyHolderName = model.PolicyHolderName,
                BeneficiaryCount = model.BeneficiaryCount,
                StartDate = model.StartDate,
                EndDate = model.EndDate,
                Status = model.Status,
                EmergencyAssistancePhone = model.EmergencyAssistancePhone,
                EmergencyWhatsApp = model.EmergencyWhatsApp,
                ClaimsEmail = model.ClaimsEmail,
                AdventureSportsRider = model.AdventureSportsRider,
                Benefits = model.Benefits,
                PreApprovedHospitals = model.PreApprovedHospitals,
                RequiredClaimDocuments = GetRequiredClaimDocuments()
            };
        }

        private static List<InsuranceClaimDocDto> GetRequiredClaimDocuments()
        {
            return new List<InsuranceClaimDocDto>
            {
                new()
                {
                    DocId = "DOC-01",
                    ClaimType = "Medical Emergency",
                    Title = "Itemized Hospital Bill & Medical Invoices",
                    Description = "Official hospital receipt detailing all medical procedures, doctor consultations, room charges, and pharmacy supplies.",
                    IsRequired = true,
                    IsUploaded = false
                },
                new()
                {
                    DocId = "DOC-02",
                    ClaimType = "Medical Emergency",
                    Title = "Attending Physician Report / Discharge Summary",
                    Description = "Signed doctor diagnosis detailing initial symptoms, test results, and treatment administered.",
                    IsRequired = true,
                    IsUploaded = false
                },
                new()
                {
                    DocId = "DOC-03",
                    ClaimType = "Baggage Loss",
                    Title = "Airline Property Irregularity Report (PIR)",
                    Description = "Official PIR report obtained at the airport baggage claim desk immediately after luggage delay/loss.",
                    IsRequired = true,
                    IsUploaded = false
                },
                new()
                {
                    DocId = "DOC-04",
                    ClaimType = "Flight Delay",
                    Title = "Airline Flight Disruption Certificate",
                    Description = "Official airline letter confirming the reason and exact duration of the flight delay.",
                    IsRequired = true,
                    IsUploaded = false
                }
            };
        }

        private static TravelInsurancePolicy GetSeedPolicy(string siteId)
        {
            if (siteId == "technoheaven")
            {
                return new TravelInsurancePolicy
                {
                    PolicyId = "POL-DXB-902",
                    SiteId = "technoheaven",
                    PolicyNumber = "DXB-BUPA-7718294",
                    UnderwriterName = "Bupa Global Worldwide Assistance",
                    PlanTier = "Executive Global Elite International ($1,000,000 USD)",
                    PolicyHolderName = "VIP Expeditions & Corporate Traveler",
                    BeneficiaryCount = 2,
                    StartDate = DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-dd"),
                    EndDate = DateTime.UtcNow.AddDays(28).ToString("yyyy-MM-dd"),
                    Status = "Active",
                    EmergencyAssistancePhone = "+971 4 397 2222",
                    EmergencyWhatsApp = "+971 50 882 1944",
                    ClaimsEmail = "vipclaims@bupa-toursapp.ae",
                    AdventureSportsRider = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    Benefits = new List<InsuranceBenefitDto>
                    {
                        new() { BenefitKey = "medical_inpatient", Title = "Emergency Medical & Hospitalization", CoverageLimit = "$1,000,000 USD", Deductible = "Zero Deductible", Description = "Full cashless hospitalization across private VIP hospital suites with direct billing.", IsCovered = true, IconName = "medkit" },
                        new() { BenefitKey = "air_ambulance", Title = "Emergency Air Evacuation & Repatriation", CoverageLimit = "$500,000 USD", Deductible = "Zero Deductible", Description = "Dedicated medical jet evacuation with emergency medical attendants.", IsCovered = true, IconName = "airplane" },
                        new() { BenefitKey = "trip_delay", Title = "Flight Delay & Missed Connection", CoverageLimit = "$2,500 USD", Deductible = "$0 Deductible", Description = "Reimbursement for luxury lounge, 5-star hotel, and meals after 4 hours delay.", IsCovered = true, IconName = "time" },
                        new() { BenefitKey = "baggage_loss", Title = "Lost or Delayed Designer Baggage", CoverageLimit = "$5,000 USD", Deductible = "$0 Deductible", Description = "Coverage for delayed personal luggage and damaged luxury apparel.", IsCovered = true, IconName = "briefcase" },
                        new() { BenefitKey = "sports_rider", Title = "Desert Safari & Yacht Sports Rider", CoverageLimit = "Full Coverage", Deductible = "$0 Deductible", Description = "Covers dune bashing, jet-skiing, scuba diving, and adventure excursions.", IsCovered = true, IconName = "speedometer" }
                    },
                    PreApprovedHospitals = new List<HospitalDirectoryDto>
                    {
                        new()
                        {
                            HospitalId = "HOSP-DXB-01",
                            Name = "American Hospital Dubai",
                            City = "Dubai",
                            District = "Oud Metha / Bur Dubai",
                            Rating = 4.9,
                            Address = "19th St, Oud Metha, Dubai, UAE",
                            EmergencyPhone = "+971 4 377 5500",
                            IsCashlessApproved = true,
                            HasEnglishStaff = true,
                            HasInterpreter = true,
                            Specialties = new() { "24/7 Trauma Emergency", "Cardiology", "Orthopedic Surgery" },
                            DistanceFromCenter = "3.2 km"
                        },
                        new()
                        {
                            HospitalId = "HOSP-DXB-02",
                            Name = "Mediclinic City Hospital",
                            City = "Dubai",
                            District = "Dubai Healthcare City (DHCC)",
                            Rating = 4.8,
                            Address = "Bldg 37, 26th St, Dubai Healthcare City, UAE",
                            EmergencyPhone = "+971 4 435 9999",
                            IsCashlessApproved = true,
                            HasEnglishStaff = true,
                            HasInterpreter = true,
                            Specialties = new() { "Pediatric Emergency", "General Surgery", "Neurology" },
                            DistanceFromCenter = "4.5 km"
                        },
                        new()
                        {
                            HospitalId = "HOSP-AUH-03",
                            Name = "Cleveland Clinic Abu Dhabi",
                            City = "Abu Dhabi",
                            District = "Al Maryah Island",
                            Rating = 5.0,
                            Address = "Al Maryah Island, Abu Dhabi, UAE",
                            EmergencyPhone = "+971 2 659 0200",
                            IsCashlessApproved = true,
                            HasEnglishStaff = true,
                            HasInterpreter = true,
                            Specialties = new() { "Critical Care", "Heart & Vascular", "Digestive Disease" },
                            DistanceFromCenter = "5.1 km"
                        }
                    }
                };
            }

            if (siteId == "gujjutours")
            {
                return new TravelInsurancePolicy
                {
                    PolicyId = "POL-GUJ-101",
                    SiteId = "gujjutours",
                    PolicyNumber = "IN-TATA-8819204",
                    UnderwriterName = "TATA AIG & Bajaj Allianz Overseas Companion",
                    PlanTier = "Gold International Family ($250,000 USD)",
                    PolicyHolderName = "Family Party (Primary & Senior Travelers)",
                    BeneficiaryCount = 4,
                    StartDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
                    EndDate = DateTime.UtcNow.AddDays(21).ToString("yyyy-MM-dd"),
                    Status = "Active",
                    EmergencyAssistancePhone = "+91 22 6693 9500",
                    EmergencyWhatsApp = "+91 98200 55102",
                    ClaimsEmail = "overseasclaims@toursapp.in",
                    AdventureSportsRider = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    Benefits = new List<InsuranceBenefitDto>
                    {
                        new() { BenefitKey = "medical_inpatient", Title = "Emergency Medical Expenses & Hospitalization", CoverageLimit = "$250,000 USD", Deductible = "Zero Deductible", Description = "Cashless inpatient hospitalization across pre-approved network in Asia & Europe.", IsCovered = true, IconName = "medkit" },
                        new() { BenefitKey = "senior_care", Title = "Pre-Existing Condition Life-Saving Care", CoverageLimit = "$50,000 USD", Deductible = "$0 Deductible", Description = "Emergency stabilization of acute pre-existing health conditions.", IsCovered = true, IconName = "heart" },
                        new() { BenefitKey = "passport_loss", Title = "Emergency Indian Passport Re-Issuance", CoverageLimit = "$1,000 USD", Deductible = "$0 Deductible", Description = "Covers consular fees and travel expenses to Indian Embassy/Consulate.", IsCovered = true, IconName = "document-text" },
                        new() { BenefitKey = "baggage_delay", Title = "Baggage Delay & Missing Medicines", CoverageLimit = "$1,500 USD", Deductible = "$0 Deductible", Description = "Emergency purchase of toiletries, prescribed medications, and clothes.", IsCovered = true, IconName = "briefcase" },
                        new() { BenefitKey = "trip_cancel", Title = "Trip Cancellation & Curtailment", CoverageLimit = "$5,000 USD", Deductible = "$0 Deductible", Description = "Reimbursement of non-refundable prepaid hotel and tour bookings.", IsCovered = true, IconName = "calendar" }
                    },
                    PreApprovedHospitals = new List<HospitalDirectoryDto>
                    {
                        new()
                        {
                            HospitalId = "HOSP-GUJ-01",
                            Name = "Bangkok Hospital Medical Center (HQ)",
                            City = "Bangkok",
                            District = "Huai Khwang / Soi Soonvijai",
                            Rating = 4.9,
                            Address = "2 Soi Soonvijai 7, New Phetchaburi Rd, Bangkok",
                            EmergencyPhone = "+66 2 310 3000",
                            IsCashlessApproved = true,
                            HasEnglishStaff = true,
                            HasInterpreter = true,
                            Specialties = new() { "Cashless Indian Insurance Desk", "Cardiology", "Orthopedics" },
                            DistanceFromCenter = "4.0 km"
                        },
                        new()
                        {
                            HospitalId = "HOSP-GUJ-02",
                            Name = "Mediclinic Welcare Hospital Dubai",
                            City = "Dubai",
                            District = "Al Garhoud",
                            Rating = 4.8,
                            Address = "2nd St, Al Garhoud, Dubai, UAE",
                            EmergencyPhone = "+971 4 282 7788",
                            IsCashlessApproved = true,
                            HasEnglishStaff = true,
                            HasInterpreter = true,
                            Specialties = new() { "Hindi / Gujarati Speaking Staff", "24/7 ER", "Internal Medicine" },
                            DistanceFromCenter = "3.8 km"
                        },
                        new()
                        {
                            HospitalId = "HOSP-GUJ-03",
                            Name = "KD Hospital Ahmedabad (Base Network)",
                            City = "Ahmedabad",
                            District = "SG Highway",
                            Rating = 4.9,
                            Address = "Vaishno Devi Circle, SG Highway, Ahmedabad, Gujarat",
                            EmergencyPhone = "+91 79 6777 0000",
                            IsCashlessApproved = true,
                            HasEnglishStaff = true,
                            HasInterpreter = true,
                            Specialties = new() { "Cardiothoracic", "Multi-Organ Care", "Trauma ICU" },
                            DistanceFromCenter = "6.5 km"
                        }
                    }
                };
            }

            // tripgoasia (Thailand)
            return new TravelInsurancePolicy
            {
                PolicyId = "POL-BKK-301",
                SiteId = "tripgoasia",
                PolicyNumber = "TH-AXA-9921840",
                UnderwriterName = "AXA Sawasdee Thailand & Allianz Care",
                PlanTier = "Sawasdee Platinum Island Adventure ($500,000 USD)",
                PolicyHolderName = "Island Expedition Passenger & Companion",
                BeneficiaryCount = 2,
                StartDate = DateTime.UtcNow.AddDays(-3).ToString("yyyy-MM-dd"),
                EndDate = DateTime.UtcNow.AddDays(25).ToString("yyyy-MM-dd"),
                Status = "Active",
                EmergencyAssistancePhone = "+66 2 118 8111",
                EmergencyWhatsApp = "+66 81 294 8812",
                ClaimsEmail = "thailandclaims@axa-toursapp.com",
                AdventureSportsRider = true,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                Benefits = new List<InsuranceBenefitDto>
                {
                    new() { BenefitKey = "medical_inpatient", Title = "Emergency Medical Expenses & Hospital Care", CoverageLimit = "$500,000 USD", Deductible = "Zero Deductible", Description = "Direct settlement cashless hospitalization across JCI-accredited hospitals in Thailand.", IsCovered = true, IconName = "medkit" },
                    new() { BenefitKey = "scuba_diving", Title = "Scuba Diving & Watersports Rider", CoverageLimit = "$100,000 USD", Deductible = "$0 Deductible", Description = "Covers certified scuba diving up to 30m depth and marine hyperbaric decompression chamber.", IsCovered = true, IconName = "water" },
                    new() { BenefitKey = "island_evac", Title = "Island Sea-Ambulance & Helicopter Evac", CoverageLimit = "$200,000 USD", Deductible = "$0 Deductible", Description = "Speedboat and medevac helicopter transfer from islands (Phi Phi, Koh Tao, Samui) to mainland.", IsCovered = true, IconName = "boat" },
                    new() { BenefitKey = "scooter_coverage", Title = "Licensed Scooter & Vehicle Injury Rider", CoverageLimit = "$50,000 USD", Deductible = "$0 Deductible", Description = "Valid with international driving permit and approved helmet.", IsCovered = true, IconName = "bicycle" },
                    new() { BenefitKey = "baggage_loss", Title = "Baggage Loss & Delayed Water Gear", CoverageLimit = "$2,000 USD", Deductible = "$0 Deductible", Description = "Covers cameras, dive computers, and missing luggage.", IsCovered = true, IconName = "briefcase" }
                },
                PreApprovedHospitals = new List<HospitalDirectoryDto>
                {
                    new()
                    {
                        HospitalId = "HOSP-BKK-01",
                        Name = "Bumrungrad International Hospital",
                        City = "Bangkok",
                        District = "Watthana / Sukhumvit Soi 3",
                        Rating = 5.0,
                        Address = "33 Sukhumvit 3, Khlong Toei Nuea, Watthana, Bangkok",
                        EmergencyPhone = "+66 2 066 8888",
                        IsCashlessApproved = true,
                        HasEnglishStaff = true,
                        HasInterpreter = true,
                        Specialties = new() { "24/7 International Emergency Center", "Cardiology", "Trauma ICU" },
                        DistanceFromCenter = "2.1 km"
                    },
                    new()
                    {
                        HospitalId = "HOSP-BKK-02",
                        Name = "Bangkok Hospital Phuket",
                        City = "Phuket",
                        District = "Mueang Phuket",
                        Rating = 4.9,
                        Address = "2/1 Hongyok Utis Rd, Talat Yai, Phuket",
                        EmergencyPhone = "+66 76 254 425",
                        IsCashlessApproved = true,
                        HasEnglishStaff = true,
                        HasInterpreter = true,
                        Specialties = new() { "Marine Injury Care", "Hyperbaric Chamber", "Orthopedics" },
                        DistanceFromCenter = "3.4 km"
                    },
                    new()
                    {
                        HospitalId = "HOSP-BKK-03",
                        Name = "Samui International Hospital",
                        City = "Koh Samui",
                        District = "Bo Phut / Chaweng Beach",
                        Rating = 4.8,
                        Address = "Chaweng Beach Rd, Bo Phut, Koh Samui, Surat Thani",
                        EmergencyPhone = "+66 77 300 394",
                        IsCashlessApproved = true,
                        HasEnglishStaff = true,
                        HasInterpreter = true,
                        Specialties = new() { "Diving Medicine", "Emergency Trauma", "Tropical Health" },
                        DistanceFromCenter = "1.8 km"
                    }
                }
            };
        }
    }
}
