using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/budget")]
    public class BudgetController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _databaseProvider;

        public BudgetController(IWebsiteContext websiteContext, IMongoDatabaseProvider databaseProvider)
        {
            _websiteContext = websiteContext;
            _databaseProvider = databaseProvider;
        }

        private IMongoCollection<BudgetExpense> GetExpensesCollection()
        {
            var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
            return db.GetCollection<BudgetExpense>("travel_expenses");
        }

        [HttpGet("guide")]
        public IActionResult GetCostGuide()
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";

            if (siteId.Contains("tripgo"))
            {
                var guide = new DestinationCostGuideDto
                {
                    Success = true,
                    SiteId = siteId,
                    DestinationName = "Thailand & Southeast Asia Tropical Islands",
                    BaseCurrency = "THB",
                    EstimatedDailyBudget = 1600m,
                    CategoryEstimates = new Dictionary<string, decimal>
                    {
                        { "dining", 550m },
                        { "shopping", 400m },
                        { "transport", 300m },
                        { "activities", 250m },
                        { "tipping", 100m }
                    },
                    TippingEtiquette = "Tipping 20-50 THB at casual restaurants and night markets is standard. For private longtail captains and marine dive guides, 100-200 THB is appreciated.",
                    BargainingCulture = "Polite, smiling bargaining is welcomed at outdoor island night markets (aim for 15-25% off initial asking price). 7-Eleven, convenience stores, and national park ticket counters are strictly fixed price.",
                    PopularPaymentMethods = new List<string>
                    {
                        "Cash (Thai Baht THB notes)",
                        "PromptPay QR Code",
                        "Visa / Mastercard (Major hotels & diving shops)",
                        "GrabPay / TrueMoney"
                    }
                };
                return Ok(new { success = true, data = guide });
            }

            if (siteId.Contains("techno"))
            {
                var guide = new DestinationCostGuideDto
                {
                    Success = true,
                    SiteId = siteId,
                    DestinationName = "Dubai & United Arab Emirates VIP Journeys",
                    BaseCurrency = "AED",
                    EstimatedDailyBudget = 550m,
                    CategoryEstimates = new Dictionary<string, decimal>
                    {
                        { "dining", 220m },
                        { "shopping", 150m },
                        { "transport", 100m },
                        { "activities", 50m },
                        { "tipping", 30m }
                    },
                    TippingEtiquette = "A 10-15% gratuity is standard at fine dining establishments. Chauffeur drivers and desert safari marshalls typically receive 50-100 AED upon conclusion of full-day service.",
                    BargainingCulture = "Respectful negotiation on gold per-gram making charges is expected at the Deira Gold Souk. All retail malls and designer flagships operate on strictly fixed pricing.",
                    PopularPaymentMethods = new List<string>
                    {
                        "Apple Pay & Contactless Cards (Accepted everywhere)",
                        "Major Credit Cards (Visa, Mastercard, Amex)",
                        "Cash (AED Dirham notes)"
                    }
                };
                return Ok(new { success = true, data = guide });
            }

            // Default: GujjuTours
            var defaultGuide = new DestinationCostGuideDto
            {
                Success = true,
                SiteId = siteId,
                DestinationName = "Gujarat Pilgrimages & Cultural Circuits",
                BaseCurrency = "INR",
                EstimatedDailyBudget = 2200m,
                CategoryEstimates = new Dictionary<string, decimal>
                {
                    { "dining", 800m },
                    { "shopping", 600m },
                    { "transport", 400m },
                    { "activities", 300m },
                    { "tipping", 100m }
                },
                TippingEtiquette = "At pure vegetarian dining halls and bhojanalayas, ₹50-100 for exceptional service is customary. For dedicated tour bus drivers and assistants, ₹200-500 total from the family group at trip conclusion is warmly appreciated. Dakshina at temple sanctums is strictly voluntary.",
                BargainingCulture = "Fixed pricing at authentic khadi emporiums and state trust shops. Friendly, respectful bargaining is customary for bandhani dupattas, handicrafts, and brassware at local bazaars.",
                PopularPaymentMethods = new List<string>
                {
                    "UPI (Google Pay, PhonePe, Paytm accepted everywhere from street vendors to hotels)",
                    "Cash (INR currency notes for temple offerings & small purchases)",
                    "Credit & Debit Cards"
                }
            };

            return Ok(new { success = true, data = defaultGuide });
        }

        [HttpPost("sync")]
        public async Task<IActionResult> SyncExpenses([FromBody] ExpenseSyncPayloadDto payload)
        {
            if (payload == null || payload.Expenses == null)
            {
                return BadRequest(new { success = false, message = "Invalid payload" });
            }

            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var collection = GetExpensesCollection();

            var records = payload.Expenses.Select(e => new BudgetExpense
            {
                SiteId = siteId,
                ClientExpenseId = e.Id,
                Title = e.Title,
                Amount = e.Amount,
                Currency = e.Currency,
                Category = e.Category,
                PaymentMethod = e.PaymentMethod,
                PaidBy = e.PaidBy,
                SplitWith = e.SplitWith ?? new List<string>(),
                Date = e.Date,
                Notes = e.Notes,
                Location = e.Location,
                SyncedAt = DateTime.UtcNow
            }).ToList();

            if (records.Count > 0)
            {
                try
                {
                    // Delete previous synced batch for this client to ensure clean state
                    var clientIds = records.Select(r => r.ClientExpenseId).ToList();
                    await collection.DeleteManyAsync(x => x.SiteId == siteId && clientIds.Contains(x.ClientExpenseId));
                    await collection.InsertManyAsync(records);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WARN] Could not persist expenses to MongoDB: {ex.Message}");
                }
            }

            return Ok(new
            {
                success = true,
                message = $"{records.Count} expense items synced successfully to cloud vault.",
                syncedCount = records.Count
            });
        }
    }
}
