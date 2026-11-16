using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/bargain")]
    public class BargainController : ControllerBase
    {
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly IWebsiteContext _websiteContext;
        private readonly ILogger<BargainController> _logger;

        public BargainController(
            IMongoDatabaseProvider dbProvider,
            IWebsiteContext websiteContext,
            ILogger<BargainController> logger)
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

        [HttpGet("hub")]
        [HttpGet("data")]
        public IActionResult GetBargainHub([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);

            if (resolvedSite == "technoheaven")
            {
                return Ok(new
                {
                    status = "success",
                    data = GetTechnoheavenBargainData()
                });
            }
            else if (resolvedSite == "gujjutours")
            {
                return Ok(new
                {
                    status = "success",
                    data = GetGujjuToursBargainData()
                });
            }

            // Default to TripGoAsia (Bangkok / Thailand Night Markets)
            return Ok(new
            {
                status = "success",
                data = GetTripGoAsiaBargainData()
            });
        }

        private BargainHubDto GetTripGoAsiaBargainData()
        {
            return new BargainHubDto
            {
                City = "Bangkok & Chiang Mai",
                DestinationCountry = "Thailand",
                CurrencyCode = "THB",
                CurrencySymbol = "฿",
                CultureSummary = "In Thailand, bargaining is considered a friendly, playful social exchange ('Sanuk'). Raised voices, frowning, or aggressive posture will immediately kill the deal. Always smile, maintain gentle eye contact, and view negotiation as a warm conversation.",
                Rules = new List<BargainingRuleItem>
                {
                    new BargainingRuleItem
                    {
                        RuleNumber = "01",
                        Title = "The 50% Opening Anchor",
                        Description = "At tourist street stalls, quote 50% - 60% of the vendor's first asking price. Settle comfortably around 70% - 75% for a win-win deal.",
                        Icon = "calculator-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "02",
                        Title = "The Polite Walk-Away Tactic",
                        Description = "If the vendor won't drop below an unreasonable price, politely bow your head, smile, and say 'Khop khun krub/kha'. In 70% of stalls, they will call you back with their real bottom price.",
                        Icon = "walk-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "03",
                        Title = "Bundle For Exponential Discounts",
                        Description = "Ask 'Tha sue song chin, lot thao rai?' (If I buy two, how much?). Vendors are 3x more willing to slash prices for multiple units.",
                        Icon = "layers-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "04",
                        Title = "Never Haggle on Street Food or 7-Eleven",
                        Description = "Cooked food, fruit carts, sit-down food courts, and convenience stores are strictly FIXED PRICE. Haggling for Pad Thai or mango sticky rice is considered disrespectful.",
                        Icon = "restaurant-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "05",
                        Title = "Carry Exact Cash & Small Baht Bills",
                        Description = "Flashing a 1,000 THB bill after haggling down from 250 to 120 THB ruins good faith and stalls may not have change. Carry 20, 50, and 100 Baht banknotes.",
                        Icon = "cash-outline"
                    }
                },
                Categories = new List<BargainCategoryItem>
                {
                    new BargainCategoryItem
                    {
                        Id = "cat-thai-pants",
                        CategoryName = "Elephant Pants & Rayon Shorts",
                        Icon = "shirt-outline",
                        TypicalItems = "Lightweight elephant print trousers, boho maxi dresses, linen shirts",
                        BenchmarkPriceRange = "100 - 150 THB",
                        BargainMarginPercent = 45,
                        StrategyTip = "Vendors often quote 250 - 300 THB at front entrances. Never pay above 150 THB. Walk 50 meters deeper into the alley where standard price is 100-120 THB."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-thai-silk",
                        CategoryName = "Silk Scarves & Pashminas",
                        Icon = "ribbon-outline",
                        TypicalItems = "Woven Thai silk scarves, decorative shawls, neckerchiefs",
                        BenchmarkPriceRange = "180 - 280 THB",
                        BargainMarginPercent = 35,
                        StrategyTip = "Real mulberry silk costs 500+ THB; street market silk is a rayon-polyester blend. Quoted at 350-450 THB. Counter with 200 THB."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-thai-teak",
                        CategoryName = "Handcrafted Wood & Coconut Bowls",
                        Icon = "leaf-outline",
                        TypicalItems = "Carved teak elephants, lacquerware coconut bowls, wooden coasters",
                        BenchmarkPriceRange = "120 - 300 THB",
                        BargainMarginPercent = 30,
                        StrategyTip = "Inspect for cracks or chipped varnish before offering. Offer 250 THB for 2 bowls combined."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-thai-tailor",
                        CategoryName = "Custom Tailored Suits & Shirts",
                        Icon = "cut-outline",
                        TypicalItems = "2-piece custom wool/cashmere suit, Egyptian cotton dress shirts",
                        BenchmarkPriceRange = "4,000 - 7,500 THB",
                        BargainMarginPercent = 25,
                        StrategyTip = "Avoid touts near tourist temples offering '24-hour suit specials'. Insist on at least 2 interim fitting sessions and test fabric burn samples."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-thai-tuktuk",
                        CategoryName = "Tuk-Tuk & Street Transport",
                        Icon = "car-outline",
                        TypicalItems = "Open-air motorized tuk-tuk rides (1 to 4 km)",
                        BenchmarkPriceRange = "80 - 150 THB",
                        BargainMarginPercent = 50,
                        StrategyTip = "Always negotiate total price for the whole party BEFORE boarding. Decline any ride offered for 20-30 THB—this is a classic gem store / tailor detour scam."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-thai-streetfood",
                        CategoryName = "Street Food & Fresh Fruit",
                        Icon = "fast-food-outline",
                        TypicalItems = "Pad Thai, Som Tum papaya salad, fresh sliced mango, coconut ice cream",
                        BenchmarkPriceRange = "50 - 100 THB",
                        BargainMarginPercent = 0,
                        StrategyTip = "STRICTLY NON-NEGOTIABLE. Prices are honest and low. Trying to haggle with food vendors is viewed as bad etiquette."
                    }
                },
                FamousMarkets = new List<BargainMarketItem>
                {
                    new BargainMarketItem
                    {
                        Id = "mkt-chatuchak",
                        MarketName = "Chatuchak Weekend Market (JJ)",
                        City = "Bangkok",
                        MarketType = "Weekend Market",
                        BargainingStrictness = "High",
                        ExpectedDiscount = "30% - 50% Off Quoted",
                        OpeningHours = "Sat & Sun 09:00 - 18:00",
                        LocationArea = "Mo Chit BTS / Kamphaeng Phet MRT",
                        PaymentAdvice = "90% Cash only; PromptPay QR accepted by tech-savvy stalls",
                        InsiderSecret = "Sections 7, 24, and 25 have independent Thai artisans who give wholesale discounts when buying 3+ pieces.",
                        BestBuys = new List<string> { "Vintage denim", "Handmade ceramics", "Aromatherapy oils", "Elephant pants" }
                    },
                    new BargainMarketItem
                    {
                        Id = "mkt-joddfairs",
                        MarketName = "Jodd Fairs Night Market",
                        City = "Bangkok",
                        MarketType = "Night Market",
                        BargainingStrictness = "Moderate",
                        ExpectedDiscount = "15% - 25% Off Quoted",
                        OpeningHours = "Daily 16:00 - 00:00",
                        LocationArea = "Phra Ram 9 MRT (Behind Central Rama 9)",
                        PaymentAdvice = "PromptPay QR widely accepted; Cash for food vendors",
                        InsiderSecret = "Food rows are strictly fixed price. Fashion and phone accessory booths behind the food lanes are open to polite 20% negotiation.",
                        BestBuys = new List<string> { "Leng Saap volcano ribs", "Canvas tote bags", "Silver rings", "Bespoke leather belts" }
                    },
                    new BargainMarketItem
                    {
                        Id = "mkt-pratunam",
                        MarketName = "Pratunam Wholesale Clothing Market",
                        City = "Bangkok",
                        MarketType = "Wholesale Market",
                        BargainingStrictness = "High",
                        ExpectedDiscount = "40% - 60% Wholesale Rate",
                        OpeningHours = "Daily 05:00 - 19:00",
                        LocationArea = "Ratchaprarop ARL / Phaya Thai BTS",
                        PaymentAdvice = "Cash only for wholesale bundles",
                        InsiderSecret = "The golden wholesale threshold is 3 pieces from the same vendor. You instantly unlock 40% off individual retail prices.",
                        BestBuys = new List<string> { "Boutique swimwear", "Linen resort wear", "Graphic tees", "Luggage suitcases" }
                    },
                    new BargainMarketItem
                    {
                        Id = "mkt-chiangmai-sunday",
                        MarketName = "Chiang Mai Sunday Walking Street",
                        City = "Chiang Mai",
                        MarketType = "Night Market",
                        BargainingStrictness = "Moderate",
                        ExpectedDiscount = "20% - 30% Off Quoted",
                        OpeningHours = "Sunday 17:00 - 23:00",
                        LocationArea = "Rachadamnoen Road (Tha Phae Gate to Wat Phra Singh)",
                        PaymentAdvice = "Cash in small bills (20, 50, 100 THB)",
                        InsiderSecret = "Authentic northern hill-tribe crafts are sold directly by the artisans. Bargain with deep respect and avoid lowballing elderly weavers.",
                        BestBuys = new List<string> { "Silver Hmong jewelry", "Hand-dyed indigo shirts", "Teak wood carvings", "Dried mango packs" }
                    }
                },
                KeyPhrases = new List<BargainPhraseItem>
                {
                    new BargainPhraseItem
                    {
                        Id = "ph-th-1",
                        EnglishMeaning = "How much is this?",
                        Phonetic = "Tao rai khrap? (male) / Tao rai kha? (female)",
                        LocalScript = "เท่าไหร่ครับ / เท่าไหร่ค่ะ",
                        ContextAdvice = "Always append polite particles 'khrap' (if you identify as male) or 'kha' (if female)."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-th-2",
                        EnglishMeaning = "Too expensive, can you discount?",
                        Phonetic = "Phaeng mak, lot dai mai khrap?",
                        LocalScript = "แพงมาก ลดได้ไหมครับ",
                        ContextAdvice = "Say this with a gentle smile and a soft tone. Never sound angry."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-th-3",
                        EnglishMeaning = "If I buy two, what is your best price?",
                        Phonetic = "Tha sue song chin, lot thao rai?",
                        LocalScript = "ถ้าซื้อสองชิ้น ลดเท่าไหร่",
                        ContextAdvice = "The absolute secret weapon for street fashion and souvenir stalls."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-th-4",
                        EnglishMeaning = "I will give you 200 Baht right now.",
                        Phonetic = "Song roi baht dai mai?",
                        LocalScript = "สองร้อยบาทได้ไหม",
                        ContextAdvice = "Have the exact 200 THB cash ready in hand while making this closing offer."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-th-5",
                        EnglishMeaning = "Thank you, no problem. Have a nice day!",
                        Phonetic = "Khop khun khrap, mai pen rai",
                        LocalScript = "ขอบคุณครับ ไม่เป็นไร",
                        ContextAdvice = "The graceful exit phrase. Often triggers the vendor to call you back with their real bottom price."
                    }
                }
            };
        }

        private BargainHubDto GetTechnoheavenBargainData()
        {
            return new BargainHubDto
            {
                City = "Dubai & Abu Dhabi",
                DestinationCountry = "United Arab Emirates",
                CurrencyCode = "AED",
                CurrencySymbol = "د.إ",
                CultureSummary = "In Dubai's traditional souks, bargaining is an honored heritage tradition dating back to ancient maritime traders. Sellers expect negotiation on spices, textiles, and gold jewelry making charges. Major shopping malls (Dubai Mall, Mall of the Emirates) are strictly fixed price.",
                Rules = new List<BargainingRuleItem>
                {
                    new BargainingRuleItem
                    {
                        RuleNumber = "01",
                        Title = "Gold Souk: Only Haggle the 'Making Charge'",
                        Description = "The daily price of gold per gram is legally regulated and posted on digital screens. You can NEVER negotiate the gold weight price; negotiate the 'making charge' (craftsmanship fee) down by 30% - 50%.",
                        Icon = "medal-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "02",
                        Title = "The Souk 'Tea Diplomacy'",
                        Description = "If a carpet or jewelry merchant offers you small glasses of mint tea or Karak chai, accept it graciously. It establishes warm rapport and does not obligate you to buy.",
                        Icon = "cafe-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "03",
                        Title = "Start Counter at 40% in Spice & Textile Souks",
                        Description = "Initial tourist prices at Deira Spice Souk for saffron, frankincense, and pashminas are heavily inflated. Counter at 40-50% of the opening quote.",
                        Icon = "calculator-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "04",
                        Title = "Cash Unlocks an Extra 5% Discount",
                        Description = "Credit card processing fees in the UAE range from 2.5% to 4%. Offering crisp UAE Dirham cash often secures an immediate extra discount.",
                        Icon = "cash-outline"
                    }
                },
                Categories = new List<BargainCategoryItem>
                {
                    new BargainCategoryItem
                    {
                        Id = "cat-uae-gold",
                        CategoryName = "22K/24K Gold Jewelry (Making Charge)",
                        Icon = "diamond-outline",
                        TypicalItems = "Gold bangles, chains, pendant necklaces, earrings",
                        BenchmarkPriceRange = "Gold Spot + 20-35 AED/gram making charge",
                        BargainMarginPercent = 40,
                        StrategyTip = "Always check the official daily gold ticker first. Tell the vendor: 'I respect the gold weight price, but let's talk about the making charge per gram.'"
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-uae-saffron",
                        CategoryName = "Royal Iranian / Kashmiri Saffron",
                        Icon = "flame-outline",
                        TypicalItems = "Super Negin grade saffron threads (per gram)",
                        BenchmarkPriceRange = "12 - 20 AED / gram",
                        BargainMarginPercent = 35,
                        StrategyTip = "Avoid pre-ground powders. Insist on inspecting whole crimson threads in glass jars. Never pay above 18 AED per gram in bulk (10g+)."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-uae-pashmina",
                        CategoryName = "Cashmere & Pashmina Shawls",
                        Icon = "ribbon-outline",
                        TypicalItems = "Silk-blend pashminas, authentic 100% cashmere wraps",
                        BenchmarkPriceRange = "40 - 150 AED",
                        BargainMarginPercent = 50,
                        StrategyTip = "Most 30-50 AED scarves are viscose/acrylic. Real 100% cashmere starts at 150-250 AED. Pull the scarf through a wedding ring to test genuine softness."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-uae-attar",
                        CategoryName = "Arabic Oud & Attar Perfumes",
                        Icon = "color-filter-outline",
                        TypicalItems = "Pure concentrated perfume oils in crystal bottles (Tola = 12ml)",
                        BenchmarkPriceRange = "50 - 180 AED / Tola",
                        BargainMarginPercent = 30,
                        StrategyTip = "Test the oil on your inner wrist. High quality oud develops richer earthy notes after 15 minutes."
                    }
                },
                FamousMarkets = new List<BargainMarketItem>
                {
                    new BargainMarketItem
                    {
                        Id = "mkt-deira-gold",
                        MarketName = "Deira Gold Souk",
                        City = "Dubai",
                        MarketType = "Traditional Souk",
                        BargainingStrictness = "Moderate",
                        ExpectedDiscount = "30% - 50% Off Making Charge",
                        OpeningHours = "Sat - Thu 10:00 - 22:00, Fri 16:00 - 22:00",
                        LocationArea = "Al Ras Metro Station / Deira Old Souk Marine",
                        PaymentAdvice = "Credit Cards accepted, Cash gets best discount",
                        InsiderSecret = "Government inspectors conduct unannounced purity checks. Every gold item is legally hallmarked; look for the official Bareeq stamp.",
                        BestBuys = new List<string> { "22K gold bangles", "Arabic calligraphy pendants", "Certified diamond studs" }
                    },
                    new BargainMarketItem
                    {
                        Id = "mkt-spice-souk",
                        MarketName = "Deira Spice Souk",
                        City = "Dubai",
                        MarketType = "Traditional Souk",
                        BargainingStrictness = "High",
                        ExpectedDiscount = "40% - 60% Off Quoted",
                        OpeningHours = "Daily 09:00 - 22:00",
                        LocationArea = "Al Ras / Abra Dock",
                        PaymentAdvice = "Cash preferred for best rates",
                        InsiderSecret = "Vendors quote high tourist rates for saffron. Buy by weight (grams) rather than pre-packaged gift boxes.",
                        BestBuys = new List<string> { "Iranian Saffron", "Hojari Frankincense", "Cardamom pods", "Rose water" }
                    },
                    new BargainMarketItem
                    {
                        Id = "mkt-karama",
                        MarketName = "Karama Shopping Complex",
                        City = "Dubai",
                        MarketType = "Bazaar & Flea Market",
                        BargainingStrictness = "High",
                        ExpectedDiscount = "40% - 50% Off Quoted",
                        OpeningHours = "Daily 10:00 - 23:00",
                        LocationArea = "ADCB Metro Station, Al Karama",
                        PaymentAdvice = "Cash gives massive leverage",
                        InsiderSecret = "Famous for designer fashion, leather goods, and souvenirs. Initial quotes are double reality. Counter with 40% immediately.",
                        BestBuys = new List<string> { "Leather duffel bags", "Designer sneakers", "Souvenir Burj Khalifa models" }
                    }
                },
                KeyPhrases = new List<BargainPhraseItem>
                {
                    new BargainPhraseItem
                    {
                        Id = "ph-ae-1",
                        EnglishMeaning = "How much is this?",
                        Phonetic = "Bikam hatha?",
                        LocalScript = "بكم هذا؟",
                        ContextAdvice = "Standard friendly Arabic inquiry in all UAE souks."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-ae-2",
                        EnglishMeaning = "Too expensive, give me your best price.",
                        Phonetic = "Ghaali jiddan, a'tini aakhir si'r",
                        LocalScript = "غالي جداً، أعطني آخر سعر",
                        ContextAdvice = "Respectful yet assertive phrase showing you understand local trade."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-ae-3",
                        EnglishMeaning = "If I pay cash right now, how much?",
                        Phonetic = "Iza adfa' naqdan, kam?",
                        LocalScript = "إذا أدفع نقداً، كم؟",
                        ContextAdvice = "Cash (naqdan) is the best bargaining chip in Deira."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-ae-4",
                        EnglishMeaning = "May God bless your business. Thank you.",
                        Phonetic = "Shukran jazeelan, ma'a salama",
                        LocalScript = "شكراً جزيلاً، مع السلامة",
                        ContextAdvice = "Warm, polite departure phrase."
                    }
                }
            };
        }

        private BargainHubDto GetGujjuToursBargainData()
        {
            return new BargainHubDto
            {
                City = "Mumbai, Delhi & Ahmedabad",
                DestinationCountry = "India",
                CurrencyCode = "INR",
                CurrencySymbol = "₹",
                CultureSummary = "In India's bustling street bazaars, bargaining is an art form, a national pastime, and an essential part of commerce. Vendors deliberately quote double to triple for international and out-of-town visitors. Keep your tone cheerful, address vendors respectfully as 'Bhaiya' (brother), and enjoy the lively negotiation.",
                Rules = new List<BargainingRuleItem>
                {
                    new BargainingRuleItem
                    {
                        RuleNumber = "01",
                        Title = "The 'Theek Theek Lagao' Golden Rule",
                        Description = "Never say 'give me 50% off'. Instead say 'Bhaiya, theek theek lagao, hum roz aate hain' (Brother, quote a fair price, we are regular visitors).",
                        Icon = "chatbubble-ellipses-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "02",
                        Title = "The Bohni (First Sale) Morning Tactic",
                        Description = "Shopping early in the morning (10:00 - 11:30 AM) when shops open unlocks 'Bohni' (auspicious first sale of the day). Indian shopkeepers believe losing the first customer brings bad luck and will agree to very low margins.",
                        Icon = "sunny-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "03",
                        Title = "Bulk Quantity Stacking",
                        Description = "Pick 3-4 items from the same shop. Negotiating a collective bill of ₹1,500 down to ₹1,000 is 10x easier than haggling for a single ₹300 item.",
                        Icon = "layers-outline"
                    },
                    new BargainingRuleItem
                    {
                        RuleNumber = "04",
                        Title = "Carry ₹100 and ₹200 Currency Notes",
                        Description = "Avoid flashing ₹500 notes. Showing smaller notes in hand makes your offer of '₹200 final' look authentic and ready to close.",
                        Icon = "wallet-outline"
                    }
                },
                Categories = new List<BargainCategoryItem>
                {
                    new BargainCategoryItem
                    {
                        Id = "cat-in-kurtas",
                        CategoryName = "Cotton Kurtas & Bandhani Sarees",
                        Icon = "shirt-outline",
                        TypicalItems = "Block-printed Lucknowi kurtis, Rajasthani bandhej dupattas, cotton shirts",
                        BenchmarkPriceRange = "300 - 650 INR",
                        BargainMarginPercent = 45,
                        StrategyTip = "Quoted at ₹900 - ₹1,200 on street stalls. Counter at ₹400 and settle around ₹500 - ₹550. Check armpit seams and button stitching."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-in-footwear",
                        CategoryName = "Kolhapuri Chappals & Mojaris",
                        Icon = "walk-outline",
                        TypicalItems = "Handcrafted leather sandals, embroidered bridal juttis",
                        BenchmarkPriceRange = "350 - 700 INR",
                        BargainMarginPercent = 40,
                        StrategyTip = "Bend the sole to ensure real leather and not cardboard backing. Quoted at ₹1,000+. Settle for ₹500."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-in-brass",
                        CategoryName = "Brass Statues & Antiques",
                        Icon = "trophy-outline",
                        TypicalItems = "Ganesha idols, peacock diya lamps, singing bowls",
                        BenchmarkPriceRange = "450 - 1,200 INR",
                        BargainMarginPercent = 35,
                        StrategyTip = "True brass is heavy and cool to the touch. Scratch the base slightly; if it shows silver/grey, it is iron plated."
                    },
                    new BargainCategoryItem
                    {
                        Id = "cat-in-spices",
                        CategoryName = "Assam CTC Tea & Whole Spices",
                        Icon = "flower-outline",
                        TypicalItems = "Green cardamom, cinnamon quills, Masala Chai blend",
                        BenchmarkPriceRange = "250 - 600 INR / 250g",
                        BargainMarginPercent = 20,
                        StrategyTip = "Spices have lower profit margins. Focus on getting a free 50g sample or bundling rather than aggressive price cuts."
                    }
                },
                FamousMarkets = new List<BargainMarketItem>
                {
                    new BargainMarketItem
                    {
                        Id = "mkt-colaba",
                        MarketName = "Colaba Causeway Street Market",
                        City = "Mumbai",
                        MarketType = "Street Bazaar",
                        BargainingStrictness = "High",
                        ExpectedDiscount = "40% - 60% Off Quoted",
                        OpeningHours = "Daily 11:00 - 22:00",
                        LocationArea = "Colaba, South Mumbai (Near Gateway of India)",
                        PaymentAdvice = "UPI QR (Google Pay/PhonePe) or Cash",
                        InsiderSecret = "The stalls near Cafe Mondegar quote the highest tourist rates. Walk further down towards Leopold Cafe for friendlier deals.",
                        BestBuys = new List<string> { "Antique pocket watches", "Junk jewelry & earrings", "Boho cotton tops", "Kolhapuri chappals" }
                    },
                    new BargainMarketItem
                    {
                        Id = "mkt-janpath",
                        MarketName = "Janpath & Tibetan Market",
                        City = "New Delhi",
                        MarketType = "Flea Market",
                        BargainingStrictness = "High",
                        ExpectedDiscount = "50% - 65% Off Quoted",
                        OpeningHours = "Daily 10:30 - 20:00",
                        LocationArea = "Connaught Place, Central Delhi",
                        PaymentAdvice = "Cash is king; UPI accepted widely",
                        InsiderSecret = "Quote 40% of their opening price. If they say ₹800, offer ₹300 with a smile. You will almost certainly settle at ₹400.",
                        BestBuys = new List<string> { "Tibetan brass singing bowls", "Embroidered cushion covers", "Denim jackets", "Pashmina shawls" }
                    },
                    new BargainMarketItem
                    {
                        Id = "mkt-lawgarden",
                        MarketName = "Law Garden Night Market",
                        City = "Ahmedabad",
                        MarketType = "Night Bazaar",
                        BargainingStrictness = "High",
                        ExpectedDiscount = "35% - 50% Off Quoted",
                        OpeningHours = "Daily 18:00 - 23:30",
                        LocationArea = "Ellisbridge, Ahmedabad",
                        PaymentAdvice = "Cash and UPI",
                        InsiderSecret = "The premier destination for traditional Navratri Chaniya Cholis and Kutchi mirror-work wall hangings. Settle for 50% of the initial quote.",
                        BestBuys = new List<string> { "Kutchi mirror-work jackets", "Bandhani dupattas", "Traditional mojari juttis", "Oxidised silver jewelry" }
                    }
                },
                KeyPhrases = new List<BargainPhraseItem>
                {
                    new BargainPhraseItem
                    {
                        Id = "ph-in-1",
                        EnglishMeaning = "Brother, quote a fair price.",
                        Phonetic = "Bhaiya, theek theek lagao",
                        LocalScript = "भैया, ठीक-ठीक लगाओ",
                        ContextAdvice = "The universally respected opening statement across every Indian bazaar."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-in-2",
                        EnglishMeaning = "This is very expensive, give me a discount.",
                        Phonetic = "Bahut mehenga hai, thoda kam karo",
                        LocalScript = "बहुत महंगा है, थोड़ा कम करो",
                        ContextAdvice = "Said with a good-natured smile while shaking your head playfully."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-in-3",
                        EnglishMeaning = "I will take two pieces, what is the final rate?",
                        Phonetic = "Do piece lenge, aakhri rate batao",
                        LocalScript = "दो पीस लेंगे, आख़िरी रेट बताओ",
                        ContextAdvice = "Triggers the vendor's wholesale mindset instantly."
                    },
                    new BargainPhraseItem
                    {
                        Id = "ph-in-4",
                        EnglishMeaning = "I am ready with cash, take ₹200 and pack it.",
                        Phonetic = "Chalo do sau rupaye lo aur pack karo",
                        LocalScript = "चलो दो सौ रुपये लो और पैक करो",
                        ContextAdvice = "Firm closing line that seals 80% of street transactions."
                    }
                }
            };
        }
    }
}
