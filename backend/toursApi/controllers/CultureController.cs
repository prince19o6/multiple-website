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
    [Route("api/culture")]
    public class CultureController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<CultureController> _logger;

        public CultureController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<CultureController> logger)
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
        public IActionResult GetCultureHubData([FromQuery] string? siteId = null, [FromQuery] string? destination = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedCultureHub(resolvedSite);

            if (!string.IsNullOrWhiteSpace(destination))
            {
                hub.DestinationCountry = destination.Trim();
            }

            return Ok(new { success = true, data = hub });
        }

        [HttpPost("check-outfit")]
        public IActionResult CheckOutfitCompliance([FromBody] CheckOutfitComplianceRequestDto request)
        {
            var missing = new List<string>();

            if (!request.IsShouldersCovered)
            {
                missing.Add("Shoulders must be covered (bring a light shawl, t-shirt, or cardigan).");
            }

            if (!request.IsKneesCovered)
            {
                missing.Add("Knees must be covered (wear trousers, long pants, or a maxi skirt below the knee).");
            }

            if (!request.IsClothingLooseAndOpaque)
            {
                missing.Add("Clothing must be opaque and modest (avoid sheer fabrics, mesh, or skin-tight leggings).");
            }

            if (!request.IsFootwearRemovable)
            {
                missing.Add("Footwear must be easily removable before stepping into inner sacred sanctuaries.");
            }

            if (!request.IsHeadwearRemovable)
            {
                missing.Add("Remove baseball caps, sun hats, and sunglasses inside holy prayer halls.");
            }

            var isCompliant = missing.Count == 0;
            var status = isCompliant ? "Pass" : (missing.Count <= 2 ? "Needs_Coverup" : "Fail_At_Gate");

            var verdictTitle = status switch
            {
                "Pass" => "Approved for Sacred Site Entry",
                "Needs_Coverup" => "Modesty Adjustment Needed",
                _ => "Denied Entry at Security Gate"
            };

            var verdictDetails = status switch
            {
                "Pass" => "Your outfit meets all royal and religious modesty standards. You will pass security checkpoints smoothly.",
                "Needs_Coverup" => "You are almost ready. You can rent or purchase an on-site temple sarong/shawl at the visitor kiosk to cover exposed areas.",
                _ => "This attire violates strict palace/temple decorum guidelines. Security guards will deny gate entry. Please change before proceeding."
            };

            var result = new CheckOutfitComplianceResultDto
            {
                IsCompliant = isCompliant,
                Status = status,
                VerdictTitle = verdictTitle,
                VerdictDetails = verdictDetails,
                MissingItems = missing
            };

            return Ok(new { success = true, data = result });
        }

        [HttpGet("etiquette")]
        public IActionResult GetEtiquetteItems([FromQuery] string? category = null, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hub = GetSeedCultureHub(resolvedSite);
            var list = hub.EtiquetteGuidelines.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(category) && category.ToLowerInvariant() != "all")
            {
                list = list.Where(e => e.Category.Equals(category.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            return Ok(new { success = true, count = list.Count(), data = list.ToList() });
        }

        private static CultureHubDataDto GetSeedCultureHub(string siteId)
        {
            if (siteId == "technoheaven")
            {
                return new CultureHubDataDto
                {
                    SiteId = "technoheaven",
                    DestinationCountry = "Thailand",
                    LocalTippingNorms = "In luxury hotels and fine dining, a 10% service charge and 7% VAT are included in the bill. Additional tips for porters (50-100 THB) and private chauffeurs (200-300 THB) are warmly appreciated.",
                    SacredAudioGuideText = "Silence mobile phones when entering meditation pavilions. Speak in low whispers and observe prayer times respectfully.",
                    DressCodeRules = new List<DressCodeRuleDto>
                    {
                        new DressCodeRuleDto
                        {
                            Id = "dc-grandpalace",
                            SiteType = "Grand_Palace",
                            SiteName = "The Grand Palace & Wat Phra Kaew",
                            DestinationCountry = "Thailand",
                            ShouldersAllowed = false,
                            ShortsAllowed = false,
                            FootwearPolicy = "Shoes must be removed and stored on shoe racks before stepping inside the Chapel of the Emerald Buddha.",
                            HeadwearPolicy = "Remove sunglasses, hats, and headphones.",
                            SheerTightClothingAllowed = false,
                            OnSiteCoverupAvailable = true,
                            OnSiteCoverupFee = "Temple sarongs and long pants available for purchase outside gates for ~150-200 THB.",
                            KeyRules = new List<string>
                            {
                                "Tops must completely cover shoulders and midriff (no sleeveless, tank tops, or crop tops)",
                                "Pants or skirts must extend below the knee",
                                "Ripped jeans, distressed denim, and skin-tight gym leggings are strictly banned",
                                "No photography permitted inside the inner Emerald Buddha sanctum"
                            }
                        },
                        new DressCodeRuleDto
                        {
                            Id = "dc-mosque",
                            SiteType = "Islamic_Mosque",
                            SiteName = "Sheikh Zayed Grand Mosque & Haroon Mosque",
                            DestinationCountry = "United Arab Emirates",
                            ShouldersAllowed = false,
                            ShortsAllowed = false,
                            FootwearPolicy = "Shoes removed at the gate shoe depository lockers.",
                            HeadwearPolicy = "Women must wear an opaque headscarf (shayla) covering all hair and neck.",
                            SheerTightClothingAllowed = false,
                            OnSiteCoverupAvailable = true,
                            OnSiteCoverupFee = "Complimentary clean abayas provided at visitor welcome center.",
                            KeyRules = new List<string>
                            {
                                "Loose, ankle-length clothing with wrist-length sleeves",
                                "Hair completely covered for women",
                                "No public displays of affection or touching between opposite genders on premises",
                                "Respectful quiet contemplation during call to prayer (Adhan)"
                            }
                        }
                    },
                    EtiquetteGuidelines = new List<CulturalEtiquetteItemDto>
                    {
                        new CulturalEtiquetteItemDto
                        {
                            Id = "eti-monk",
                            Category = "Monks_Royalty",
                            Title = "Monk Interaction & Royal Family Decorum",
                            ShortSummary = "Women must never physically touch a Buddhist monk. Treat royal portraits and Thai baht respectfully.",
                            FullGuidance = "In Thai Buddhism, monks observe 227 monastic vows. A monk is forbidden from touching a woman. If making an offering, a woman should place the item on a tray or cloth. On public transport (BTS / MRT), monks have priority seating. Additionally, under Thai law, the monarchy is revered; never make derogatory remarks or step on coins bearing the King's face.",
                            ImportanceLevel = "Critical_Law",
                            IconName = "person",
                            ProhibitedAction = "Touching a monk, sitting next to a monk as a woman, or defacing currency.",
                            RecommendedAction = "Wai with hands at nose level and step aside to allow monks to pass."
                        },
                        new CulturalEtiquetteItemDto
                        {
                            Id = "eti-taboo",
                            Category = "Social_Taboos",
                            Title = "Head & Feet Cultural Taboos",
                            ShortSummary = "The head is sacred; the feet are considered spiritually low. Never point feet at people or altars.",
                            FullGuidance = "In Thai culture, the head is the highest part of the body, where the spirit resides. Do not touch people's heads or ruffle children's hair. Conversely, the feet are the lowest and dirtiest part. Never use your feet to point at objects, kick items, or point the soles of your feet toward an altar, monk, or Buddha image.",
                            ImportanceLevel = "High_Sacred",
                            IconName = "body",
                            ProhibitedAction = "Pointing feet toward Buddha statues or touching someone's head.",
                            RecommendedAction = "Tuck your feet behind you (mermaid sitting style) when sitting on temple floors."
                        },
                        new CulturalEtiquetteItemDto
                        {
                            Id = "eti-vape",
                            Category = "Legal_Warnings",
                            Title = "Vaping & E-Cigarette Ban Law",
                            ShortSummary = "Electronic cigarettes and vapes are strictly prohibited under Thai law with heavy fines.",
                            FullGuidance = "Vapes, electronic cigarettes, and vape liquids are completely banned from import, possession, and sale in Thailand. Being caught with a vape can result in fines up to 30,000 THB and up to 10 years imprisonment. Do not pack vapes in checked or carry-on baggage.",
                            ImportanceLevel = "Critical_Law",
                            IconName = "alert-circle",
                            ProhibitedAction = "Bringing vapes, e-cigarettes, or nicotine pods into the country.",
                            RecommendedAction = "Dispose of all vaping hardware prior to departure."
                        }
                    },
                    MedicationRules = new List<MedicationCustomsRuleDto>
                    {
                        new MedicationCustomsRuleDto
                        {
                            Id = "med-adhd",
                            MedicationCategory = "ADHD Stimulants (Methylphenidate, Adderall)",
                            Status = "Requires_FDA_Permit",
                            OfficialGuidance = "Requires prior online permit application with the Thai FDA Narcotics Control Division at least 14 days before arrival."
                        },
                        new MedicationCustomsRuleDto
                        {
                            Id = "med-pain",
                            MedicationCategory = "Controlled Painkillers (Codeine, Tramadol)",
                            Status = "Carry_Doctor_Letter",
                            OfficialGuidance = "Carry in original pharmacy packaging with maximum 30-day supply and an English doctor's letter stating condition and dosage."
                        }
                    }
                };
            }

            if (siteId == "tripgoasia")
            {
                return new CultureHubDataDto
                {
                    SiteId = "tripgoasia",
                    DestinationCountry = "Thailand",
                    LocalTippingNorms = "Tipping is not customary in casual eateries or food stalls. In upscale tourist restaurants, leaving 50-100 THB change is customary. For tour guides, 300-500 THB per day for the party is standard.",
                    SacredAudioGuideText = "Keep voices soft. Do not walk between an offering table and an altar when travelers are meditating.",
                    DressCodeRules = new List<DressCodeRuleDto>
                    {
                        new DressCodeRuleDto
                        {
                            Id = "dc-grandpalace",
                            SiteType = "Grand_Palace",
                            SiteName = "The Grand Palace & Wat Phra Kaew",
                            DestinationCountry = "Thailand",
                            ShouldersAllowed = false,
                            ShortsAllowed = false,
                            FootwearPolicy = "Shoes must be removed before entering the inner sanctum.",
                            HeadwearPolicy = "Hats and sunglasses off.",
                            SheerTightClothingAllowed = false,
                            OnSiteCoverupAvailable = true,
                            OnSiteCoverupFee = "Sarongs available for rent/deposit outside.",
                            KeyRules = new List<string>
                            {
                                "Strictly no bare shoulders or deep necklines",
                                "Knees completely covered",
                                "No see-through shirts or exercise leggings",
                                "No photography of the Emerald Buddha"
                            }
                        },
                        new DressCodeRuleDto
                        {
                            Id = "dc-watarun",
                            SiteType = "Buddhist_Temple",
                            SiteName = "Wat Arun (Temple of Dawn) & Wat Pho",
                            DestinationCountry = "Thailand",
                            ShouldersAllowed = false,
                            ShortsAllowed = false,
                            FootwearPolicy = "Remove shoes before walking on prayer carpets.",
                            HeadwearPolicy = "Remove hats.",
                            SheerTightClothingAllowed = false,
                            OnSiteCoverupAvailable = true,
                            OnSiteCoverupFee = "50 THB refundable deposit at entrance kiosk.",
                            KeyRules = new List<string>
                            {
                                "Shoulders and knees covered for all genders",
                                "Steep central prang steps require caution and modest attire",
                                "Photography allowed in courtyards; be respectful of worshipers"
                            }
                        }
                    },
                    EtiquetteGuidelines = new List<CulturalEtiquetteItemDto>
                    {
                        new CulturalEtiquetteItemDto
                        {
                            Id = "eti-buddha",
                            Category = "Sacred_Sites",
                            Title = "Buddha Statues & Holy Relics Decorum",
                            ShortSummary = "Buddha statues are sacred religious items, not decorative props or climbing toys.",
                            FullGuidance = "Never climb on Buddha images or ancient temple ruins for selfies. Export of Buddha statues larger than 12cm requires a license from the Fine Arts Department. Decorative Buddha tattoos below the waist are deeply offensive to locals.",
                            ImportanceLevel = "High_Sacred",
                            IconName = "sparkles",
                            ProhibitedAction = "Climbing on statues, touching Buddha heads, or exposing Buddha tattoos.",
                            RecommendedAction = "Keep Buddha tattoos covered with clothing while in Thailand."
                        },
                        new CulturalEtiquetteItemDto
                        {
                            Id = "eti-anthem",
                            Category = "Monks_Royalty",
                            Title = "National Anthem Protocol",
                            ShortSummary = "Stand still when the national anthem plays twice daily at 08:00 and 18:00.",
                            FullGuidance = "Every day at 8:00 AM and 6:00 PM, the Thai National Anthem is played via public speakers in train stations, markets, and parks. Locals will immediately stop walking and stand at attention. Visitors are expected to stop and pause respectfully until the song ends.",
                            ImportanceLevel = "High_Sacred",
                            IconName = "musical-notes",
                            ProhibitedAction = "Rushing past or laughing while others stand at attention.",
                            RecommendedAction = "Stop walking and stand quietly for 60 seconds."
                        },
                        new CulturalEtiquetteItemDto
                        {
                            Id = "eti-vape",
                            Category = "Legal_Warnings",
                            Title = "Strict E-Cigarette & Vape Prohibitions",
                            ShortSummary = "Vaping is illegal in Thailand. Penalties include heavy fines and possible deportation.",
                            FullGuidance = "Thailand has one of the world's strictest anti-vaping laws. Electronic cigarettes, vape pens, and juice pods are classified as prohibited goods. You will be detained if caught at airport security or on the street.",
                            ImportanceLevel = "Critical_Law",
                            IconName = "alert-circle",
                            ProhibitedAction = "Possession or public use of electronic cigarettes.",
                            RecommendedAction = "Leave all vapes at home."
                        }
                    },
                    MedicationRules = new List<MedicationCustomsRuleDto>
                    {
                        new MedicationCustomsRuleDto
                        {
                            Id = "med-cannabis",
                            MedicationCategory = "Cannabis & CBD Products",
                            Status = "Strictly_Prohibited",
                            OfficialGuidance = "Bringing cannabis or CBD into or out of Thailand across international borders remains strictly illegal under international customs conventions."
                        },
                        new MedicationCustomsRuleDto
                        {
                            Id = "med-adhd",
                            MedicationCategory = "ADHD Meds (Dexamphetamine, Ritalin)",
                            Status = "Requires_FDA_Permit",
                            OfficialGuidance = "Apply for an online permit from the Thai FDA Narcotics Control Division at least 2 weeks before flying."
                        }
                    }
                };
            }

            // Default: GujjuTours
            return new CultureHubDataDto
            {
                SiteId = "gujjutours",
                DestinationCountry = "Thailand",
                LocalTippingNorms = "Tipping is not customary in street stalls or local markets. In sit-down tourist restaurants, a 10% service charge may already be included. If service was exceptional, leaving 50-100 THB is appreciated.",
                SacredAudioGuideText = "Maintain silence in temple sanctums. Remove leather belts if requested at Hindu Mandir ceremonies. Speak softly.",
                DressCodeRules = new List<DressCodeRuleDto>
                {
                    new DressCodeRuleDto
                    {
                        Id = "dc-grandpalace",
                        SiteType = "Grand_Palace",
                        SiteName = "The Grand Palace & Wat Phra Kaew (Emerald Buddha)",
                        DestinationCountry = "Thailand",
                        ShouldersAllowed = false,
                        ShortsAllowed = false,
                        FootwearPolicy = "Shoes must be removed before stepping into the inner Emerald Buddha sanctum.",
                        HeadwearPolicy = "Remove caps, hats, and sunglasses.",
                        SheerTightClothingAllowed = false,
                        OnSiteCoverupAvailable = true,
                        OnSiteCoverupFee = "Sarongs available outside for 100-200 THB.",
                        KeyRules = new List<string>
                        {
                            "Tops must fully cover shoulders and chest (no sleeveless tops, tank tops, or spaghetti straps)",
                            "Pants or skirts must cover below the knee (no mini skirts or Bermuda shorts)",
                            "No ripped jeans, distress denim, or sheer/see-through fabrics",
                            "Strictly no photography inside the inner prayer hall"
                        }
                    },
                    new DressCodeRuleDto
                    {
                        Id = "dc-watarun",
                        SiteType = "Buddhist_Temple",
                        SiteName = "Wat Arun, Wat Pho & Wat Traimit (Golden Buddha)",
                        DestinationCountry = "Thailand",
                        ShouldersAllowed = false,
                        ShortsAllowed = false,
                        FootwearPolicy = "Slip-on shoes recommended as shoes must be removed before entering viharns.",
                        HeadwearPolicy = "Remove hats inside prayer areas.",
                        SheerTightClothingAllowed = false,
                        OnSiteCoverupAvailable = true,
                        OnSiteCoverupFee = "Temple sarongs available for 50 THB deposit at ticket gate.",
                        KeyRules = new List<string>
                        {
                            "Modest attire covering shoulders and knees",
                            "Never point the soles of your feet toward Buddha images",
                            "Respect devotees lighting incense and offering lotus flowers"
                        }
                    },
                    new DressCodeRuleDto
                    {
                        Id = "dc-mandir-dxb",
                        SiteType = "Hindu_Mandir",
                        SiteName = "BAPS Hindu Mandir Abu Dhabi & Dubai Temple",
                        DestinationCountry = "United Arab Emirates",
                        ShouldersAllowed = false,
                        ShortsAllowed = false,
                        FootwearPolicy = "All footwear deposited at the dedicated shoe counter before ascending the stone steps.",
                        HeadwearPolicy = "Hats and caps removed. Traditional scarves or dupattas welcome.",
                        SheerTightClothingAllowed = false,
                        OnSiteCoverupAvailable = true,
                        OnSiteCoverupFee = "Modesty wrap cloths provided free of charge.",
                        KeyRules = new List<string>
                        {
                            "Cover shoulders and knees (traditional Indian kurta/saree or modest Western pants)",
                            "No sleeveless or transparent tops",
                            "No outside food or drinks allowed inside the temple complex",
                            "Photography permitted in courtyards only; no photography in sanctum during Aarti"
                        }
                    }
                },
                EtiquetteGuidelines = new List<CulturalEtiquetteItemDto>
                {
                    new CulturalEtiquetteItemDto
                    {
                        Id = "eti-monk",
                        Category = "Monks_Royalty",
                        Title = "Monk Interaction & Royal Family Decorum",
                        ShortSummary = "Women must never physically touch a Buddhist monk. Treat royal portraits and Thai baht respectfully.",
                        FullGuidance = "In Thai Buddhism, monks observe strict vows of celibacy and must never physically touch a woman or receive items directly from a woman's hands. Always place offerings on a cloth or tray. Additionally, reverence for the Royal Family is paramount; never speak disrespectfully about the monarchy, and never step on coins or notes bearing royal portraits.",
                        ImportanceLevel = "Critical_Law",
                        IconName = "person",
                        ProhibitedAction = "Touching a monk, sitting next to a monk as a woman, or stepping on Thai currency.",
                        RecommendedAction = "Wai respectfully and offer monks plenty of walking room."
                    },
                    new CulturalEtiquetteItemDto
                    {
                        Id = "eti-headfeet",
                        Category = "Social_Taboos",
                        Title = "Head & Feet Cultural Taboos",
                        ShortSummary = "The head is sacred; feet are spiritually low. Never touch someone's head or point feet at people/altars.",
                        FullGuidance = "In Thai and Indian tradition alike, the head is sacred and pure. Never touch a child or adult's head. The feet are considered the lowest and least clean part; never use feet to point at items, push doors open, or point toward Buddha statues or people. When sitting on the floor in a temple, sit in the 'Phap-phiap' posture (tucking your feet backwards under your legs).",
                        ImportanceLevel = "High_Sacred",
                        IconName = "body",
                        ProhibitedAction = "Pointing feet towards Buddha statues or touching someone's head.",
                        RecommendedAction = "Tuck feet behind you when sitting on the floor in temples."
                    },
                    new CulturalEtiquetteItemDto
                    {
                        Id = "eti-vaping",
                        Category = "Legal_Warnings",
                        Title = "Strict Vaping & E-Cigarette Ban Law",
                        ShortSummary = "E-cigarettes and vapes are strictly illegal in Thailand under the Customs Act.",
                        FullGuidance = "Possession of vapes or e-cigarettes in Thailand can lead to police detention, confiscation, and fines of up to 30,000 THB (~₹70,000 INR). Do not carry vapes or vape pens in your luggage or use them on tourist streets.",
                        ImportanceLevel = "Critical_Law",
                        IconName = "alert-circle",
                        ProhibitedAction = "Carrying or using vapes or e-cigarettes anywhere in Thailand.",
                        RecommendedAction = "Leave all vaping gear at home before your flight."
                    },
                    new CulturalEtiquetteItemDto
                    {
                        Id = "eti-gong",
                        Category = "Sacred_Sites",
                        Title = "Temple Bell & Gong Etiquette",
                        ShortSummary = "Temple bells are for spiritual merit, not tourist play. Strike 3 times mindfully.",
                        FullGuidance = "In temple courtyards, you will find rows of bronze bells and large gongs. Striking bells 3 times represents the Triple Gem of Buddhism (Buddha, Dharma, Sangha) and spreads good karma and positive energy. Never let children strike bells violently or playfully as toys.",
                        ImportanceLevel = "Good_Manners",
                        IconName = "notifications",
                        ProhibitedAction = "Striking temple bells loudly, repeatedly, or disrespectfully.",
                        RecommendedAction = "Gently strike the bell or gong 3 times with mindfulness."
                    }
                },
                MedicationRules = new List<MedicationCustomsRuleDto>
                {
                    new MedicationCustomsRuleDto
                    {
                        Id = "med-adhd",
                        MedicationCategory = "ADHD Stimulants (Methylphenidate, Ritalin)",
                        Status = "Requires_FDA_Permit",
                        OfficialGuidance = "Requires prior online permit application with the Thai FDA Narcotics Control Division at least 14 days before arrival."
                    },
                    new MedicationCustomsRuleDto
                    {
                        Id = "med-painkillers",
                        MedicationCategory = "Strong Pain Relief (Tramadol, Codeine)",
                        Status = "Carry_Doctor_Letter",
                        OfficialGuidance = "Keep in original pharmacy container with patient label, maximum 30 days supply, and signed doctor's letter in English."
                    },
                    new MedicationCustomsRuleDto
                    {
                        Id = "med-cannabis",
                        MedicationCategory = "Cannabis & CBD Oils",
                        Status = "Strictly_Prohibited",
                        OfficialGuidance = "Transporting cannabis or CBD across international borders into or out of Thailand is strictly illegal and subject to arrest."
                    }
                }
            };
        }
    }
}
