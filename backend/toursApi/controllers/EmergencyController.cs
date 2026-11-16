using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers
{
    [ApiController]
    [Route("api/emergency")]
    public class EmergencyController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;

        public EmergencyController(IWebsiteContext websiteContext)
        {
            _websiteContext = websiteContext;
        }

        [HttpGet("contacts")]
        public IActionResult GetEmergencyContacts()
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";

            if (siteId.Contains("tripgo"))
            {
                var tripGoResponse = new EmergencyDirectoryResponseDto
                {
                    Success = true,
                    SiteId = siteId,
                    DestinationRegion = "Southeast Asia (Thailand, Vietnam, Bali)",
                    BrandHotline = "+66 81 234 5678",
                    BrandHotlineLabel = "TripGoAsia Island Operations Marshall (24/7)",
                    EmergencyHotlines = new List<EmergencyContactItem>
                    {
                        new EmergencyContactItem
                        {
                            Title = "Thailand Tourist Police (English Speaking)",
                            Number = "1155",
                            Category = "helpline",
                            Description = "Official nationwide English-speaking tourist police across Phuket, Krabi, Bangkok & Samui",
                            IsTollFree = true
                        },
                        new EmergencyContactItem
                        {
                            Title = "National Emergency Ambulance & Medical",
                            Number = "1669",
                            Category = "medical",
                            Description = "Ministry of Public Health 24/7 Emergency Medical Response",
                            IsTollFree = true
                        },
                        new EmergencyContactItem
                        {
                            Title = "Royal Thai Police Emergency",
                            Number = "191",
                            Category = "police",
                            Description = "Central dispatch for public safety and local police patrol units",
                            IsTollFree = true
                        },
                        new EmergencyContactItem
                        {
                            Title = "Marine & Coastal Water Rescue Center",
                            Number = "1196",
                            Category = "marine",
                            Description = "Speedboat, sea diving, and island water emergency coastal guard",
                            IsTollFree = true
                        },
                        new EmergencyContactItem
                        {
                            Title = "Vietnam National Tourist Assistance",
                            Number = "+84 24 3825 7080",
                            Category = "helpline",
                            Description = "Vietnam National Administration of Tourism international hotline"
                        },
                        new EmergencyContactItem
                        {
                            Title = "Bali Tourist Police Command",
                            Number = "+62 361 754 590",
                            Category = "police",
                            Description = "Badung & Denpasar Bali dedicated tourist safety division"
                        }
                    },
                    Hospitals = new List<EmergencyHospitalItem>
                    {
                        new EmergencyHospitalItem
                        {
                            Name = "Bangkok Hospital Phuket (JCI Accredited)",
                            City = "Phuket",
                            Phone = "+66 76 254 444",
                            Address = "2/1 Hongyok Utis Rd, Mueang Phuket District, Phuket 83000",
                            EmergencyHours = "24/7 Level 1 Trauma & Multilingual International Center"
                        },
                        new EmergencyHospitalItem
                        {
                            Name = "Krabi International Hospital",
                            City = "Krabi",
                            Phone = "+66 75 626 555",
                            Address = "Utarakit Rd, Pak Nam, Mueang Krabi District, Krabi 81000",
                            EmergencyHours = "24/7 Emergency & Hyperbaric Decompression Chamber"
                        },
                        new EmergencyHospitalItem
                        {
                            Name = "BIMC Hospital Nusa Dua",
                            City = "Bali",
                            Phone = "+62 361 300 0911",
                            Address = "Kawasan ITDC Blok D, Benoa, South Kuta, Badung, Bali 80363",
                            EmergencyHours = "24/7 International Emergency Care & Medical Evacuation"
                        }
                    },
                    SafetyPhrases = new List<EmergencyPhraseItem>
                    {
                        new EmergencyPhraseItem
                        {
                            English = "Please help me!",
                            LocalScript = "ช่วยฉันด้วย!",
                            Phonetic = "Chuay chan duay!",
                            Category = "police"
                        },
                        new EmergencyPhraseItem
                        {
                            English = "I need an ambulance immediately.",
                            LocalScript = "ฉันต้องการรถพยาบาลด่วน",
                            Phonetic = "Chan tong-kan rot phaya-ban duan",
                            Category = "medical"
                        },
                        new EmergencyPhraseItem
                        {
                            English = "Take me to the nearest international hospital.",
                            LocalScript = "พาฉันไปโรงพยาบาลที่ใกล้ที่สุด",
                            Phonetic = "Pha chan pai rong-phayaban thee klai thee-soot",
                            Category = "medical"
                        },
                        new EmergencyPhraseItem
                        {
                            English = "I am a tourist with TripGoAsia.",
                            LocalScript = "ฉันเป็นนักท่องเที่ยวกับ TripGoAsia",
                            Phonetic = "Chan pen nak-thong-thiew kap TripGoAsia",
                            Category = "police"
                        }
                    }
                };

                return Ok(new { success = true, data = tripGoResponse });
            }

            if (siteId.Contains("techno"))
            {
                var technoResponse = new EmergencyDirectoryResponseDto
                {
                    Success = true,
                    SiteId = siteId,
                    DestinationRegion = "United Arab Emirates & Gulf States",
                    BrandHotline = "+971 50 123 4567",
                    BrandHotlineLabel = "Technoheaven VIP Private Client Operations Desk (24/7)",
                    EmergencyHotlines = new List<EmergencyContactItem>
                    {
                        new EmergencyContactItem
                        {
                            Title = "Dubai Police Emergency",
                            Number = "999",
                            Category = "police",
                            Description = "Direct police response and public emergency dispatch",
                            IsTollFree = true
                        },
                        new EmergencyContactItem
                        {
                            Title = "National Ambulance Service",
                            Number = "998",
                            Category = "medical",
                            Description = "Emergency medical response and trauma ambulance",
                            IsTollFree = true
                        },
                        new EmergencyContactItem
                        {
                            Title = "Civil Defense (Fire & Rescue)",
                            Number = "997",
                            Category = "police",
                            Description = "Fire and technical disaster rescue division",
                            IsTollFree = true
                        },
                        new EmergencyContactItem
                        {
                            Title = "Dubai Police Tourist Security Department",
                            Number = "901",
                            Category = "helpline",
                            Description = "Non-emergency assistance, tourist inquiries, and lost property command",
                            IsTollFree = true
                        },
                        new EmergencyContactItem
                        {
                            Title = "Coast Guard Maritime Emergency",
                            Number = "996",
                            Category = "marine",
                            Description = "Yachting, coastal, and offshore maritime rescue services",
                            IsTollFree = true
                        }
                    },
                    Hospitals = new List<EmergencyHospitalItem>
                    {
                        new EmergencyHospitalItem
                        {
                            Name = "American Hospital Dubai",
                            City = "Dubai",
                            Phone = "+971 4 377 5500",
                            Address = "19th St, Oud Metha, Dubai, UAE",
                            EmergencyHours = "24/7 Mayo Clinic Care Network Emergency Department"
                        },
                        new EmergencyHospitalItem
                        {
                            Name = "Mediclinic City Hospital",
                            City = "Dubai Healthcare City",
                            Phone = "+971 4 435 9999",
                            Address = "Building 37, 26th St, Dubai Healthcare City, Dubai, UAE",
                            EmergencyHours = "24/7 Advanced Trauma & VIP Emergency Wing"
                        },
                        new EmergencyHospitalItem
                        {
                            Name = "Cleveland Clinic Abu Dhabi",
                            City = "Abu Dhabi",
                            Phone = "+971 2 659 0200",
                            Address = "Al Maryah Island, Abu Dhabi, UAE",
                            EmergencyHours = "24/7 State-of-the-art Emergency Medicine Institute"
                        }
                    },
                    SafetyPhrases = new List<EmergencyPhraseItem>
                    {
                        new EmergencyPhraseItem
                        {
                            English = "I require urgent medical assistance.",
                            LocalScript = "أحتاج إلى مساعدة طبية عاجلة",
                            Phonetic = "Ahtaaju ilaa musaa'adah tibbiyyah 'aajilah",
                            Category = "medical"
                        },
                        new EmergencyPhraseItem
                        {
                            English = "Please contact the tourist police.",
                            LocalScript = "يرجى الاتصال بالشرطة السياحية",
                            Phonetic = "Yurja al-ittisaal bi-shurtat as-siyaahiyyah",
                            Category = "police"
                        },
                        new EmergencyPhraseItem
                        {
                            English = "Take me to American Hospital Dubai.",
                            LocalScript = "خذني إلى المستشفى الأمريكي بدبي",
                            Phonetic = "Khuth-nee ilaa al-mustashfaa al-amreekee bi-Dubai",
                            Category = "medical"
                        }
                    }
                };

                return Ok(new { success = true, data = technoResponse });
            }

            // Default: GujjuTours
            var gujjuResponse = new EmergencyDirectoryResponseDto
            {
                Success = true,
                SiteId = siteId,
                DestinationRegion = "Gujarat & North India Heritage Pilgrimages",
                BrandHotline = "+91 98250 12345",
                BrandHotlineLabel = "GujjuTours 24/7 Central Operations Control & Tour Marshall",
                EmergencyHotlines = new List<EmergencyContactItem>
                {
                    new EmergencyContactItem
                    {
                        Title = "National Emergency Response (All-in-One)",
                        Number = "112",
                        Category = "police",
                        Description = "Single unified national emergency number for Police, Ambulance & Fire across India",
                        IsTollFree = true
                    },
                    new EmergencyContactItem
                    {
                        Title = "Gujarat 108 Emergency Ambulance",
                        Number = "108",
                        Category = "medical",
                        Description = "Rapid medical response with GPS-tracked emergency life support ambulances",
                        IsTollFree = true
                    },
                    new EmergencyContactItem
                    {
                        Title = "Ministry of Tourism 24/7 Tourist Infoline",
                        Number = "1363",
                        Category = "helpline",
                        Description = "Government of India 24/7 toll-free tourist helpline in 12 languages including English & Gujarati",
                        IsTollFree = true
                    },
                    new EmergencyContactItem
                    {
                        Title = "Gujarat State Police Control Room",
                        Number = "100",
                        Category = "police",
                        Description = "Immediate police dispatch for roadside security or lost belongings",
                        IsTollFree = true
                    },
                    new EmergencyContactItem
                    {
                        Title = "Women Safety Helpline (181 Abhayam)",
                        Number = "181",
                        Category = "helpline",
                        Description = "Gujarat state dedicated 24/7 women safety and counseling patrol",
                        IsTollFree = true
                    }
                },
                Hospitals = new List<EmergencyHospitalItem>
                {
                    new EmergencyHospitalItem
                    {
                        Name = "Sterling Hospital Ahmedabad (NABH Accredited)",
                        City = "Ahmedabad",
                        Phone = "+91 79 4001 1111",
                        Address = "Sterling Hospital Rd, Memnagar, Ahmedabad, Gujarat 380052",
                        EmergencyHours = "24/7 Multi-Speciality Emergency Trauma & Cardiac Center"
                    },
                    new EmergencyHospitalItem
                    {
                        Name = "Dwarka Civil General Hospital",
                        City = "Dwarka",
                        Phone = "+91 2892 234321",
                        Address = "Near Station Road, Devbhumi Dwarka, Gujarat 361335",
                        EmergencyHours = "24/7 Pilgrim Emergency & Trauma Unit"
                    },
                    new EmergencyHospitalItem
                    {
                        Name = "Apollo Hospitals International Gandhinagar",
                        City = "Gandhinagar / Ahmedabad",
                        Phone = "+91 79 6670 1800",
                        Address = "Plot No. 1A, GIDC Estate, Bhat, Gandhinagar, Gujarat 382428",
                        EmergencyHours = "24/7 Emergency Care & Air Ambulance Helipad"
                    }
                },
                SafetyPhrases = new List<EmergencyPhraseItem>
                {
                    new EmergencyPhraseItem
                    {
                        English = "Please help me, it is an emergency!",
                        LocalScript = "કૃપા કરીને મને મદદ કરો, ઈમરજન્સી છે!",
                        Phonetic = "Krupa kari-ne mane madad karo, emergency chhe!",
                        Category = "police"
                    },
                    new EmergencyPhraseItem
                    {
                        English = "Please call 108 ambulance immediately.",
                        LocalScript = "તરત જ ૧૦૮ એમ્બ્યુલન્સ બોલાવો.",
                        Phonetic = "Tarat ja 108 ambulance bolavo.",
                        Category = "medical"
                    },
                    new EmergencyPhraseItem
                    {
                        English = "I am a traveler with GujjuTours.",
                        LocalScript = "હું ગુજ્જુટૂર્સ (GujjuTours) સાથે મુસાફર છું.",
                        Phonetic = "Hu GujjuTours saathe musafar chhu.",
                        Category = "police"
                    },
                    new EmergencyPhraseItem
                    {
                        English = "Please take me to the nearest medical clinic.",
                        LocalScript = "મને નજીકના દવાખાને લઈ જાઓ.",
                        Phonetic = "Mane najik-na davakhane lai jao.",
                        Category = "medical"
                    }
                }
            };

            return Ok(new { success = true, data = gujjuResponse });
        }
    }
}
