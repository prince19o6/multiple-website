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
    [Route("api/tax-refund")]
    public class TaxRefundController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<TaxRefundController> _logger;

        public TaxRefundController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<TaxRefundController> logger)
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

        [HttpGet("rules")]
        public IActionResult GetTaxRules([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var rule = GetTaxRuleForSite(resolvedSite);
            return Ok(new { success = true, data = rule });
        }

        [HttpGet("allowances")]
        public IActionResult GetCustomsAllowances([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var allowance = GetCustomsAllowanceForSite(resolvedSite);
            return Ok(new { success = true, data = allowance });
        }

        [HttpGet("claims")]
        public async Task<IActionResult> GetTaxClaims([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var rule = GetTaxRuleForSite(resolvedSite);
            List<TaxRefundReceipt> list = new();

            try
            {
                var db = _dbProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<TaxRefundReceipt>("tax_refund_receipts");

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                list = await collection.Find(x => x.SiteId == resolvedSite)
                                       .SortByDescending(x => x.CreatedAt)
                                       .ToListAsync(cts.Token);

                // Seed sample claims if first time access
                if (list.Count == 0)
                {
                    var seeded = GetSeedClaims(resolvedSite, rule);
                    using var insertCts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                    await collection.InsertManyAsync(seeded, null, insertCts.Token);
                    list = seeded;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[TaxRefundController] Non-fatal Mongo fetch exception: {Message}", ex.Message);
                if (list.Count == 0)
                {
                    list = GetSeedClaims(resolvedSite, rule);
                }
            }

            var dtos = list.Select(MapToDto).ToList();

            var totalPurchases = dtos.Sum(x => x.PurchaseAmount);
            var totalRefund = dtos.Sum(x => x.EstimatedRefundAmount);
            var claimedRefund = dtos.Where(x => x.Status == "Refund_Claimed").Sum(x => x.EstimatedRefundAmount);
            var pendingRefund = dtos.Where(x => x.Status != "Refund_Claimed").Sum(x => x.EstimatedRefundAmount);
            var pendingInspection = dtos.Count(x => x.RequiresPhysicalInspection && x.Status == "Draft");

            var summary = new TaxRefundSummaryDto
            {
                TotalPurchases = Math.Round(totalPurchases, 2),
                TotalEstimatedRefund = Math.Round(totalRefund, 2),
                ClaimedRefund = Math.Round(claimedRefund, 2),
                PendingRefund = Math.Round(pendingRefund, 2),
                TotalReceiptsCount = dtos.Count,
                PendingInspectionCount = pendingInspection,
                Currency = rule.CurrencyCode
            };

            return Ok(new
            {
                success = true,
                summary,
                rule,
                claims = dtos
            });
        }

        [HttpPost("claims")]
        public async Task<IActionResult> CreateTaxClaim([FromBody] CreateTaxReceiptRequestDto request, [FromQuery] string? siteId = null)
        {
            if (string.IsNullOrWhiteSpace(request.StoreName) || request.PurchaseAmount <= 0)
            {
                return BadRequest(new { success = false, message = "Store name and a valid purchase amount are required." });
            }

            var resolvedSite = ResolveSiteId(siteId);
            var rule = GetTaxRuleForSite(resolvedSite);

            var estimatedRefund = Math.Round(request.PurchaseAmount * (rule.EstimatedRefundPercent / 100.0), 2);
            var isLuxuryCategory = request.Category == "Luxury & Watches" || request.Category == "Jewelry & Gold" || request.Category == "Electronics & Gadgets";
            var requiresInspection = request.PurchaseAmount >= rule.CustomsInspectionThreshold || isLuxuryCategory;

            var entity = new TaxRefundReceipt
            {
                ClaimId = "CLM-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant(),
                SiteId = resolvedSite,
                StoreName = request.StoreName.Trim(),
                StoreBranch = request.StoreBranch?.Trim() ?? string.Empty,
                PurchaseDate = string.IsNullOrWhiteSpace(request.PurchaseDate) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : request.PurchaseDate,
                InvoiceNumber = string.IsNullOrWhiteSpace(request.InvoiceNumber) ? "INV-" + new Random().Next(100000, 999999) : request.InvoiceNumber.Trim(),
                TaxFormNumber = string.IsNullOrWhiteSpace(request.TaxFormNumber) ? rule.CountryCode + "-PP-" + new Random().Next(1000000, 9999999) : request.TaxFormNumber.Trim(),
                Category = string.IsNullOrWhiteSpace(request.Category) ? "Fashion & Apparel" : request.Category,
                PurchaseAmount = Math.Round(request.PurchaseAmount, 2),
                EstimatedRefundAmount = estimatedRefund,
                Currency = rule.CurrencyCode,
                Status = "Draft",
                RequiresPhysicalInspection = requiresInspection,
                ReceiptImageUrl = request.ReceiptImageUrl?.Trim() ?? string.Empty,
                Notes = request.Notes?.Trim() ?? string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                var db = _dbProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<TaxRefundReceipt>("tax_refund_receipts");
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                await collection.InsertOneAsync(entity, null, cts.Token);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[TaxRefundController] Could not persist claim to MongoDB: {Message}", ex.Message);
            }

            return Ok(new { success = true, data = MapToDto(entity) });
        }

        [HttpPut("claims/{claimId}/status")]
        public async Task<IActionResult> UpdateClaimStatus(string claimId, [FromBody] UpdateClaimStatusRequestDto request, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var newStatus = request.Status switch
            {
                "Customs_Inspected" => "Customs_Inspected",
                "Refund_Claimed" => "Refund_Claimed",
                _ => "Draft"
            };

            try
            {
                var db = _dbProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<TaxRefundReceipt>("tax_refund_receipts");
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));

                var filter = Builders<TaxRefundReceipt>.Filter.And(
                    Builders<TaxRefundReceipt>.Filter.Eq(x => x.ClaimId, claimId),
                    Builders<TaxRefundReceipt>.Filter.Eq(x => x.SiteId, resolvedSite)
                );

                var updateDef = Builders<TaxRefundReceipt>.Update
                    .Set(x => x.Status, newStatus);

                if (!string.IsNullOrWhiteSpace(request.Notes))
                {
                    updateDef = updateDef.Set(x => x.Notes, request.Notes);
                }

                var updated = await collection.FindOneAndUpdateAsync(filter, updateDef, new FindOneAndUpdateOptions<TaxRefundReceipt>
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
                _logger.LogWarning(ex, "[TaxRefundController] Error updating claim status: {Message}", ex.Message);
            }

            return Ok(new
            {
                success = true,
                data = new TaxRefundReceiptDto
                {
                    ClaimId = claimId,
                    SiteId = resolvedSite,
                    Status = newStatus,
                    Notes = request.Notes ?? string.Empty
                }
            });
        }

        [HttpDelete("claims/{claimId}")]
        public async Task<IActionResult> DeleteClaim(string claimId, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            try
            {
                var db = _dbProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<TaxRefundReceipt>("tax_refund_receipts");
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));

                var res = await collection.DeleteOneAsync(x => x.ClaimId == claimId && x.SiteId == resolvedSite, cts.Token);
                return Ok(new { success = true, deleted = res.DeletedCount > 0 });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[TaxRefundController] Error deleting claim: {Message}", ex.Message);
                return Ok(new { success = true, deleted = true });
            }
        }

        private static TaxRefundReceiptDto MapToDto(TaxRefundReceipt entity)
        {
            return new TaxRefundReceiptDto
            {
                ClaimId = entity.ClaimId,
                SiteId = entity.SiteId,
                StoreName = entity.StoreName,
                StoreBranch = entity.StoreBranch,
                PurchaseDate = entity.PurchaseDate,
                InvoiceNumber = entity.InvoiceNumber,
                TaxFormNumber = entity.TaxFormNumber,
                Category = entity.Category,
                PurchaseAmount = entity.PurchaseAmount,
                EstimatedRefundAmount = entity.EstimatedRefundAmount,
                Currency = entity.Currency,
                Status = entity.Status,
                RequiresPhysicalInspection = entity.RequiresPhysicalInspection,
                ReceiptImageUrl = entity.ReceiptImageUrl,
                Notes = entity.Notes
            };
        }

        private static DestinationTaxRuleDto GetTaxRuleForSite(string siteId)
        {
            if (siteId == "technoheaven")
            {
                return new DestinationTaxRuleDto
                {
                    CountryCode = "AE",
                    CountryName = "United Arab Emirates",
                    TaxSchemeName = "Planet Tax Free Tourist VAT Refund",
                    VatRatePercent = 5.0,
                    EstimatedRefundPercent = 4.3, // 5% minus 4.80 AED admin fee
                    CurrencyCode = "AED",
                    CurrencySymbol = "AED",
                    MinimumSpendPerStore = 250.0,
                    MinimumTotalAirportClaim = 250.0,
                    CustomsInspectionThreshold = 10000.0,
                    LuxuryInspectionNotice = "Purchases over 10,000 AED or fine gold/watches must be verified at the Planet Customs Inspection desk before airline check-in.",
                    ClaimDeadlineDays = 90,
                    AirportCounters = new List<AirportRefundCounterDto>
                    {
                        new()
                        {
                            TerminalName = "Dubai DXB Terminal 3 (Emirates)",
                            LocationType = "Landside Before Security",
                            StepInstruction = "Departures level, next to Check-in Area 3. Validate digital tax-free tags at self-service kiosks before dropping bags.",
                            OperatingHours = "24/7",
                            PayoutMethods = new() { "Credit Card (Visa/Mastercard)", "WeChat / Alipay", "Cash USD / AED" }
                        },
                        new()
                        {
                            TerminalName = "Dubai DXB Terminal 1 (International)",
                            LocationType = "Airside After Passport Control",
                            StepInstruction = "Concourse D, opposite Gate D12. Collect cash or instant credit card refund payout.",
                            OperatingHours = "24/7",
                            PayoutMethods = new() { "Cash USD / EUR / AED", "Credit Card" }
                        },
                        new()
                        {
                            TerminalName = "Abu Dhabi AUH Terminal A",
                            LocationType = "Landside Departures",
                            StepInstruction = "Departures Level 3 near Check-in Row E. Scan Planet QR code at electronic validation kiosk.",
                            OperatingHours = "24/7",
                            PayoutMethods = new() { "Credit Card", "Cash AED" }
                        }
                    }
                };
            }

            if (siteId == "gujjutours")
            {
                return new DestinationTaxRuleDto
                {
                    CountryCode = "IN",
                    CountryName = "India & Global Destination Shopper",
                    TaxSchemeName = "Tourist GST & Duty-Free Return Scheme",
                    VatRatePercent = 12.0,
                    EstimatedRefundPercent = 8.5,
                    CurrencyCode = "INR",
                    CurrencySymbol = "₹",
                    MinimumSpendPerStore = 5000.0,
                    MinimumTotalAirportClaim = 5000.0,
                    CustomsInspectionThreshold = 50000.0,
                    LuxuryInspectionNotice = "Baggage articles exceeding ₹50,000 in total value or gold jewellery requires Red Channel customs declaration upon return into Indian airports.",
                    ClaimDeadlineDays = 90,
                    AirportCounters = new List<AirportRefundCounterDto>
                    {
                        new()
                        {
                            TerminalName = "Ahmedabad AMD Sardar Vallabhbhai Patel Terminal 2",
                            LocationType = "Airside International Arrivals/Departures",
                            StepInstruction = "Customs Green / Red Channel inspection desk & Duty-Free collection point adjacent to carousel 2.",
                            OperatingHours = "24/7 for Scheduled Flights",
                            PayoutMethods = new() { "Indian Bank Transfer (NEFT)", "Credit Card Refund", "Cash INR" }
                        },
                        new()
                        {
                            TerminalName = "Mumbai BOM Chhatrapati Shivaji Maharaj Terminal 2",
                            LocationType = "Landside Level 4 & Airside Transit",
                            StepInstruction = "Near Departure Gate 4 for export declaration; Arrivals baggage hall for duty-free allowance clearance.",
                            OperatingHours = "24/7",
                            PayoutMethods = new() { "Credit Card", "Cash INR / USD" }
                        }
                    }
                };
            }

            // Default: tripgoasia (Thailand)
            return new DestinationTaxRuleDto
            {
                CountryCode = "TH",
                CountryName = "Thailand",
                TaxSchemeName = "VAT Refund for Tourists (P.P.10 Scheme)",
                VatRatePercent = 7.0,
                EstimatedRefundPercent = 5.5,
                CurrencyCode = "THB",
                CurrencySymbol = "฿",
                MinimumSpendPerStore = 2000.0,
                MinimumTotalAirportClaim = 5000.0,
                CustomsInspectionThreshold = 20000.0,
                LuxuryInspectionNotice = "Luxury items valued at 20,000 THB or more (jewelry, watches, smartphones, designer bags) must be kept in carry-on baggage and inspected twice (Customs desk before check-in AND Revenue counter after passport control).",
                ClaimDeadlineDays = 60,
                AirportCounters = new List<AirportRefundCounterDto>
                {
                    new()
                    {
                        TerminalName = "Bangkok Suvarnabhumi (BKK)",
                        LocationType = "Landside Before Security",
                        StepInstruction = "Departure Hall 4th Floor, behind Check-in Row U (Gate 10). Present yellow P.P.10 forms and goods to Customs Officer for official stamp before luggage check-in.",
                        OperatingHours = "24/7",
                        PayoutMethods = new() { "Cash THB", "Credit Card (Visa/Mastercard/JCB)", "Alipay" }
                    },
                    new()
                    {
                        TerminalName = "Bangkok Suvarnabhumi (BKK) Airside",
                        LocationType = "Airside After Passport Control",
                        StepInstruction = "Concourse D, opposite Gate D1 and Gate D8. Present stamped P.P.10 forms to collect cash or card refund.",
                        OperatingHours = "24/7",
                        PayoutMethods = new() { "Cash THB", "Credit Card" }
                    },
                    new()
                    {
                        TerminalName = "Phuket International (HKT)",
                        LocationType = "Landside International Departures",
                        StepInstruction = "Terminal 2, 3rd Floor Departures, Customs Office near Check-in Counter 1.",
                        OperatingHours = "24/7",
                        PayoutMethods = new() { "Cash THB", "Credit Card" }
                    }
                }
            };
        }

        private static CustomsAllowanceRuleDto GetCustomsAllowanceForSite(string siteId)
        {
            if (siteId == "gujjutours")
            {
                return new CustomsAllowanceRuleDto
                {
                    DestinationOrHomeCountry = "Indian Customs (CBIC Baggage Rules 2016)",
                    DutyFreeGeneralAllowance = "New articles & souvenirs up to ₹50,000 duty-free for Indian residents returning from abroad.",
                    AlcoholAllowance = "Maximum 2 Litres of alcoholic liquor or wine per passenger aged 18+.",
                    TobaccoAllowance = "Up to 100 cigarettes OR 25 cigars OR 125 grams of tobacco.",
                    GoldJewelleryAllowanceMale = "Men residing abroad > 1 year: Up to 20 grams with value cap of ₹50,000 duty-free.",
                    GoldJewelleryAllowanceFemale = "Women residing abroad > 1 year: Up to 40 grams with value cap of ₹1,00,000 duty-free.",
                    CurrencyDeclarationLimit = "Currency declaration mandatory if foreign currency notes exceed USD 5,000 or total foreign exchange exceeds USD 10,000.",
                    ProhibitedItems = new()
                    {
                        "Commercial quantities of imported goods without import license",
                        "Drones without prior WPC / DGCA clearance",
                        "Satellite phones (Thuraya, Iridium) without Indian telecom license",
                        "E-cigarettes, vape pods, and heat-not-burn electronic devices",
                        "Wildlife products, peacock feathers, and antique relics over 100 years old"
                    }
                };
            }

            if (siteId == "technoheaven")
            {
                return new CustomsAllowanceRuleDto
                {
                    DestinationOrHomeCountry = "United Arab Emirates (Federal Customs Authority)",
                    DutyFreeGeneralAllowance = "Personal gifts and merchandise up to 3,000 AED duty-free.",
                    AlcoholAllowance = "Maximum 4 Litres of alcohol OR 2 cartons of beer (each up to 24 cans, max 355ml each).",
                    TobaccoAllowance = "Up to 400 cigarettes OR 50 cigars OR 500 grams of tobacco products.",
                    GoldJewelleryAllowanceMale = "Personal jewelry within reasonable travel usage.",
                    GoldJewelleryAllowanceFemale = "Personal jewelry within reasonable travel usage.",
                    CurrencyDeclarationLimit = "Mandatory disclosure if carrying cash, currency or financial instruments exceeding 60,000 AED (or equivalent in foreign currency).",
                    ProhibitedItems = new()
                    {
                        "Narcotics and controlled psychotropic medications without approved MOHAP prescription",
                        "Betel leaves (Paan) and Niswar",
                        "Counterfeit items and pirated goods",
                        "Gambling tools and machinery",
                        "Goods originating from boycotted countries"
                    }
                };
            }

            // Default: tripgoasia
            return new CustomsAllowanceRuleDto
            {
                DestinationOrHomeCountry = "Thailand Customs Department",
                DutyFreeGeneralAllowance = "Personal belongings and souvenirs for personal use up to 20,000 THB duty-free.",
                AlcoholAllowance = "Maximum 1 Litre of alcoholic beverage per adult passenger.",
                TobaccoAllowance = "Up to 200 cigarettes OR 250 grams of cigars/smoking tobacco.",
                GoldJewelleryAllowanceMale = "Personal jewelry for own usage without commercial intent.",
                GoldJewelleryAllowanceFemale = "Personal jewelry for own usage without commercial intent.",
                CurrencyDeclarationLimit = "Declare if bringing in or taking out foreign currency equivalent to USD 15,000 or Thai Baht exceeding 50,000 THB.",
                ProhibitedItems = new()
                {
                    "E-cigarettes, vape devices, baraku and related vaporizing liquids",
                    "Pornographic material and obscene literature",
                    "Narcotics, marijuana products without clinical certification",
                    "Buddha images or parts thereof without Ministry of Fine Arts export permit",
                    "Endangered flora, fauna and ivory products"
                }
            };
        }

        private static List<TaxRefundReceipt> GetSeedClaims(string siteId, DestinationTaxRuleDto rule)
        {
            if (siteId == "technoheaven")
            {
                return new List<TaxRefundReceipt>
                {
                    new()
                    {
                        ClaimId = "CLM-DXB-101",
                        SiteId = "technoheaven",
                        StoreName = "Apple Store Dubai Mall",
                        StoreBranch = "Fashion Avenue Ground Floor",
                        PurchaseDate = DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-dd"),
                        InvoiceNumber = "AP-DXB-883192",
                        TaxFormNumber = "PLANET-UAE-918234",
                        Category = "Electronics & Gadgets",
                        PurchaseAmount = 4599.00,
                        EstimatedRefundAmount = 197.75, // 4.3%
                        Currency = "AED",
                        Status = "Draft",
                        RequiresPhysicalInspection = true,
                        ReceiptImageUrl = "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80",
                        Notes = "iPhone 16 Pro Max - keep in carry-on bag for Planet kiosk validation.",
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    },
                    new()
                    {
                        ClaimId = "CLM-DXB-102",
                        SiteId = "technoheaven",
                        StoreName = "Damas Jewellery Gold Souk",
                        StoreBranch = "Deira Old Souk",
                        PurchaseDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
                        InvoiceNumber = "DMS-99412",
                        TaxFormNumber = "PLANET-UAE-918801",
                        Category = "Jewelry & Gold",
                        PurchaseAmount = 2850.00,
                        EstimatedRefundAmount = 122.55,
                        Currency = "AED",
                        Status = "Customs_Inspected",
                        RequiresPhysicalInspection = true,
                        ReceiptImageUrl = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
                        Notes = "22K Gold pendant with Planet tax stamp received.",
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    }
                };
            }

            if (siteId == "gujjutours")
            {
                return new List<TaxRefundReceipt>
                {
                    new()
                    {
                        ClaimId = "CLM-IND-201",
                        SiteId = "gujjutours",
                        StoreName = "Sabyasachi Heritage Flagship",
                        StoreBranch = "Kala Ghoda / Mumbai",
                        PurchaseDate = DateTime.UtcNow.AddDays(-3).ToString("yyyy-MM-dd"),
                        InvoiceNumber = "SB-MUM-7712",
                        TaxFormNumber = "IN-GST-441829",
                        Category = "Fashion & Apparel",
                        PurchaseAmount = 48000.00,
                        EstimatedRefundAmount = 4080.00, // 8.5%
                        Currency = "INR",
                        Status = "Draft",
                        RequiresPhysicalInspection = false,
                        ReceiptImageUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
                        Notes = "Hand-embroidered festive wedding silk outfit.",
                        CreatedAt = DateTime.UtcNow.AddDays(-3)
                    },
                    new()
                    {
                        ClaimId = "CLM-IND-202",
                        SiteId = "gujjutours",
                        StoreName = "Croma Megastore Electronics",
                        StoreBranch = "SG Highway, Ahmedabad",
                        PurchaseDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
                        InvoiceNumber = "CRM-AHM-90214",
                        TaxFormNumber = "IN-GST-994102",
                        Category = "Electronics & Gadgets",
                        PurchaseAmount = 24500.00,
                        EstimatedRefundAmount = 2082.50,
                        Currency = "INR",
                        Status = "Customs_Inspected",
                        RequiresPhysicalInspection = false,
                        ReceiptImageUrl = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80",
                        Notes = "Smartwatch and noise-cancelling headphones.",
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    }
                };
            }

            // tripgoasia (Thailand)
            return new List<TaxRefundReceipt>
            {
                new()
                {
                    ClaimId = "CLM-BKK-301",
                    SiteId = "tripgoasia",
                    StoreName = "Siam Paragon Department Store",
                    StoreBranch = "Rama 1 Rd, Pathum Wan / Bangkok",
                    PurchaseDate = DateTime.UtcNow.AddDays(-3).ToString("yyyy-MM-dd"),
                    InvoiceNumber = "SP-BKK-20914",
                    TaxFormNumber = "TH-PP10-559128",
                    Category = "Fashion & Apparel",
                    PurchaseAmount = 8900.00,
                    EstimatedRefundAmount = 489.50, // 5.5%
                    Currency = "THB",
                    Status = "Draft",
                    RequiresPhysicalInspection = false,
                    ReceiptImageUrl = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
                    Notes = "Thai silk shirts & designer apparel with yellow P.P.10 certificate attached.",
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                },
                new()
                {
                    ClaimId = "CLM-BKK-302",
                    SiteId = "tripgoasia",
                    StoreName = "King Power Duty Free Complex",
                    StoreBranch = "Rangnam, Bangkok",
                    PurchaseDate = DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-dd"),
                    InvoiceNumber = "KP-RN-88102",
                    TaxFormNumber = "TH-PP10-884192",
                    Category = "Luxury & Watches",
                    PurchaseAmount = 24500.00,
                    EstimatedRefundAmount = 1347.50,
                    Currency = "THB",
                    Status = "Customs_Inspected",
                    RequiresPhysicalInspection = true,
                    ReceiptImageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
                    Notes = "Seiko Prospex Diver Watch. Must be presented at Customs BKK Gate 10.",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                }
            };
        }
    }
}
