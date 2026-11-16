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
    [Route("api/pharmacy")]
    public class PharmacyController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _dbProvider;
        private readonly ILogger<PharmacyController> _logger;

        public PharmacyController(IWebsiteContext websiteContext, IMongoDatabaseProvider dbProvider, ILogger<PharmacyController> logger)
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
        public IActionResult GetPharmacyHub([FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hubData = GetSeedPharmacyHub(resolvedSite);
            return Ok(new { success = true, data = hubData });
        }

        [HttpGet("search")]
        public IActionResult SearchMedicines([FromQuery] string q, [FromQuery] string? siteId = null)
        {
            var resolvedSite = ResolveSiteId(siteId);
            var hubData = GetSeedPharmacyHub(resolvedSite);

            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new { success = true, data = hubData.Medicines });
            }

            var query = q.Trim().ToLowerInvariant();
            var matches = hubData.Medicines.Where(m =>
                m.GenericName.ToLowerInvariant().Contains(query) ||
                m.NativeText.ToLowerInvariant().Contains(query) ||
                m.Phonetic.ToLowerInvariant().Contains(query) ||
                m.Category.ToLowerInvariant().Contains(query) ||
                m.CommonHomeNames.Any(hn => hn.ToLowerInvariant().Contains(query)) ||
                m.LocalBrandNames.Any(lb => lb.ToLowerInvariant().Contains(query)) ||
                m.Symptoms.Any(sym => sym.ToLowerInvariant().Contains(query))
            ).ToList();

            return Ok(new { success = true, data = matches });
        }

        private static PharmacyHubDataDto GetSeedPharmacyHub(string siteId)
        {
            if (siteId == "technoheaven")
            {
                var dubaiMeds = new List<TravelMedicineDto>
                {
                    new TravelMedicineDto
                    {
                        GenericName = "Paracetamol 500mg",
                        CommonHomeNames = new List<string> { "Crocin", "Dolo 650", "Calpol", "Tylenol" },
                        LocalBrandNames = new List<string> { "Panadol Advance", "Panadol Extra", "Adol" },
                        NativeText = "باراسيتامول (بنادول / أدول)",
                        Phonetic = "Paracetamol (Panadol / Adol)",
                        Symptoms = new List<string> { "Headache", "Fever", "Body Pain" },
                        TypicalDosage = "1-2 tablets every 4-6 hours with water (Max 8 tablets/day)",
                        Precautions = "Do not take concurrently with other paracetamol-containing products.",
                        Category = "Fever_Pain"
                    },
                    new TravelMedicineDto
                    {
                        GenericName = "Oral Rehydration Salts (ORS)",
                        CommonHomeNames = new List<string> { "Electral", "Enerzal" },
                        LocalBrandNames = new List<string> { "Dioralyte", "Electrolyte Hydration" },
                        NativeText = "أملاح معالجة الجفاف (ديورالايت)",
                        Phonetic = "Amlah Mu'alajat Al-Jafaf (Dioralyte)",
                        Symptoms = new List<string> { "Dehydration", "Heat Exhaustion", "Diarrhea" },
                        TypicalDosage = "Dissolve 1 sachet into 200ml fresh bottled water",
                        Precautions = "Use bottled water only, never tap water.",
                        Category = "Stomach_Digestion"
                    },
                    new TravelMedicineDto
                    {
                        GenericName = "Dimenhydrinate / Cinnarizine",
                        CommonHomeNames = new List<string> { "Avomine", "Stugeron" },
                        LocalBrandNames = new List<string> { "Dramamine", "Stugeron Forte" },
                        NativeText = "دواء دوار البحر والسيارة (درامامين)",
                        Phonetic = "Dawa' Duwar Al-Bahr (Dramamine)",
                        Symptoms = new List<string> { "Desert Dune Bashing Sickness", "Yacht Nausea", "Motion Sickness" },
                        TypicalDosage = "Take 1 tablet 45 minutes before desert safari or yacht cruise",
                        Precautions = "May cause mild drowsiness; avoid driving.",
                        Category = "Motion_Sickness"
                    },
                    new TravelMedicineDto
                    {
                        GenericName = "Loperamide 2mg",
                        CommonHomeNames = new List<string> { "Imodium", "Lopamide" },
                        LocalBrandNames = new List<string> { "Imodium Plus", "Lopex" },
                        NativeText = "إيموديوم لوقف الإسهال",
                        Phonetic = "Imodium Li-waqf Al-Ishaal",
                        Symptoms = new List<string> { "Sudden Traveler Diarrhea", "Stomach Cramps" },
                        TypicalDosage = "2 capsules initially, then 1 after each loose stool (Max 6/day)",
                        Precautions = "Do not use if blood is present in stool; consult doctor.",
                        Category = "Stomach_Digestion"
                    }
                };

                var dubaiPharmacies = new List<PharmacyDirectoryDto>
                {
                    new PharmacyDirectoryDto
                    {
                        PharmacyName = "Aster Pharmacy 24/7 - Downtown",
                        ChainName = "Aster",
                        City = "Dubai",
                        Address = "Sheikh Mohammed bin Rashid Blvd, Downtown Dubai",
                        Phone = "+971 4 453 7777",
                        IsOpen24Hours = true,
                        OperatingHours = "Open 24 Hours",
                        HasEnglishSpeakingPharmacist = true
                    },
                    new PharmacyDirectoryDto
                    {
                        PharmacyName = "Life Pharmacy 24/7 - Sheikh Zayed Rd",
                        ChainName = "Life",
                        City = "Dubai",
                        Address = "Near Financial Centre Metro Station, Trade Centre 1",
                        Phone = "+971 4 343 4400",
                        IsOpen24Hours = true,
                        OperatingHours = "Open 24 Hours",
                        HasEnglishSpeakingPharmacist = true
                    },
                    new PharmacyDirectoryDto
                    {
                        PharmacyName = "Supercare Pharmacy - Dubai Mall",
                        ChainName = "Supercare",
                        City = "Dubai",
                        Address = "Lower Ground Floor, Near Food Court, Dubai Mall",
                        Phone = "+971 4 339 9898",
                        IsOpen24Hours = false,
                        OperatingHours = "10:00 - 00:00 Daily",
                        HasEnglishSpeakingPharmacist = true
                    }
                };

                var dubaiControlled = new List<ControlledSubstanceWarningDto>
                {
                    new ControlledSubstanceWarningDto
                    {
                        Medication = "Codeine, Tramadol & Sleeping Pills (Zolpidem)",
                        Status = "Strictly Controlled Narcotic in UAE",
                        Rule = "Must have an attested doctor prescription and MoHAP pre-approval prior to arrival."
                    },
                    new ControlledSubstanceWarningDto
                    {
                        Medication = "CBD Oil, Medical Cannabis & Vapes",
                        Status = "Zero Tolerance Banned Substance",
                        Rule = "Bringing any cannabis or CBD derivative into UAE carries severe legal penalties."
                    }
                };

                return new PharmacyHubDataDto
                {
                    SiteId = "technoheaven",
                    City = "Dubai",
                    Medicines = dubaiMeds,
                    Pharmacies = dubaiPharmacies,
                    ControlledSubstances = dubaiControlled,
                    EmergencyDoctorHotline = "+971 800 342 (Dubai Health Authority DHA 24/7)",
                    EmergencyAmbulanceNumber = "998"
                };
            }

            // Default: GujjuTours & TripGoAsia (Bangkok, Thailand)
            var bkkMeds = new List<TravelMedicineDto>
            {
                new TravelMedicineDto
                {
                    GenericName = "Paracetamol 500mg",
                    CommonHomeNames = new List<string> { "Crocin", "Dolo 650", "Calpol", "Tylenol", "Panadol" },
                    LocalBrandNames = new List<string> { "Sara (ซาร่า)", "Tylenol 500", "Biogesic" },
                    NativeText = "ยาพาราเซตามอล (ซาร่า / ไทลินอล)",
                    Phonetic = "Yaa Paa-raa-see-dtaa-mɔɔn (Sara / Tylenol)",
                    Symptoms = new List<string> { "Headache", "Fever", "Muscle Pain", "Hangover" },
                    TypicalDosage = "1-2 tablets every 4-6 hours with water (Max 8 tablets in 24 hours)",
                    Precautions = "Do not take with alcohol. Safe for sensitive stomachs.",
                    Category = "Fever_Pain"
                },
                new TravelMedicineDto
                {
                    GenericName = "Oral Rehydration Salts (ORS)",
                    CommonHomeNames = new List<string> { "Electral", "Enerzal", "ORS Sachet" },
                    LocalBrandNames = new List<string> { "Royal-D (ซองสีส้ม/เหลือง)", "De-Hydrate", "O-Lyte" },
                    NativeText = "ผงเกลือแร่ โออาร์เอส (รอยัล-ดี)",
                    Phonetic = "Pǒng-glʉa-rɛ̂ɛ ORS (Royal-D)",
                    Symptoms = new List<string> { "Dehydration", "Heatstroke", "Watery Diarrhea", "Excessive Sweating" },
                    TypicalDosage = "Dissolve 1 sachet in 250ml of clean bottled water; sip throughout the day",
                    Precautions = "Always dissolve in clean bottled water; never boil after mixing.",
                    Category = "Stomach_Digestion"
                },
                new TravelMedicineDto
                {
                    GenericName = "Dimenhydrinate 50mg (Motion Sickness)",
                    CommonHomeNames = new List<string> { "Avomine", "Dramamine", "Stugeron" },
                    LocalBrandNames = new List<string> { "Dimenhydrinate (เม็ดสีเหลือง)", "Dramamine Thailand" },
                    NativeText = "ยาแก้เมาเรือ เมารถ (ไดเมนไฮดริเนต)",
                    Phonetic = "Yaa gɛ̂ɛ mao-rʉa / mao-rót (Dimenhydrinate)",
                    Symptoms = new List<string> { "Speedboat seasickness", "Island ferry nausea", "Winding mountain van ride" },
                    TypicalDosage = "1 tablet taken 30 minutes before boarding boat or vehicle",
                    Precautions = "Causes mild drowsiness. Avoid operating scooters.",
                    Category = "Motion_Sickness"
                },
                new TravelMedicineDto
                {
                    GenericName = "Activated Charcoal (Ultracarbon) & Loperamide",
                    CommonHomeNames = new List<string> { "Imodium", "Lopamide", "Norflox-TZ", "Charcoal Caps" },
                    LocalBrandNames = new List<string> { "Ultracarbon (เม็ดคาร์บอน)", "Imodium Thailand", "Disento" },
                    NativeText = "ยาแก้ท้องเสีย / เม็ดคาร์บอนดูดสารพิษ",
                    Phonetic = "Yaa gɛ̂ɛ tɔ́ɔng-sǐa / Mèt carbon dùut săan-pít",
                    Symptoms = new List<string> { "Spicy Street Food Diarrhea", "Food Poisoning", "Bloating & Gas" },
                    TypicalDosage = "Take 2 Ultracarbon black tablets with a full glass of water. Wait 2 hours before other meds.",
                    Precautions = "Charcoal absorbs other medications; space doses by at least 2 hours.",
                    Category = "Stomach_Digestion"
                },
                new TravelMedicineDto
                {
                    GenericName = "Cetirizine 10mg / Loratadine (Antihistamine)",
                    CommonHomeNames = new List<string> { "Allegra", "Cetcip", "Cetzine", "Claritin" },
                    LocalBrandNames = new List<string> { "Zyrtec Thailand", "Cetirizine GPO", "Claritin" },
                    NativeText = "ยาแก้แพ้ แก้คัน ยุงกัด (เซทิริซีน)",
                    Phonetic = "Yaa gɛ̂ɛ-pɛ́ɛ gɛ̂ɛ kan yung-gàt (Cetirizine)",
                    Symptoms = new List<string> { "Tropical Mosquito Bite Hives", "Seafood Allergy", "Runny Nose", "Sun Rash" },
                    TypicalDosage = "1 tablet once daily in the evening",
                    Precautions = "Consult a physician immediately if facial swelling or difficulty breathing occurs.",
                    Category = "Allergy_Bites"
                },
                new TravelMedicineDto
                {
                    GenericName = "Povidone Iodine & Herbal Tiger Balm",
                    CommonHomeNames = new List<string> { "Betadine", "Dettol", "Soframycin", "Zandu Balm" },
                    LocalBrandNames = new List<string> { "Betadine Solution", "Tiger Balm White/Red", "Counterpain Cool" },
                    NativeText = "ยาใส่แผลสด เบตาดีน และ ยาหม่องตราเสือ",
                    Phonetic = "Yaa sài plɛ̌ɛ-sòt Betadine lɛ́ Yaa-mɔ̀ɔng Dtraa Sʉ̌a",
                    Symptoms = new List<string> { "Coral reef cuts", "Minor scrapes", "Sore walking legs", "Insect sting itch" },
                    TypicalDosage = "Apply topically to clean skin. For cuts, rinse with bottled water first.",
                    Precautions = "Do not apply Tiger Balm on open wounds.",
                    Category = "First_Aid"
                }
            };

            var bkkPharmacies = new List<PharmacyDirectoryDto>
            {
                new PharmacyDirectoryDto
                {
                    PharmacyName = "Boots 24/7 - Sukhumvit Soi 11",
                    ChainName = "Boots",
                    City = "Bangkok",
                    Address = "Sukhumvit Soi 11, Nana BTS Station (Exit 3)",
                    Phone = "+66 2 651 0422",
                    IsOpen24Hours = true,
                    OperatingHours = "Open 24 Hours",
                    HasEnglishSpeakingPharmacist = true
                },
                new PharmacyDirectoryDto
                {
                    PharmacyName = "Fascino Pharmacy 24/7 - Silom",
                    ChainName = "Fascino",
                    City = "Bangkok",
                    Address = "Silom Road (Opposite BNH Hospital, near Sala Daeng BTS)",
                    Phone = "+66 2 233 8000",
                    IsOpen24Hours = true,
                    OperatingHours = "Open 24 Hours",
                    HasEnglishSpeakingPharmacist = true
                },
                new PharmacyDirectoryDto
                {
                    PharmacyName = "Boots Pharmacy - Siam Paragon",
                    ChainName = "Boots",
                    City = "Bangkok",
                    Address = "Gourmet Market Floor (B1), Siam Paragon Shopping Centre",
                    Phone = "+66 2 610 7600",
                    IsOpen24Hours = false,
                    OperatingHours = "10:00 - 22:00 Daily",
                    HasEnglishSpeakingPharmacist = true
                },
                new PharmacyDirectoryDto
                {
                    PharmacyName = "Watsons Pharmacy - CentralWorld",
                    ChainName = "Watsons",
                    City = "Bangkok",
                    Address = "1st Floor, CentralWorld Shopping Mall, Ratchadamri Rd",
                    Phone = "+66 2 255 9555",
                    IsOpen24Hours = false,
                    OperatingHours = "10:00 - 22:00 Daily",
                    HasEnglishSpeakingPharmacist = true
                }
            };

            var bkkControlled = new List<ControlledSubstanceWarningDto>
            {
                new ControlledSubstanceWarningDto
                {
                    Medication = "Pseudoephedrine (Actifed / Sudafed Cold Meds)",
                    Status = "Category II Strictly Controlled Narcotic",
                    Rule = "Illegal to import into Thailand. If bought locally, only hospital doctors may prescribe it."
                },
                new ControlledSubstanceWarningDto
                {
                    Medication = "Codeine, Tramadol & Sleeping Pills (Zolpidem / Xanax)",
                    Status = "Psychotropic Substance Category II",
                    Rule = "Requires an English official doctor prescription stating diagnosis and maximum 30-day quantity."
                },
                new ControlledSubstanceWarningDto
                {
                    Medication = "ADHD Meds (Adderall / Dextroamphetamine)",
                    Status = "Prohibited Import Without Thai FDA Permit",
                    Rule = "Must declare to Thai Customs and apply for import permit online 14 days before flight."
                }
            };

            return new PharmacyHubDataDto
            {
                SiteId = siteId,
                City = "Bangkok",
                Medicines = bkkMeds,
                Pharmacies = bkkPharmacies,
                ControlledSubstances = bkkControlled,
                EmergencyDoctorHotline = "+66 2 022 0700 (BNH Hospital 24/7 Tourist Medical Hotline)",
                EmergencyAmbulanceNumber = "1669"
            };
        }
    }
}
