using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/phrasebook")]
    public class PhrasebookController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _databaseProvider;

        public PhrasebookController(IWebsiteContext websiteContext, IMongoDatabaseProvider databaseProvider)
        {
            _websiteContext = websiteContext;
            _databaseProvider = databaseProvider;
        }

        [HttpGet]
        public async Task<IActionResult> GetPhrasebook([FromQuery] string? category, [FromQuery] string? search)
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<DestinationPhrasebook>("destination_phrasebooks");

                var filter = Builders<DestinationPhrasebook>.Filter.Eq(p => p.WebsiteId, siteId);
                var existing = await collection.Find(filter).FirstOrDefaultAsync(cts.Token);

                if (existing != null)
                {
                    var dto = MapToDto(existing, category, search);
                    return Ok(new
                    {
                        success = true,
                        siteId,
                        data = dto
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PhrasebookController] Non-fatal Mongo fetch exception: {ex.Message}");
            }

            var seed = GetSeedPhrasebook(siteId, category, search);
            return Ok(new
            {
                success = true,
                siteId,
                data = seed
            });
        }

        private static DestinationPhrasebookDto MapToDto(DestinationPhrasebook model, string? category, string? search)
        {
            var phrases = model.Phrases.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(category) && category.ToLowerInvariant() != "all")
            {
                phrases = phrases.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLowerInvariant();
                phrases = phrases.Where(p =>
                    p.EnglishText.ToLowerInvariant().Contains(q) ||
                    p.PhoneticText.ToLowerInvariant().Contains(q) ||
                    p.TargetScriptText.ToLowerInvariant().Contains(q) ||
                    p.CulturalContextNote.ToLowerInvariant().Contains(q)
                );
            }

            var list = phrases.ToList();
            var categories = model.Phrases.Select(p => p.Category).Distinct().ToList();

            return new DestinationPhrasebookDto
            {
                SiteId = model.WebsiteId,
                LanguageName = model.LanguageName,
                NativeLanguageName = model.NativeLanguageName,
                RegionDescription = model.RegionDescription,
                TotalPhrases = list.Count,
                Categories = categories,
                BargainingTip = model.BargainingTip,
                EtiquetteTip = model.EtiquetteTip,
                Phrases = list
            };
        }

        private static DestinationPhrasebookDto GetSeedPhrasebook(string siteId, string? category, string? search)
        {
            DestinationPhrasebookDto phrasebook = siteId switch
            {
                "tripgoasia" => GetTripGoAsiaPhrasebook(),
                "technoheaven" => GetTechnoheavenPhrasebook(),
                _ => GetGujjuToursPhrasebook()
            };

            var phrases = phrasebook.Phrases.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(category) && category.ToLowerInvariant() != "all")
            {
                phrases = phrases.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLowerInvariant();
                phrases = phrases.Where(p =>
                    p.EnglishText.ToLowerInvariant().Contains(q) ||
                    p.PhoneticText.ToLowerInvariant().Contains(q) ||
                    p.TargetScriptText.ToLowerInvariant().Contains(q) ||
                    p.CulturalContextNote.ToLowerInvariant().Contains(q)
                );
            }

            phrasebook.Phrases = phrases.ToList();
            phrasebook.TotalPhrases = phrasebook.Phrases.Count;
            return phrasebook;
        }

        private static DestinationPhrasebookDto GetGujjuToursPhrasebook()
        {
            return new DestinationPhrasebookDto
            {
                SiteId = "gujjutours",
                LanguageName = "Gujarati & Kathiyawadi Dialects",
                NativeLanguageName = "ગુજરાતી ભાષા",
                RegionDescription = "Spoken throughout Saurashtra, Dwarka, Somnath, Gir, and Gujarat",
                BargainingTip = "In handicraft bazaars, courteous bargaining with a warm smile is customary. Say 'ભાઈ, થોડું વ્યાજબી કરો ને!' (Please offer a fair price).",
                EtiquetteTip = "Greet temple priests and elders with 'જય શ્રી કૃષ્ણ' (Jai Shree Krishna) with folded hands. Remove shoes before entering sanctums.",
                Categories = new List<string> { "Essentials", "Dietary & Food", "Shopping & Bargaining", "Transport & Directions", "Temple & Etiquette", "Emergency" },
                Phrases = new List<PhraseItemDto>
                {
                    new() { PhraseId = "guj-01", Category = "Essentials", EnglishText = "Greetings / Hello (Sacred)", TargetScriptText = "જય શ્રી કૃષ્ણ", PhoneticText = "Jai Shree Krishna", CulturalContextNote = "Traditional respectful Gujarati greeting with folded hands", IsDietarySafe = false },
                    new() { PhraseId = "guj-02", Category = "Essentials", EnglishText = "Thank you very much", TargetScriptText = "ખૂબ ખૂબ આભાર", PhoneticText = "Khoob khoob aabhaar", CulturalContextNote = "Warm expression of polite gratitude", IsDietarySafe = false },
                    new() { PhraseId = "guj-03", Category = "Essentials", EnglishText = "How are you?", TargetScriptText = "તમે કેમ છો?", PhoneticText = "Tame kem chho?", CulturalContextNote = "Use with elders or friendly locals", IsDietarySafe = false },
                    new() { PhraseId = "guj-04", Category = "Dietary & Food", EnglishText = "Strictly no onion and no garlic (Jain food)?", TargetScriptText = "આમાં કાંદા કે લસણ વગરનું જૈન ભોજન મળશે?", PhoneticText = "Aama kanda ke lasan vagarnu Jain bhojan malshe?", CulturalContextNote = "Essential flashcard for pure Jain dietary requirements", IsDietarySafe = true },
                    new() { PhraseId = "guj-05", Category = "Dietary & Food", EnglishText = "Is this 100% Pure Vegetarian?", TargetScriptText = "આ શુદ્ધ શાકાહારી છે ને?", PhoneticText = "Aa shuddh shaakahari chhe ne?", CulturalContextNote = "Verifies 100% pure vegetarian preparation", IsDietarySafe = true },
                    new() { PhraseId = "guj-06", Category = "Dietary & Food", EnglishText = "Please do not make it too spicy", TargetScriptText = "વધારે તીખું ના બનાવતા, મધ્યમ રાખજો", PhoneticText = "Vadhare teekhu na banavta, madhyam rakhjo", CulturalContextNote = "Requests pleasant, mild spice levels", IsDietarySafe = true },
                    new() { PhraseId = "guj-07", Category = "Shopping & Bargaining", EnglishText = "How much does this cost?", TargetScriptText = "આના કેટલા રૂપિયા થશે?", PhoneticText = "Aana ketla rupiya thashe?", CulturalContextNote = "Direct polite price inquiry in markets", IsDietarySafe = false },
                    new() { PhraseId = "guj-08", Category = "Shopping & Bargaining", EnglishText = "Please give me a fair price / discount", TargetScriptText = "ભાઈ, થોડું વ્યાજબી કરો ને!", PhoneticText = "Bhai, thodu vyaajbi karo ne!", CulturalContextNote = "Friendly, polite negotiation phrase", IsDietarySafe = false },
                    new() { PhraseId = "guj-09", Category = "Shopping & Bargaining", EnglishText = "Do you accept UPI / Google Pay?", TargetScriptText = "અહીં UPI કે Google Pay ચાલશે?", PhoneticText = "Ahi UPI ke Google Pay chalshe?", CulturalContextNote = "Widely accepted digital payment check", IsDietarySafe = false },
                    new() { PhraseId = "guj-10", Category = "Transport & Directions", EnglishText = "Please take us to the main temple", TargetScriptText = "અમને મુખ્ય મંદિર પાસે લઈ જાઓ", PhoneticText = "Amne mukhya mandir paase lai jaao", CulturalContextNote = "Clear direction for taxi/auto drivers", IsDietarySafe = false },
                    new() { PhraseId = "guj-11", Category = "Temple & Etiquette", EnglishText = "What time is the evening aarti?", TargetScriptText = "સાંજની આરતી અને દર્શનનો સમય શું છે?", PhoneticText = "Sanjni aarti ane darshanno samay shu chhe?", CulturalContextNote = "Temple schedule inquiry", IsDietarySafe = false },
                    new() { PhraseId = "guj-12", Category = "Emergency", EnglishText = "Please help! Where is the nearest hospital?", TargetScriptText = "કૃપા કરીને મદદ કરો, નજીકની હોસ્પિટલ ક્યાં છે?", PhoneticText = "Krupa karine madad karo, najikni hospital kya chhe?", CulturalContextNote = "Urgent medical emergency assistance", IsDietarySafe = false }
                }
            };
        }

        private static DestinationPhrasebookDto GetTripGoAsiaPhrasebook()
        {
            return new DestinationPhrasebookDto
            {
                SiteId = "tripgoasia",
                LanguageName = "Central Thai & Island Dialects",
                NativeLanguageName = "ภาษาไทย",
                RegionDescription = "Spoken across Bangkok, Phuket, Koh Phi Phi, and Southern Thailand",
                BargainingTip = "In night markets and street stalls, bargaining is polite and cheerful. Always end with 'krub' (male) or 'ka' (female). Counter-offer around 20-30% below initial price.",
                EtiquetteTip = "Greet with the 'Wai' (pressing palms together near chest). Never touch anyone's head or point your feet towards Buddhist shrines.",
                Categories = new List<string> { "Essentials", "Dietary & Food", "Shopping & Bargaining", "Transport & Directions", "Temple & Etiquette", "Emergency" },
                Phrases = new List<PhraseItemDto>
                {
                    new() { PhraseId = "tha-01", Category = "Essentials", EnglishText = "Hello / Good Day (Male)", TargetScriptText = "สวัสดีครับ", PhoneticText = "Sawasdee krub", CulturalContextNote = "Universal polite greeting spoken by males", IsDietarySafe = false },
                    new() { PhraseId = "tha-02", Category = "Essentials", EnglishText = "Hello / Good Day (Female)", TargetScriptText = "สวัสดีค่ะ", PhoneticText = "Sawasdee ka", CulturalContextNote = "Universal polite greeting spoken by females", IsDietarySafe = false },
                    new() { PhraseId = "tha-03", Category = "Essentials", EnglishText = "Thank you very much", TargetScriptText = "ขอบคุณมากครับ/ค่ะ", PhoneticText = "Khop khun maak krub/ka", CulturalContextNote = "Heartfelt expression of gratitude", IsDietarySafe = false },
                    new() { PhraseId = "tha-04", Category = "Dietary & Food", EnglishText = "I eat 100% Pure Vegetarian / Vegan (Jay)", TargetScriptText = "กินเจ ไม่ใส่เนื้อสัตว์", PhoneticText = "Gin Jay, mai sai nuea sat", CulturalContextNote = "'Jay' guarantees zero meat, no fish sauce, and no eggs", IsDietarySafe = true },
                    new() { PhraseId = "tha-05", Category = "Dietary & Food", EnglishText = "Is this food Halal certified?", TargetScriptText = "อาหารนี้ฮาลาลไหมครับ/ค่ะ?", PhoneticText = "Aa-haan nee halal mai krub/ka?", CulturalContextNote = "Halal dietary inquiry for Muslim travelers", IsDietarySafe = true },
                    new() { PhraseId = "tha-06", Category = "Dietary & Food", EnglishText = "Please do NOT make it spicy!", TargetScriptText = "ไม่เผ็ดเลยนะครับ/ค่ะ", PhoneticText = "Mai phet loey na krub/ka", CulturalContextNote = "Critical request for zero chili / mild cooking", IsDietarySafe = true },
                    new() { PhraseId = "tha-07", Category = "Dietary & Food", EnglishText = "No fish sauce and no oyster sauce", TargetScriptText = "ไม่ใส่น้ำปลาและน้ำมันหอย", PhoneticText = "Mai sai nam pla lae nam man hoi", CulturalContextNote = "Prevents seafood paste in vegetable dishes", IsDietarySafe = true },
                    new() { PhraseId = "tha-08", Category = "Shopping & Bargaining", EnglishText = "How much is this?", TargetScriptText = "อันนี้ราคาเท่าไหร่ครับ/ค่ะ?", PhoneticText = "An nee ra-ka thao rai krub/ka?", CulturalContextNote = "Standard price inquiry in Thai markets", IsDietarySafe = false },
                    new() { PhraseId = "tha-09", Category = "Shopping & Bargaining", EnglishText = "Can you discount this for me?", TargetScriptText = "ลดราคาหน่อยได้ไหมครับ/ค่ะ?", PhoneticText = "Lod ra-ka noi dai mai krub/ka?", CulturalContextNote = "Polite bargaining with friendly smile", IsDietarySafe = false },
                    new() { PhraseId = "tha-10", Category = "Transport & Directions", EnglishText = "Please turn on the meter", TargetScriptText = "เปิดมิเตอร์ด้วยครับ/ค่ะ", PhoneticText = "Perd meter duay krub/ka", CulturalContextNote = "Ensures fair taxi fare in Bangkok & Phuket", IsDietarySafe = false },
                    new() { PhraseId = "tha-11", Category = "Transport & Directions", EnglishText = "Please take me to the speedboat pier", TargetScriptText = "ไปท่าเรือสปีดโบ๊ทครับ/ค่ะ", PhoneticText = "Pai tha ruea speedboat krub/ka", CulturalContextNote = "Island transfer direction", IsDietarySafe = false },
                    new() { PhraseId = "tha-12", Category = "Emergency", EnglishText = "Please call an ambulance / doctor!", TargetScriptText = "ช่วยเรียกรถพยาบาลด้วยครับ/ค่ะ!", PhoneticText = "Chuay riak rot pha-ya-baan duay krub/ka!", CulturalContextNote = "Urgent medical emergency phrase", IsDietarySafe = false }
                }
            };
        }

        private static DestinationPhrasebookDto GetTechnoheavenPhrasebook()
        {
            return new DestinationPhrasebookDto
            {
                SiteId = "technoheaven",
                LanguageName = "Modern Standard & Gulf Arabic",
                NativeLanguageName = "اللغة العربية الخليجية",
                RegionDescription = "Spoken across Dubai, Abu Dhabi, and the United Arab Emirates",
                BargainingTip = "In the Gold and Spice Souks of Deira, courteous bargaining is expected. In luxury malls, prices are fixed. Ask politely: 'هل يمكن إعطائي أفضل سعر؟' (Can you offer your best price?).",
                EtiquetteTip = "Greet with 'As-salamu alaykum'. Accept Arabic coffee and dates with your right hand. Dress with respectful modesty in heritage districts and mosques.",
                Categories = new List<string> { "Essentials", "Dietary & Food", "Shopping & Bargaining", "Transport & Directions", "Temple & Etiquette", "Emergency" },
                Phrases = new List<PhraseItemDto>
                {
                    new() { PhraseId = "ara-01", Category = "Essentials", EnglishText = "Peace be upon you (Formal Greeting)", TargetScriptText = "السلام عليكم", PhoneticText = "As-salamu alaykum", CulturalContextNote = "Universal polite Arabic greeting", IsDietarySafe = false },
                    new() { PhraseId = "ara-02", Category = "Essentials", EnglishText = "And upon you be peace (Reply)", TargetScriptText = "وعليكم السلام", PhoneticText = "Wa alaykum as-salam", CulturalContextNote = "Respectful response", IsDietarySafe = false },
                    new() { PhraseId = "ara-03", Category = "Essentials", EnglishText = "Thank you very much", TargetScriptText = "شكراً جزيلاً", PhoneticText = "Shukran jazeelan", CulturalContextNote = "Polite and warm gratitude", IsDietarySafe = false },
                    new() { PhraseId = "ara-04", Category = "Dietary & Food", EnglishText = "Is all meat 100% Halal certified?", TargetScriptText = "هل جميع اللحوم حلال ١٠٠٪؟", PhoneticText = "Hal jamee' al-luhoom halal 100%?", CulturalContextNote = "Confirms Halal authenticity", IsDietarySafe = true },
                    new() { PhraseId = "ara-05", Category = "Dietary & Food", EnglishText = "Vegetarian food without meat please", TargetScriptText = "طعام نباتي بدون لحوم من فضلك", PhoneticText = "Ta'am nabati bidoon luhoom min fadlak", CulturalContextNote = "Pure vegetarian dining request", IsDietarySafe = true },
                    new() { PhraseId = "ara-06", Category = "Dietary & Food", EnglishText = "Traditional Arabic coffee with dates please", TargetScriptText = "قهوة عربية مع التمر من فضلك", PhoneticText = "Qahwah arabiyyah ma'a al-tamr min fadlak", CulturalContextNote = "Classic Emirati hospitality staple", IsDietarySafe = true },
                    new() { PhraseId = "ara-07", Category = "Shopping & Bargaining", EnglishText = "How much is this, please?", TargetScriptText = "كم هذا من فضلك؟", PhoneticText = "Kam hatha min fadlak?", CulturalContextNote = "Direct inquiry in the Gold & Spice Souks", IsDietarySafe = false },
                    new() { PhraseId = "ara-08", Category = "Shopping & Bargaining", EnglishText = "Can you give me the best VIP price?", TargetScriptText = "هل يمكن إعطائي أفضل سعر ممكن؟", PhoneticText = "Hal yumkin i'ta'i afdal si'r mumkin?", CulturalContextNote = "Courteous negotiation in souks", IsDietarySafe = false },
                    new() { PhraseId = "ara-09", Category = "Transport & Directions", EnglishText = "To Downtown Dubai / Burj Khalifa please", TargetScriptText = "إلى وسط مدينة دبي / برج خليفة من فضلك", PhoneticText = "Ila wast madeenat Dubai / Burj Khalifa min fadlak", CulturalContextNote = "Clear direction for executive chauffeur", IsDietarySafe = false },
                    new() { PhraseId = "ara-10", Category = "Transport & Directions", EnglishText = "Where is the VIP Valet parking?", TargetScriptText = "أين موقف سيارات كبار الشخصيات؟", PhoneticText = "Ayna mawqif sayyarat kibar al-shakhsiyyat?", CulturalContextNote = "Locates VIP valet arrival lane", IsDietarySafe = false },
                    new() { PhraseId = "ara-11", Category = "Emergency", EnglishText = "Emergency! Please help me!", TargetScriptText = "طوارئ! ساعدني من فضلك!", PhoneticText = "Tawari'! Sa'idni min fadlak!", CulturalContextNote = "Urgent emergency assistance call", IsDietarySafe = false }
                }
            };
        }
    }
}
