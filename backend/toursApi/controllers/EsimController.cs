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
    [Route("api/esim")]
    public class EsimController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<EsimController> _logger;

        public EsimController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<EsimController> logger)
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
        public async Task<IActionResult> GetEsimHub([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            ActiveEsimProfile? profile = null;

            try
            {
                var db = _dbProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<ActiveEsimProfile>("active_esim_profiles");

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                profile = await collection.Find(x => x.SiteId == resolvedSite)
                                          .SortByDescending(x => x.CreatedAt)
                                          .FirstOrDefaultAsync(cts.Token);

                if (profile == null)
                {
                    profile = GetSeedProfile(resolvedSite);
                    using var insertCts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                    await collection.InsertOneAsync(profile, null, insertCts.Token);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[EsimController] Non-fatal Mongo fetch exception: {Message}", ex.Message);
                profile ??= GetSeedProfile(resolvedSite);
            }

            var response = new EsimHubResponseDto
            {
                SiteId = resolvedSite,
                ActiveProfile = profile != null ? MapToDto(profile) : null,
                Packages = GetPackagesForSite(resolvedSite),
                WifiGuides = GetAirportWifiGuides(resolvedSite),
                EmergencyUssdCodes = GetEmergencyUssdCodes(resolvedSite)
            };

            return Ok(new { success = true, data = response });
        }

        [HttpPost("activate")]
        public async Task<IActionResult> ActivateEsim([FromBody] ActivateEsimRequestDto request, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var packages = GetPackagesForSite(resolvedSite);
            var pkg = packages.FirstOrDefault(p => p.PackageId == request.PackageId) ?? packages.First();

            var profile = new ActiveEsimProfile
            {
                ProfileId = "ESIM-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant(),
                SiteId = resolvedSite,
                Iccid = "890141032" + new Random().Next(10000000, 99999999).ToString(),
                PackageTitle = pkg.Title,
                DestinationName = pkg.DestinationName,
                QrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=LPA:1$smdp.toursapp.io$ACT-" + Guid.NewGuid().ToString("N")[..12].ToUpperInvariant(),
                SmdpAddress = "smdp.toursapp.io",
                ActivationCode = "ACT-" + Guid.NewGuid().ToString("N")[..12].ToUpperInvariant(),
                Status = "Active",
                TotalDataGb = pkg.DataAllowanceGb,
                UsedDataGb = 0.1,
                ExpiryDate = DateTime.UtcNow.AddDays(pkg.ValidityDays).ToString("yyyy-MM-dd"),
                DaysRemaining = pkg.ValidityDays,
                CarrierName = pkg.CarrierPartners.FirstOrDefault() ?? "5G Roaming Partner",
                ApnSetting = "internet",
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                var db = _dbProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<ActiveEsimProfile>("active_esim_profiles");
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                await collection.InsertOneAsync(profile, null, cts.Token);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[EsimController] Could not persist eSIM profile: {Message}", ex.Message);
            }

            return Ok(new { success = true, data = MapToDto(profile) });
        }

        [HttpPost("topup")]
        public async Task<IActionResult> TopUpData([FromBody] TopUpDataRequestDto request, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var additionalGb = request.AdditionalGb > 0 ? request.AdditionalGb : 3.0;

            try
            {
                var db = _dbProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<ActiveEsimProfile>("active_esim_profiles");
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));

                var filter = Builders<ActiveEsimProfile>.Filter.And(
                    Builders<ActiveEsimProfile>.Filter.Eq(x => x.SiteId, resolvedSite),
                    Builders<ActiveEsimProfile>.Filter.Eq(x => x.Status, "Active")
                );

                var updateDef = Builders<ActiveEsimProfile>.Update
                    .Inc(x => x.TotalDataGb, additionalGb);

                var updated = await collection.FindOneAndUpdateAsync(filter, updateDef, new FindOneAndUpdateOptions<ActiveEsimProfile>
                {
                    ReturnDocument = ReturnDocument.After
                }, cts.Token);

                if (updated != null)
                {
                    return Ok(new { success = true, data = MapToDto(updated) });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[EsimController] Error topping up eSIM: {Message}", ex.Message);
            }

            return Ok(new
            {
                success = true,
                data = new ActiveEsimProfileDto
                {
                    ProfileId = request.ProfileId,
                    SiteId = resolvedSite,
                    TotalDataGb = 18.0,
                    UsedDataGb = 4.2,
                    RemainingDataGb = 13.8,
                    Status = "Active"
                }
            });
        }

        private static ActiveEsimProfileDto MapToDto(ActiveEsimProfile model)
        {
            var remaining = Math.Max(0, Math.Round(model.TotalDataGb - model.UsedDataGb, 1));
            return new ActiveEsimProfileDto
            {
                ProfileId = model.ProfileId,
                SiteId = model.SiteId,
                Iccid = model.Iccid,
                PackageTitle = model.PackageTitle,
                DestinationName = model.DestinationName,
                QrCodeUrl = model.QrCodeUrl,
                SmdpAddress = model.SmdpAddress,
                ActivationCode = model.ActivationCode,
                Status = model.Status,
                TotalDataGb = model.TotalDataGb,
                UsedDataGb = model.UsedDataGb,
                RemainingDataGb = remaining,
                ExpiryDate = model.ExpiryDate,
                DaysRemaining = model.DaysRemaining,
                CarrierName = model.CarrierName,
                ApnSetting = model.ApnSetting,
                RoamingEnabled = true
            };
        }

        private static ActiveEsimProfile GetSeedProfile(string siteId)
        {
            if (siteId == "technoheaven")
            {
                return new ActiveEsimProfile
                {
                    ProfileId = "ESIM-DXB-901",
                    SiteId = "technoheaven",
                    Iccid = "8997103299104821",
                    PackageTitle = "UAE 14-Day 30GB 5G + Unlimited Social Pass",
                    DestinationName = "United Arab Emirates",
                    QrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=LPA:1$smdp.toursapp.io$ACT-DXB-9912048",
                    SmdpAddress = "smdp.toursapp.io",
                    ActivationCode = "ACT-DXB-9912048",
                    Status = "Active",
                    TotalDataGb = 30.0,
                    UsedDataGb = 6.4,
                    ExpiryDate = DateTime.UtcNow.AddDays(10).ToString("yyyy-MM-dd"),
                    DaysRemaining = 10,
                    CarrierName = "du 5G & e& UAE",
                    ApnSetting = "du",
                    CreatedAt = DateTime.UtcNow.AddDays(-4)
                };
            }

            if (siteId == "gujjutours")
            {
                return new ActiveEsimProfile
                {
                    ProfileId = "ESIM-GUJ-101",
                    SiteId = "gujjutours",
                    Iccid = "8991038192847192",
                    PackageTitle = "India-to-Thailand 10-Day 20GB 5G + WhatsApp Calling",
                    DestinationName = "Thailand & Southeast Asia",
                    QrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=LPA:1$smdp.toursapp.io$ACT-GUJ-8812941",
                    SmdpAddress = "smdp.toursapp.io",
                    ActivationCode = "ACT-GUJ-8812941",
                    Status = "Active",
                    TotalDataGb = 20.0,
                    UsedDataGb = 5.8,
                    ExpiryDate = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd"),
                    DaysRemaining = 7,
                    CarrierName = "AIS 5G Roaming",
                    ApnSetting = "internet",
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                };
            }

            // tripgoasia (Thailand)
            return new ActiveEsimProfile
            {
                ProfileId = "ESIM-BKK-801",
                SiteId = "tripgoasia",
                Iccid = "8966031920194821",
                PackageTitle = "Thailand 15-Day 50GB 5G + 100 Mins Calls (AIS)",
                DestinationName = "Thailand",
                QrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=LPA:1$smdp.toursapp.io$ACT-BKK-7741029",
                SmdpAddress = "smdp.toursapp.io",
                ActivationCode = "ACT-BKK-7741029",
                Status = "Active",
                TotalDataGb = 50.0,
                UsedDataGb = 12.3,
                ExpiryDate = DateTime.UtcNow.AddDays(11).ToString("yyyy-MM-dd"),
                DaysRemaining = 11,
                CarrierName = "AIS 5G Network",
                ApnSetting = "internet",
                CreatedAt = DateTime.UtcNow.AddDays(-4)
            };
        }

        private static List<EsimPackageDto> GetPackagesForSite(string siteId)
        {
            if (siteId == "technoheaven")
            {
                return new List<EsimPackageDto>
                {
                    new()
                    {
                        PackageId = "PKG-UAE-7D",
                        SiteId = "technoheaven",
                        Title = "UAE 7-Day 10GB 5G Lite Pass",
                        CountryCode = "AE",
                        DestinationName = "United Arab Emirates",
                        DataAllowanceGb = 10.0,
                        ValidityDays = 7,
                        Price = 19.99,
                        Currency = "USD",
                        NetworkType = "5G / 4G LTE",
                        CarrierPartners = new() { "du 5G", "e& (Etisalat)" },
                        SupportsHotspot = true,
                        IncludesLocalCalls = false,
                        IsPopular = false
                    },
                    new()
                    {
                        PackageId = "PKG-UAE-14D",
                        SiteId = "technoheaven",
                        Title = "UAE 14-Day 30GB 5G + Unlimited Social Pass",
                        CountryCode = "AE",
                        DestinationName = "United Arab Emirates",
                        DataAllowanceGb = 30.0,
                        ValidityDays = 14,
                        Price = 29.99,
                        Currency = "USD",
                        NetworkType = "5G Ultra-Fast",
                        CarrierPartners = new() { "du 5G", "e& (Etisalat)" },
                        SupportsHotspot = true,
                        IncludesLocalCalls = true,
                        CallMinutes = 60,
                        IsPopular = true
                    },
                    new()
                    {
                        PackageId = "PKG-GCC-15D",
                        SiteId = "technoheaven",
                        Title = "GCC 15-Day 25GB Multi-Country (UAE/KSA/Oman/Qatar)",
                        CountryCode = "GCC",
                        DestinationName = "Gulf Cooperation Council",
                        DataAllowanceGb = 25.0,
                        ValidityDays = 15,
                        Price = 39.99,
                        Currency = "USD",
                        NetworkType = "5G Cross-Border",
                        CarrierPartners = new() { "du", "STC", "Ooredoo" },
                        SupportsHotspot = true,
                        IncludesLocalCalls = false,
                        IsPopular = false
                    }
                };
            }

            if (siteId == "gujjutours")
            {
                return new List<EsimPackageDto>
                {
                    new()
                    {
                        PackageId = "PKG-GUJ-THAI",
                        SiteId = "gujjutours",
                        Title = "Thailand Expedition 10-Day 20GB 5G + Free WhatsApp",
                        CountryCode = "TH",
                        DestinationName = "Thailand",
                        DataAllowanceGb = 20.0,
                        ValidityDays = 10,
                        Price = 11.99,
                        Currency = "USD",
                        NetworkType = "5G High Speed",
                        CarrierPartners = new() { "AIS 5G", "TrueMove H" },
                        SupportsHotspot = true,
                        IncludesLocalCalls = true,
                        CallMinutes = 30,
                        IsPopular = true
                    },
                    new()
                    {
                        PackageId = "PKG-GUJ-DXB",
                        SiteId = "gujjutours",
                        Title = "Dubai Shopper 7-Day 15GB 5G + UAE Calling",
                        CountryCode = "AE",
                        DestinationName = "United Arab Emirates",
                        DataAllowanceGb = 15.0,
                        ValidityDays = 7,
                        Price = 18.99,
                        Currency = "USD",
                        NetworkType = "5G Lightning",
                        CarrierPartners = new() { "du 5G", "e&" },
                        SupportsHotspot = true,
                        IncludesLocalCalls = true,
                        CallMinutes = 50,
                        IsPopular = false
                    },
                    new()
                    {
                        PackageId = "PKG-GUJ-GLOBAL",
                        SiteId = "gujjutours",
                        Title = "Global Explorer 30-Day 15GB (80+ Countries)",
                        CountryCode = "GLOBAL",
                        DestinationName = "Worldwide Multi-Destination",
                        DataAllowanceGb = 15.0,
                        ValidityDays = 30,
                        Price = 34.99,
                        Currency = "USD",
                        NetworkType = "4G / 5G Global",
                        CarrierPartners = new() { "Airtel World", "Vodafone", "AIS" },
                        SupportsHotspot = true,
                        IncludesLocalCalls = false,
                        IsPopular = false
                    }
                };
            }

            // tripgoasia
            return new List<EsimPackageDto>
            {
                new()
                {
                    PackageId = "PKG-TH-8D",
                    SiteId = "tripgoasia",
                    Title = "Thailand 8-Day 15GB 5G Tourist SIM",
                    CountryCode = "TH",
                    DestinationName = "Thailand",
                    DataAllowanceGb = 15.0,
                    ValidityDays = 8,
                    Price = 9.99,
                    Currency = "USD",
                    NetworkType = "5G / 4G LTE",
                    CarrierPartners = new() { "AIS 5G", "dtac" },
                    SupportsHotspot = true,
                    IncludesLocalCalls = false,
                    IsPopular = false
                },
                new()
                {
                    PackageId = "PKG-TH-15D",
                    SiteId = "tripgoasia",
                    Title = "Thailand 15-Day 50GB 5G + 100 Mins Local Calls",
                    CountryCode = "TH",
                    DestinationName = "Thailand",
                    DataAllowanceGb = 50.0,
                    ValidityDays = 15,
                    Price = 14.99,
                    Currency = "USD",
                    NetworkType = "5G Ultra-Fast",
                    CarrierPartners = new() { "AIS 5G", "True 5G" },
                    SupportsHotspot = true,
                    IncludesLocalCalls = true,
                    CallMinutes = 100,
                    IsPopular = true
                },
                new()
                {
                    PackageId = "PKG-SEA-30D",
                    SiteId = "tripgoasia",
                    Title = "Southeast Asia 30-Day 25GB (TH/MY/SG/VN/ID)",
                    CountryCode = "SEA",
                    DestinationName = "Southeast Asia Regional",
                    DataAllowanceGb = 25.0,
                    ValidityDays = 30,
                    Price = 24.99,
                    Currency = "USD",
                    NetworkType = "5G Multi-Carrier",
                    CarrierPartners = new() { "Singtel", "AIS", "Maxis", "Telkomsel" },
                    SupportsHotspot = true,
                    IncludesLocalCalls = false,
                    IsPopular = false
                }
            };
        }

        private static List<AirportWifiGuideDto> GetAirportWifiGuides(string siteId)
        {
            return new List<AirportWifiGuideDto>
            {
                new()
                {
                    AirportCode = "BKK",
                    AirportName = "Bangkok Suvarnabhumi (BKK)",
                    Ssid = ".@AirportTrueFreeWiFi",
                    LoginSteps = "Select SSID in device Wi-Fi list, tap 'Guest Login', enter passport number and name to enjoy 2 hours free high-speed 50 Mbps internet.",
                    TimeLimit = "2 Hours (Renewable)",
                    SpeedTier = "50 Mbps (5 GHz)",
                    HelpDeskLocation = "Main Concourse D & 2nd Floor Arrivals"
                },
                new()
                {
                    AirportCode = "DMK",
                    AirportName = "Bangkok Don Mueang (DMK)",
                    Ssid = ".@AirportAISFreeWiFi",
                    LoginSteps = "Select SSID, accept terms and conditions on captive portal. Valid throughout Terminal 1 & 2.",
                    TimeLimit = "2 Hours",
                    SpeedTier = "30 Mbps",
                    HelpDeskLocation = "Terminal 1 Level 3 near Check-in Row 1"
                },
                new()
                {
                    AirportCode = "DXB",
                    AirportName = "Dubai International (DXB)",
                    Ssid = "DXB Free WiFi",
                    LoginSteps = "Single-tap connection on browser prompt. Unlimited free access throughout Terminals 1, 2, and 3 without registration.",
                    TimeLimit = "Unlimited",
                    SpeedTier = "100 Mbps (Gigabit Wi-Fi)",
                    HelpDeskLocation = "Information Desks at Gate B26 & Concourse A"
                },
                new()
                {
                    AirportCode = "AMD",
                    AirportName = "Ahmedabad SVPIA Airport (AMD)",
                    Ssid = "SVPIA Free WiFi",
                    LoginSteps = "Connect to Wi-Fi, enter mobile number to receive OTP SMS (or collect Wi-Fi coupon voucher from Information Desk with passport).",
                    TimeLimit = "45 Minutes",
                    SpeedTier = "25 Mbps",
                    HelpDeskLocation = "Terminal 2 International Arrivals Baggage Hall"
                }
            };
        }

        private static Dictionary<string, string> GetEmergencyUssdCodes(string siteId)
        {
            if (siteId == "technoheaven")
            {
                return new Dictionary<string, string>
                {
                    { "du Balance Check", "*135#" },
                    { "du Data Balance", "*135*0#" },
                    { "Etisalat Balance", "*121#" },
                    { "Etisalat Data Pack", "*170#" },
                    { "UAE Police Emergency", "999" },
                    { "UAE Tourist Police", "901" }
                };
            }

            if (siteId == "gujjutours")
            {
                return new Dictionary<string, string>
                {
                    { "AIS Balance (Thailand)", "*121#" },
                    { "AIS Data Balance", "*121*3#" },
                    { "du Balance (Dubai)", "*135#" },
                    { "Airtel Balance (India)", "*123#" },
                    { "Indian Embassy Bangkok", "+66 2 258 0300" },
                    { "Indian Consulate Dubai", "+971 4 397 1222" }
                };
            }

            // tripgoasia
            return new Dictionary<string, string>
            {
                { "AIS Balance Check", "*121#" },
                { "AIS Data Remaining", "*121*3#" },
                { "TrueMove H Balance", "#123#" },
                { "dtac Balance", "*101*9#" },
                { "Tourist Police (Thailand)", "1155" },
                { "Emergency Medical SOS", "1669" }
            };
        }
    }
}
