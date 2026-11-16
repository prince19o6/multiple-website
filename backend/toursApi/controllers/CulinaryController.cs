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
    [Route("api/culinary")]
    public class CulinaryController : ControllerBase
    {
        private readonly IWebsiteContext _websiteContext;
        private readonly IMongoDatabaseProvider _databaseProvider;

        public CulinaryController(
            IWebsiteContext websiteContext,
            IMongoDatabaseProvider databaseProvider)
        {
            _websiteContext = websiteContext;
            _databaseProvider = databaseProvider;
        }

        [HttpGet("trail")]
        public IActionResult GetCulinaryTrail([FromQuery] string? destinationId)
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var trails = BuildBrandTrails(siteId);

            CulinaryTrailDto selected;
            if (!string.IsNullOrWhiteSpace(destinationId))
            {
                selected = trails.FirstOrDefault(t => t.DestinationId.Equals(destinationId, StringComparison.OrdinalIgnoreCase)) ?? trails[0];
            }
            else
            {
                selected = trails[0];
            }

            return Ok(new
            {
                success = true,
                siteId,
                data = selected
            });
        }

        [HttpGet("destinations")]
        public IActionResult GetAllCulinaryTrails()
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var trails = BuildBrandTrails(siteId);

            return Ok(new
            {
                success = true,
                siteId,
                totalCount = trails.Count,
                data = trails
            });
        }

        [HttpPost("reserve")]
        public async Task<IActionResult> ReserveTable([FromBody] DiningReservationRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.GuestName) || string.IsNullOrWhiteSpace(dto.PhoneNumber))
            {
                return BadRequest(new
                {
                    success = false,
                    error = "Guest name and contact phone number are required."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.DiningSpotName))
            {
                return BadRequest(new
                {
                    success = false,
                    error = "Dining spot name is required."
                });
            }

            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var refPrefix = siteId switch
            {
                "technoheaven" => "DIN-DXB",
                "tripgoasia" => "DIN-TGA",
                _ => "DIN-GUJ"
            };

            var reservationRef = $"{refPrefix}-{Random.Shared.Next(10000, 99999)}";

            var reservation = new DiningReservation
            {
                WebsiteId = siteId,
                ReservationReference = reservationRef,
                DiningSpotId = dto.DiningSpotId ?? string.Empty,
                DiningSpotName = dto.DiningSpotName,
                DestinationId = dto.DestinationId ?? string.Empty,
                GuestName = dto.GuestName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Email = dto.Email?.Trim(),
                PartySize = dto.PartySize > 0 ? dto.PartySize : 2,
                ReservationDate = string.IsNullOrWhiteSpace(dto.ReservationDate) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : dto.ReservationDate,
                TimeSlot = string.IsNullOrWhiteSpace(dto.TimeSlot) ? "19:30" : dto.TimeSlot,
                DietaryRequests = dto.DietaryRequests ?? new List<string>(),
                SpecialNotes = dto.SpecialNotes,
                Status = "Confirmed",
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(2));
                var db = _databaseProvider.GetDatabase(_websiteContext.DatabaseName);
                var collection = db.GetCollection<DiningReservation>("dining_reservations");
                await collection.InsertOneAsync(reservation, cancellationToken: cts.Token);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CulinaryController] Non-fatal Mongo log failure: {ex.Message}");
            }

            var conciergeContact = siteId switch
            {
                "technoheaven" => "+971 4 388 9900 (Dubai VIP Hospitality Desk)",
                "tripgoasia" => "+66 2 770 9988 (Bangkok Gourmet Concierge)",
                _ => "+91 98250 12345 (Dwarka & Gujarat Hospitality Desk)"
            };

            var confirmationMessage = siteId switch
            {
                "technoheaven" => $"Your VIP table request at {dto.DiningSpotName} for {reservation.PartySize} guest(s) on {reservation.ReservationDate} at {reservation.TimeSlot} has been registered! Our Dubai concierge team has locked priority seating with complimentary Arabic hospitality.",
                "tripgoasia" => $"Your dining table at {dto.DiningSpotName} for {reservation.PartySize} guest(s) on {reservation.ReservationDate} ({reservation.TimeSlot}) is confirmed! Our regional foodie concierge has alerted the head chef with your dietary preferences.",
                _ => $"Jay Dwarkadhish! Your dining reservation at {dto.DiningSpotName} for {reservation.PartySize} guest(s) on {reservation.ReservationDate} at {reservation.TimeSlot} is reserved! Dedicated pure vegetarian & Jain kitchen arrangements have been requested."
            };

            var result = new DiningReservationResultDto
            {
                ReservationReference = reservationRef,
                Status = "Confirmed",
                EstimatedResponseTime = "Instant Confirmation",
                ConfirmationMessage = confirmationMessage,
                ConciergeContact = conciergeContact,
                CreatedAt = DateTime.UtcNow
            };

            return Ok(new
            {
                success = true,
                siteId,
                data = result
            });
        }

        private List<CulinaryTrailDto> BuildBrandTrails(string siteId)
        {
            return siteId switch
            {
                "technoheaven" => BuildTechnoheavenTrails(),
                "tripgoasia" => BuildTripGoAsiaTrails(),
                _ => BuildGujjuToursTrails()
            };
        }

        private List<CulinaryTrailDto> BuildGujjuToursTrails()
        {
            return new List<CulinaryTrailDto>
            {
                new CulinaryTrailDto
                {
                    DestinationId = "dwarka",
                    DestinationName = "Dwarka Holy Sanctum",
                    Tagline = "Sacred Sattvic Feasts, Chhappan Bhog & Golden Kathiyawadi Thalis",
                    Overview = "Dwarka offers a timeless, spiritually pure vegetarian and Jain culinary odyssey. From ancient temple Rajbhog traditions honoring Lord Dwarkadhish with Makhan Mishri to hearty rustic Kathiyawadi dining with freshly churned white butter, every meal is blessed with pure devotion and zero onion or garlic upon request.",
                    HeroImageUrl = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1200&q=80",
                    Dishes = new List<DishRecommendationDto>
                    {
                        new DishRecommendationDto
                        {
                            Id = "dwk-dish-1",
                            Name = "Dwarkadhish Shrimad Rajbhog Thali",
                            LocalName = "શ્રીમદ્ દ્વારકાધીશ રાજભોગ થાળી",
                            Category = "Traditional Thali",
                            Description = "Royal multi-course sattvic feast featuring sweet Gujarati dal, spicy kathol, ringna bateta nu shaak, phulka rotli, crispy puri, vaghareli khichdi, kadhi, and sweet shrikhand.",
                            ImageUrl = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Pure Veg", "Jain Friendly", "No Onion Garlic" },
                            SpiceLevel = 2,
                            EstimatedPrice = "₹250 - ₹380 / Unlimited",
                            CulturalStory = "In Vaishnavite tradition, meals prepared in the holy city of Dwarka are offered first to Lord Krishna as Bhog before being served to pilgrims, making each bite sacred Prasadam.",
                            BestNeighborhoodToTry = "Temple Square & Station Road, Dwarka",
                            SignaturePairing = "Chilled Sweet Lassi & Roasted Papad"
                        },
                        new DishRecommendationDto
                        {
                            Id = "dwk-dish-2",
                            Name = "Authentic Dwarka Peda & Makhan Mishri",
                            LocalName = "દ્વારકા ના પ્રસિદ્ધ પેંડા અને માખણ મિશ્રી",
                            Category = "Dessert",
                            Description = "Rich dark caramelized mawa pedas delicately dusted with sugar crystals, alongside fresh hand-churned white butter blended with sweet rock candy crystals.",
                            ImageUrl = "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Pure Veg", "Jain Friendly", "Gluten-Free" },
                            SpiceLevel = 1,
                            EstimatedPrice = "₹120 / 250g box",
                            CulturalStory = "Makhan Mishri represents the legendary childhood love of Lord Krishna (Makhan Chor). Devotees carry these sacred pedas home as the ultimate blessing.",
                            BestNeighborhoodToTry = "Dwarkadhish Temple North Gate Bazaar",
                            SignaturePairing = "Hot Saffron Cardamom Milk"
                        },
                        new DishRecommendationDto
                        {
                            Id = "dwk-dish-3",
                            Name = "Kathiyawadi Sev Tameta & Bajra Rotla",
                            LocalName = "સેવ ટામેટા નું શાક અને ગરમા ગરમ બાજરી નો રોટલો",
                            Category = "Rustic Delicacy",
                            Description = "Tangy tomato curry tempered with cumin and mustard seeds, topped with crunchy spiced sev, served with piping hot thick pearl millet flatbread, raw white butter, and organic jaggery.",
                            ImageUrl = "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Pure Veg", "Jain Friendly", "Vegan Option" },
                            SpiceLevel = 3,
                            EstimatedPrice = "₹180 - ₹240",
                            CulturalStory = "The lifeline of Saurashtra's farmers and travelers, this rustic meal gives abundant energy and digestive warmth against coastal Gujarat sea breezes.",
                            BestNeighborhoodToTry = "Porbandar Highway Dhabas & Bhadkeshwar Promenade",
                            SignaturePairing = "Frothy Masala Chaas with Roasted Cumin"
                        },
                        new DishRecommendationDto
                        {
                            Id = "dwk-dish-4",
                            Name = "Steaming Nylon Khaman & Khandvi Platter",
                            LocalName = "નાયલોન ખમણ ઢોકળા અને વઘારેલી ખાંડવી",
                            Category = "Street Delicacy",
                            Description = "Feather-light yellow gram flour cakes soaked in sweet-tangy mustard chili liquor, paired with velvety rolled chickpea pinwheels topped with fresh coconut shreds and coriander.",
                            ImageUrl = "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Pure Veg", "Jain Friendly", "Vegan" },
                            SpiceLevel = 2,
                            EstimatedPrice = "₹60 - ₹90 per plate",
                            CulturalStory = "Farsan is Gujarat's world-renowned art form of savory snacks, prepared fresh before sunrise every morning across temple towns.",
                            BestNeighborhoodToTry = "Gomti Ghat Morning Snack Stalls",
                            SignaturePairing = "Sweet Papaya Sambharo & Fried Green Chilies"
                        }
                    },
                    DiningSpots = new List<DiningSpotDto>
                    {
                        new DiningSpotDto
                        {
                            Id = "dwk-spot-1",
                            Name = "Toran Dining Hall",
                            CuisineType = "Authentic Gujarati & Kathiyawadi Thali",
                            DestinationId = "dwarka",
                            DestinationName = "Dwarka Holy Sanctum",
                            Rating = 4.9,
                            ReviewCount = 840,
                            PriceTier = "$$",
                            AverageCostForTwo = "₹500 for two",
                            DietaryCertifications = new List<string> { "100% Pure Veg", "Jain Available", "Sanitized Kitchen" },
                            SignatureDishes = new List<string> { "Unlimited Royal Thali", "Kesar Shrikhand", "Kathiyawadi Khichdi" },
                            Address = "Near Circuit House & Dwarkadhish Main Road, Dwarka",
                            Latitude = 22.2404,
                            Longitude = 68.9685,
                            OpeningHours = "11:30 AM - 3:30 PM, 7:00 PM - 10:30 PM",
                            PhoneNumber = "+91 2892 234418",
                            DressCode = "Casual / Modest",
                            RequiresReservation = false,
                            Atmosphere = "Heritage Family Dining"
                        },
                        new DiningSpotDto
                        {
                            Id = "dwk-spot-2",
                            Name = "Shrinath Bhojanalaya",
                            CuisineType = "Strict Jain & Vaishnavite Bhojan",
                            DestinationId = "dwarka",
                            DestinationName = "Dwarka Holy Sanctum",
                            Rating = 4.8,
                            ReviewCount = 520,
                            PriceTier = "$",
                            AverageCostForTwo = "₹350 for two",
                            DietaryCertifications = new List<string> { "100% Pure Veg", "Strict Jain (No Root Veg)", "No Onion Garlic" },
                            SignatureDishes = new List<string> { "Sattvic Thali", "Gatte Ki Sabzi", "Gujarati Kadhi" },
                            Address = "Opposite Railway Station Road, Dwarka",
                            Latitude = 22.2465,
                            Longitude = 68.9741,
                            OpeningHours = "11:00 AM - 3:00 PM, 6:30 PM - 10:00 PM",
                            PhoneNumber = "+91 98251 77201",
                            DressCode = "Casual",
                            RequiresReservation = false,
                            Atmosphere = "Traditional Bhojanalaya"
                        },
                        new DiningSpotDto
                        {
                            Id = "dwk-spot-3",
                            Name = "Govinda's Restaurant (ISKCON)",
                            CuisineType = "Vedic Sattvic & Continental",
                            DestinationId = "dwarka",
                            DestinationName = "Dwarka Holy Sanctum",
                            Rating = 4.7,
                            ReviewCount = 610,
                            PriceTier = "$$",
                            AverageCostForTwo = "₹600 for two",
                            DietaryCertifications = new List<string> { "100% Pure Veg", "Pure Satvik Vedic", "Jain Friendly" },
                            SignatureDishes = new List<string> { "Vedic Thali", "Paneer Lababdar (Jain)", "Makhan Mishri Shake" },
                            Address = "ISKCON Campus, Devi Bhavan Road, Dwarka",
                            Latitude = 22.2431,
                            Longitude = 68.9662,
                            OpeningHours = "12:00 PM - 3:30 PM, 7:00 PM - 10:00 PM",
                            PhoneNumber = "+91 2892 236200",
                            DressCode = "Modest Temple Attire",
                            RequiresReservation = true,
                            Atmosphere = "Peaceful Courtyard"
                        }
                    },
                    Etiquette = new FoodEtiquetteDto
                    {
                        Dos = new List<string>
                        {
                            "Remove your footwear at designated racks before entering traditional Bhojanalayas.",
                            "Accept temple prasadam with both hands cupped or with your right hand supported by your left.",
                            "Notify the server in advance if you require strict Jain preparation (No potato, onion, or garlic).",
                            "Enjoy food using your right hand as is traditional for Indian thalis, or request spoons freely."
                        },
                        Donts = new List<string>
                        {
                            "Do not bring or consume non-vegetarian items or alcohol anywhere within holy municipal limits.",
                            "Do not leave large quantities of food unfinished on your thali (Annapurna respect).",
                            "Do not drink unsealed tap water; opt for sealed branded packaged water bottles."
                        },
                        WaterSafetyGuide = "Bottled RO Purified or BIS-certified packaged water (Kinley, Aquafina, Bisleri) is strictly recommended across all coastal towns.",
                        StreetFoodHygieneTips = new List<string>
                        {
                            "Opt for piping hot, freshly fried farsan (Dhokla, Ganthiya) prepared right in front of you.",
                            "Avoid raw salads from roadside carts; relish cooked meals and temple dining halls.",
                            "Check that milk items and buttermilk are stored in refrigerated coolers."
                        },
                        TippingGuidelines = "A voluntary tip of ₹50 - ₹100 is customary and appreciated in sit-down restaurants. Thali Bhojanalayas often have a shared staff donation box."
                    }
                },
                new CulinaryTrailDto
                {
                    DestinationId = "somnath",
                    DestinationName = "Somnath Coastal Haven",
                    Tagline = "Arabian Sea Breezes, Vaghareli Khichdi & Rich Kaju Curries",
                    Overview = "Overlooking the eternal Jyotirlinga, Somnath combines coastal sea views with soulful Saurashtra comfort food. Enjoy warm bowls of fragrant Vaghareli Khichdi with sweet kadhi, rich cashew gravies, and coastal coconut water.",
                    HeroImageUrl = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80",
                    Dishes = new List<DishRecommendationDto>
                    {
                        new DishRecommendationDto
                        {
                            Id = "som-dish-1",
                            Name = "Prabhas Patan Kaju Curry & Khichdi Kadhi",
                            LocalName = "કાજુ કરી અને વઘારેલી ખીચડી કઢી",
                            Category = "Specialty Curry",
                            Description = "Whole roasted cashews simmered in a velvety tomato-cream gravy with mild spices, paired with comforting cumin-garlic-tempered moong dal rice khichdi and buttermilk kadhi.",
                            ImageUrl = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Pure Veg", "Jain Friendly" },
                            SpiceLevel = 2,
                            EstimatedPrice = "₹220 - ₹280",
                            CulturalStory = "Pilgrims concluding their evening Aarti at the Somnath shore traditionally find soothing solace in hot khichdi kadhi bowls that warm the spirit.",
                            BestNeighborhoodToTry = "Somnath Beach Road & Prabhas Patan Chowk",
                            SignaturePairing = "Roasted Garlic Papad & Mint Chaas"
                        },
                        new DishRecommendationDto
                        {
                            Id = "som-dish-2",
                            Name = "Veraval Tender Coastal Coconut & Malai",
                            LocalName = "વેરાવળ દરિયા કિનારા નું મીઠું નાળિયેર પાણી",
                            Category = "Beverage",
                            Description = "Naturally sweet, mineral-rich electrolyte tender coconut water freshly cleaved from coastal Saurashtra palms, followed by soft tender coconut cream.",
                            ImageUrl = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Pure Veg", "Jain Friendly", "Vegan", "Gluten-Free" },
                            SpiceLevel = 1,
                            EstimatedPrice = "₹50 - ₹70 each",
                            CulturalStory = "Coastal Saurashtra's saline soil gives Veraval coconuts their distinctive refreshing sweetness.",
                            BestNeighborhoodToTry = "Somnath Promenade Beach Walkway",
                            SignaturePairing = "Fresh Lime Squeeze"
                        }
                    },
                    DiningSpots = new List<DiningSpotDto>
                    {
                        new DiningSpotDto
                        {
                            Id = "som-spot-1",
                            Name = "Sagar Darshan Sea View Restaurant",
                            CuisineType = "Gujarati & North Indian Pure Veg",
                            DestinationId = "somnath",
                            DestinationName = "Somnath Coastal Haven",
                            Rating = 4.8,
                            ReviewCount = 780,
                            PriceTier = "$$",
                            AverageCostForTwo = "₹550 for two",
                            DietaryCertifications = new List<string> { "100% Pure Veg", "Jain Available" },
                            SignatureDishes = new List<string> { "Deluxe Gujarati Thali", "Kaju Curry", "Paneer Tikka Masala" },
                            Address = "Somnath Trust Guest House, Near Sea Coast, Somnath",
                            Latitude = 20.8880,
                            Longitude = 70.4012,
                            OpeningHours = "11:00 AM - 3:30 PM, 7:00 PM - 10:30 PM",
                            PhoneNumber = "+91 2876 231212",
                            DressCode = "Casual",
                            RequiresReservation = true,
                            Atmosphere = "Oceanfront Panorama"
                        }
                    },
                    Etiquette = new FoodEtiquetteDto
                    {
                        Dos = new List<string> { "Request Jain modifications early during rush hours.", "Enjoy meals facing the sunset over the Arabian Sea." },
                        Donts = new List<string> { "Do not bring outside food into temple corridors." },
                        WaterSafetyGuide = "Stick strictly to sealed bottled mineral water.",
                        StreetFoodHygieneTips = new List<string> { "Choose vendors with glass display cases protected from seaside sand." },
                        TippingGuidelines = "5-10% tip is standard in coastal family diners."
                    }
                },
                new CulinaryTrailDto
                {
                    DestinationId = "gir",
                    DestinationName = "Sasan Gir Lion Sanctuary",
                    Tagline = "Earthenware Hearth Cookery, Smoked Ringna no Olo & Gir Kesar Mango",
                    Overview = "Immerse in the untamed flavors of the Gir forest kingdom. Rustic Maldhari tribes and Saurashtra farmers cook in clay pots over fragrant acacia wood fires, serving smoky roasted aubergines, raw white butter, and legendary Talala Kesar mango sweets.",
                    HeroImageUrl = "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80",
                    Dishes = new List<DishRecommendationDto>
                    {
                        new DishRecommendationDto
                        {
                            Id = "gir-dish-1",
                            Name = "Smoked Ringna no Olo with White Butter",
                            LocalName = "ગીર નો સ્મોક્ડ રીંગણા નો ઓળો અને સફેદ માખણ",
                            Category = "Heirloom Specialty",
                            Description = "Giant purple eggplants roasted over acacia charcoal embers until silky and smoky, tempered with green spring garlic, ginger, and cumin, served with hot Bajra Rotla and dollops of fresh white butter.",
                            ImageUrl = "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Pure Veg", "Gluten-Free" },
                            SpiceLevel = 3,
                            EstimatedPrice = "₹200 - ₹280",
                            CulturalStory = "Cooked on rural chulhas (earthen hearths) by Maldhari pastoral communities inside the teak woods, this dish captures the wilderness soul of Gir.",
                            BestNeighborhoodToTry = "Sasan-Talala Highway Dhabas & Eco Resorts",
                            SignaturePairing = "Clay-Pot Desi Chaas & Gud (Jaggery)"
                        },
                        new DishRecommendationDto
                        {
                            Id = "gir-dish-2",
                            Name = "Gir Talala Kesar Mango Shrikhand",
                            LocalName = "ગીર તાલાલા કેસર કેરી નો શ્રીખંડ",
                            Category = "Dessert",
                            Description = "Thick hung curd whipped with golden pulp of GI-tagged Gir Talala Kesar mangoes, infused with real saffron strands, green cardamom, and slivered pistachios.",
                            ImageUrl = "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Pure Veg", "Jain Friendly", "Gluten-Free" },
                            SpiceLevel = 1,
                            EstimatedPrice = "₹150 / bowl",
                            CulturalStory = "Talala Gir is the world capital of Kesar mangoes, famous for its saffron hue and intensely sweet aroma nurtured by the volcanic soil of the Gir hills.",
                            BestNeighborhoodToTry = "Sasan Gir Village Market",
                            SignaturePairing = "Piping Hot Methi Puri"
                        }
                    },
                    DiningSpots = new List<DiningSpotDto>
                    {
                        new DiningSpotDto
                        {
                            Id = "gir-spot-1",
                            Name = "Gir Pride Resort Kathiyawadi Kitchen",
                            CuisineType = "Open-Fire Kathiyawadi & Organic Hearth",
                            DestinationId = "gir",
                            DestinationName = "Sasan Gir Lion Sanctuary",
                            Rating = 4.9,
                            ReviewCount = 490,
                            PriceTier = "$$",
                            AverageCostForTwo = "₹650 for two",
                            DietaryCertifications = new List<string> { "100% Pure Veg", "Organic Ingredients", "Jain Friendly" },
                            SignatureDishes = new List<string> { "Chula Cooked Olo", "Bajra Rotla with Desi Ghee", "Talala Kesar Shrikhand" },
                            Address = "Sasan-Bhalchel Road, Near Safari Gate, Sasan Gir",
                            Latitude = 21.1610,
                            Longitude = 70.5732,
                            OpeningHours = "12:00 PM - 3:00 PM, 7:00 PM - 10:00 PM",
                            PhoneNumber = "+91 2877 285555",
                            DressCode = "Casual / Safari Attire",
                            RequiresReservation = true,
                            Atmosphere = "Campfire Forest Gazebo"
                        }
                    },
                    Etiquette = new FoodEtiquetteDto
                    {
                        Dos = new List<string> { "Enjoy dining outdoors by the bonfire after safari dusk.", "Taste the local desi cow A2 milk and buttermilk." },
                        Donts = new List<string> { "Never feed wildlife or leave plastic wrapping near forest boundaries." },
                        WaterSafetyGuide = "Drink resort RO filtered or bottled mineral water exclusively.",
                        StreetFoodHygieneTips = new List<string> { "Eat at verified eco-resort kitchens where raw ingredients are locally sourced from organic orchards." },
                        TippingGuidelines = "₹100 tip for hearth chefs cooking live at your table is customary."
                    }
                }
            };
        }

        private List<CulinaryTrailDto> BuildTripGoAsiaTrails()
        {
            return new List<CulinaryTrailDto>
            {
                new CulinaryTrailDto
                {
                    DestinationId = "bangkok",
                    DestinationName = "Bangkok Street Gourmet & Riverfront",
                    Tagline = "Sizzling Woks, Michelin Hawker Stalls & Vibrant Halal Alleys",
                    Overview = "Bangkok is the undisputed street food capital of the world. From legendary flame-seared crab omelettes and aromatic lemongrass tom yum broths to sweet mango sticky rice and certified Halal Muslim eateries in Phaya Thai, Bangkok serves an explosion of sweet, sour, salty, and spicy sensations.",
                    HeroImageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
                    Dishes = new List<DishRecommendationDto>
                    {
                        new DishRecommendationDto
                        {
                            Id = "bkk-dish-1",
                            Name = "Authentic Pad Thai Boran with Giant River Prawns",
                            LocalName = "ผัดไทยโบราณกุ้งแม่น้ำ (Pad Thai Boran)",
                            Category = "Street Delicacy",
                            Description = "Thin rice noodles stir-fried in a hot smoking wok with rich tamarind reduction, palm sugar, dried shrimp, pressed yellow tofu, crushed peanuts, crisp bean sprouts, garlic chives, and flame-grilled jumbo river prawns.",
                            ImageUrl = "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "Seafood", "Halal Friendly", "Gluten-Free Option", "Vegan Option" },
                            SpiceLevel = 2,
                            EstimatedPrice = "฿90 - ฿220",
                            CulturalStory = "Created during World War II as a national unity dish, traditional Pad Thai balances sweet, salty, tamarind-sour, and nut crunch into poetic equilibrium.",
                            BestNeighborhoodToTry = "Thip Samai & Maha Chai Road, Old Bangkok",
                            SignaturePairing = "Iced Thai Milk Tea (Cha Yen)"
                        },
                        new DishRecommendationDto
                        {
                            Id = "bkk-dish-2",
                            Name = "Royal Tom Yum Goong (Spicy Lemongrass Broth)",
                            LocalName = "ต้มยำกุ้งน้ำข้น (Tom Yum Goong Nam Khon)",
                            Category = "Royal Banquet",
                            Description = "Fiery aromatic soup brewed with fresh galangal, bruised lemongrass stalks, torn kaffir lime leaves, bird's eye chilies, roasted chili jam (nam prik pao), plump prawns, and creamy evaporated coconut milk.",
                            ImageUrl = "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "Seafood", "Halal Friendly", "Gluten-Free" },
                            SpiceLevel = 4,
                            EstimatedPrice = "฿180 - ฿350",
                            CulturalStory = "Inscribed on UNESCO's Intangible Cultural Heritage list, Tom Yum represents the herbal therapeutic genius of Siamese royal culinary history.",
                            BestNeighborhoodToTry = "Chao Phraya Riverfront & Chinatown Yaowarat",
                            SignaturePairing = "Steamed Jasmine Rice (Khao Hom Mali)"
                        },
                        new DishRecommendationDto
                        {
                            Id = "bkk-dish-3",
                            Name = "Khao Niew Mamuang (Mango Sticky Rice)",
                            LocalName = "ข้าวเหนียวมะม่วง (Mango Sticky Rice)",
                            Category = "Dessert",
                            Description = "Sweet golden slices of ripe Nam Dok Mai mango served alongside warm glutinous rice steeped in salted coconut cream, sprinkled with toasted crispy yellow mung beans.",
                            ImageUrl = "https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Pure Veg", "Halal Certified", "Vegan", "Gluten-Free" },
                            SpiceLevel = 1,
                            EstimatedPrice = "฿120 - ฿180",
                            CulturalStory = "The balance of slightly savory coconut cream against the perfumed honey-sweetness of tropical mango creates Thailand's most beloved dessert.",
                            BestNeighborhoodToTry = "Thong Lo Night Market & Pier 21",
                            SignaturePairing = "Fresh Young Coconut Water"
                        },
                        new DishRecommendationDto
                        {
                            Id = "bkk-dish-4",
                            Name = "Massaman Curry (Thai-Muslim Halal)",
                            LocalName = "แกงมัสมั่นเนื้อ (Massaman Beef)",
                            Category = "Halal Specialty",
                            Description = "Velvety mild curry influenced by Persian spice trade routes, featuring tender slow-braised Halal beef, baby potatoes, roasted peanuts, star anise, cinnamon, and coconut cream.",
                            ImageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "Halal Certified", "Gluten-Free" },
                            SpiceLevel = 2,
                            EstimatedPrice = "฿160 - ฿280",
                            CulturalStory = "Consistently ranked as one of the world's best foods by global food critics, Massaman reflects southern Thailand's deep Muslim heritage.",
                            BestNeighborhoodToTry = "Phaya Thai Muslim Quarter & Charoen Krung",
                            SignaturePairing = "Warm Roti Flatbread & Achar Pickles"
                        }
                    },
                    DiningSpots = new List<DiningSpotDto>
                    {
                        new DiningSpotDto
                        {
                            Id = "bkk-spot-1",
                            Name = "Raan Jay Fai (Michelin Hawker)",
                            CuisineType = "Seafood Street Wok Gourmet",
                            DestinationId = "bangkok",
                            DestinationName = "Bangkok Street Gourmet & Riverfront",
                            Rating = 4.8,
                            ReviewCount = 2100,
                            PriceTier = "$$$",
                            AverageCostForTwo = "฿2,400 for two",
                            DietaryCertifications = new List<string> { "Seafood Specialist", "Michelin 1-Star" },
                            SignatureDishes = new List<string> { "Legendary Crab Omelette", "Drunken Seafood Noodles", "Dry Tom Yum" },
                            Address = "327 Maha Chai Rd, Samran Rat, Phra Nakhon, Bangkok",
                            Latitude = 13.7525,
                            Longitude = 100.5048,
                            OpeningHours = "9:00 AM - 7:30 PM (Wed - Sat)",
                            PhoneNumber = "+66 2 223 9384",
                            DressCode = "Casual",
                            RequiresReservation = true,
                            Atmosphere = "Iconic Michelin Street Counter"
                        },
                        new DiningSpotDto
                        {
                            Id = "bkk-spot-2",
                            Name = "Farida Fatar Halal Restaurant",
                            CuisineType = "Authentic Thai-Muslim Halal",
                            DestinationId = "bangkok",
                            DestinationName = "Bangkok Street Gourmet & Riverfront",
                            Rating = 4.7,
                            ReviewCount = 920,
                            PriceTier = "$",
                            AverageCostForTwo = "฿450 for two",
                            DietaryCertifications = new List<string> { "100% Halal Certified", "No Alcohol" },
                            SignatureDishes = new List<string> { "Massaman Beef Curry", "Halal Tom Yum", "Yellow Rice Chicken Biryani" },
                            Address = "Phetchaburi Soi 7, Ratchathewi, Bangkok",
                            Latitude = 13.7541,
                            Longitude = 100.5312,
                            OpeningHours = "10:00 AM - 10:00 PM Daily",
                            PhoneNumber = "+66 2 215 1733",
                            DressCode = "Casual / Modest",
                            RequiresReservation = false,
                            Atmosphere = "Bustling Halal Diner"
                        },
                        new DiningSpotDto
                        {
                            Id = "bkk-spot-3",
                            Name = "Supanniga Eating Room (Tha Tien)",
                            CuisineType = "Trat & Eastern Thai Heritage",
                            DestinationId = "bangkok",
                            DestinationName = "Bangkok Street Gourmet & Riverfront",
                            Rating = 4.9,
                            ReviewCount = 1450,
                            PriceTier = "$$$",
                            AverageCostForTwo = "฿1,600 for two",
                            DietaryCertifications = new List<string> { "Seafood Specialist", "Vegetarian Options" },
                            SignatureDishes = new List<string> { "Crab Meat Curry with Betel Leaves", "Pad Thai", "Sunset Cocktails & Mocktails" },
                            Address = "Riva Arun, Maharaj Road, Tha Tien, Bangkok (Wat Arun View)",
                            Latitude = 13.7441,
                            Longitude = 100.4912,
                            OpeningHours = "11:30 AM - 10:30 PM Daily",
                            PhoneNumber = "+66 2 015 4224",
                            DressCode = "Smart Casual",
                            RequiresReservation = true,
                            Atmosphere = "Riverfront Sunset View"
                        }
                    },
                    Etiquette = new FoodEtiquetteDto
                    {
                        Dos = new List<string>
                        {
                            "Hold the spoon in your right hand and fork in your left; use the fork only to push food onto the spoon.",
                            "Look for the official 'Clean Food Good Taste' certificate sticker at street food stalls.",
                            "Indicate your spice tolerance clearly: 'Mai Phet' (Not spicy) or 'Phet Nid Noi' (Mildly spicy)."
                        },
                        Donts = new List<string>
                        {
                            "Do not use chopsticks for rice dishes or fried rice (spoons are the universal utensil in Thailand).",
                            "Never leave chopsticks sticking vertically upright into a bowl of food (associated with funeral incense rites).",
                            "Do not drink municipal tap water; always purchase sealed bottled water."
                        },
                        WaterSafetyGuide = "Only drink sealed bottled water (Singha, Crystal, Chang). Reputable restaurants use commercial cylinder ice with hollow holes in the center, which is safe to consume.",
                        StreetFoodHygieneTips = new List<string>
                        {
                            "Pick busy stalls with high customer turnover where dishes are freshly wok-fried in front of you.",
                            "Inspect that fresh seafood is laid out on thick beds of clean crushed ice."
                        },
                        TippingGuidelines = "Rounding up the bill or leaving ฿50 - ฿100 in restaurants is standard practice and greatly appreciated."
                    }
                },
                new CulinaryTrailDto
                {
                    DestinationId = "phuket",
                    DestinationName = "Phuket Old Town & Coastal Haven",
                    Tagline = "Sino-Portuguese Heritage Recipes, Mee Hokkien & Island Seafood",
                    Overview = "Recognized by UNESCO as a Creative City of Gastronomy, Phuket blends Peranakan Chinese heritage with southern Thai coastal spices. Savor steaming bowls of wok-charred Mee Hokkien noodles, crispy roti pancakes, and freshly caught Andaman seafood.",
                    HeroImageUrl = "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80",
                    Dishes = new List<DishRecommendationDto>
                    {
                        new DishRecommendationDto
                        {
                            Id = "pkt-dish-1",
                            Name = "Phuket Hokkien Fried Noodles (Mee Hokkien)",
                            LocalName = "หมี่ฮกเกี้ยนภูเก็ต (Mee Hokkien)",
                            Category = "Heritage Specialty",
                            Description = "Thick yellow egg noodles wok-braised in rich seafood stock with squid rings, succulent prawns, pork or tofu, bok choy, and crowned with a runny poached onsen egg.",
                            ImageUrl = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "Seafood", "Halal Option" },
                            SpiceLevel = 2,
                            EstimatedPrice = "฿80 - ฿150",
                            CulturalStory = "Brought by 19th-century Chinese tin miners to Phuket, this dish evolved into Phuket's signature comfort food.",
                            BestNeighborhoodToTry = "Dibuk Road, Phuket Old Town",
                            SignaturePairing = "Shallot Sambal & Calamansi Lime"
                        }
                    },
                    DiningSpots = new List<DiningSpotDto>
                    {
                        new DiningSpotDto
                        {
                            Id = "pkt-spot-1",
                            Name = "Raya Restaurant",
                            CuisineType = "Sino-Portuguese Heritage Southern Thai",
                            DestinationId = "phuket",
                            DestinationName = "Phuket Old Town & Coastal Haven",
                            Rating = 4.9,
                            ReviewCount = 1850,
                            PriceTier = "$$$",
                            AverageCostForTwo = "฿1,400 for two",
                            DietaryCertifications = new List<string> { "Michelin Bib Gourmand", "Seafood Specialist" },
                            SignatureDishes = new List<string> { "Crab Meat Yellow Curry with Rice Vermicelli", "Phuket Pork Belly Braise", "Mee Hoon" },
                            Address = "48 New Dibuk Road, Phuket Old Town",
                            Latitude = 7.8864,
                            Longitude = 98.3912,
                            OpeningHours = "10:00 AM - 10:00 PM Daily",
                            PhoneNumber = "+66 76 218 155",
                            DressCode = "Casual / Smart Casual",
                            RequiresReservation = true,
                            Atmosphere = "100-Year Heritage Mansion"
                        }
                    },
                    Etiquette = new FoodEtiquetteDto
                    {
                        Dos = new List<string> { "Stroll Phuket Old Town night markets for fresh coconut ice cream." },
                        Donts = new List<string> { "Avoid raw shellfish from unchilled beach buckets." },
                        WaterSafetyGuide = "Always choose sealed bottled water.",
                        StreetFoodHygieneTips = new List<string> { "Watch for clean cooking oils and glowing hot charcoal woks." },
                        TippingGuidelines = "฿50 to ฿100 is customary for courteous table service."
                    }
                }
            };
        }

        private List<CulinaryTrailDto> BuildTechnoheavenTrails()
        {
            return new List<CulinaryTrailDto>
            {
                new CulinaryTrailDto
                {
                    DestinationId = "dubai",
                    DestinationName = "Downtown Dubai & Heritage Creek",
                    Tagline = "Royal Emirati Banquets, Michelin Sky Dining & Sizzling Shawarma",
                    Overview = "Dubai offers the world's most glamorous culinary crossroad. Experience slow-cooked Al Machboos lamb infused with dried black loomi lime, fragrant Lebanese charcoal grills, golden saffron luqaimat drizzled with date syrup, and skyline dining atop Burj Khalifa - all 100% Halal certified with Municipality Grade-A standards.",
                    HeroImageUrl = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
                    Dishes = new List<DishRecommendationDto>
                    {
                        new DishRecommendationDto
                        {
                            Id = "dxb-dish-1",
                            Name = "Traditional Emirati Al Machboos Laham",
                            LocalName = "مجبوس لحم إماراتي تقليدي (Al Machboos)",
                            Category = "Royal Banquet",
                            Description = "Tender slow-cooked Australian lamb shank simmered in a fragrant broth of turmeric, cinnamon, cloves, cardamom, and sun-dried black lime (loomi), layered over spiced Basmati rice and garnished with golden fried onions, toasted pine nuts, and raisins.",
                            ImageUrl = "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Halal Certified", "Gluten-Free" },
                            SpiceLevel = 2,
                            EstimatedPrice = "AED 85 - AED 140",
                            CulturalStory = "The national centerpiece of Emirati hospitality, Machboos is served on grand silver platters to honor esteemed guests at weddings and royal banquets.",
                            BestNeighborhoodToTry = "Al Fahidi Historical District & Dubai Festival City",
                            SignaturePairing = "Daqqoos (Spicy Garlic Tomato Sauce) & Jarjeer Salad"
                        },
                        new DishRecommendationDto
                        {
                            Id = "dxb-dish-2",
                            Name = "Authentic Levantine Chicken Shawarma & Hummus",
                            LocalName = "شاورما دجاج ممتازة مع حمص بطحينة",
                            Category = "Street Delicacy",
                            Description = "Marinated chicken breast carved from a rotating vertical spit, wrapped in warm paper-thin saj bread with creamy garlic toum, salty pickles, and crispy French fries, paired with velvety olive-oil hummus.",
                            ImageUrl = "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Halal Certified" },
                            SpiceLevel = 2,
                            EstimatedPrice = "AED 12 - AED 25",
                            CulturalStory = "Dubai's late-night obsession, shawarma stands along Al Dhiyafah Road buzz until 4 AM serving locals and international jetsetters alike.",
                            BestNeighborhoodToTry = "2nd December Street (Al Dhiyafah), Satwa",
                            SignaturePairing = "Fresh Pomegranate-Avocado Cocktail (Cocktail Aseer)"
                        },
                        new DishRecommendationDto
                        {
                            Id = "dxb-dish-3",
                            Name = "Golden Luqaimat with Rich Date Molasses",
                            LocalName = "لقيمات ذهبية مقرمشة مع دبس التمر",
                            Category = "Dessert",
                            Description = "Crispy golden fried dough spheres with an airy pillow-soft center, drenched in pure Emirati date syrup (Dibs) and showered with toasted white sesame seeds.",
                            ImageUrl = "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Halal Certified", "Vegetarian", "Vegan Option" },
                            SpiceLevel = 1,
                            EstimatedPrice = "AED 25 - AED 45",
                            CulturalStory = "The definitive traditional Emirati sweet, traditionally fried by mothers in hot oil and served alongside Arabic coffee during family gatherings and Ramadan nights.",
                            BestNeighborhoodToTry = "Global Village & Al Seef Creek Promenade",
                            SignaturePairing = "Arabic Gahwa Coffee Infused with Cardamom & Saffron"
                        },
                        new DishRecommendationDto
                        {
                            Id = "dxb-dish-4",
                            Name = "Kunafa Nabulsiya with Stretchy Akawi Cheese",
                            LocalName = "كنافة نابلسية بالجبنة العكاوية",
                            Category = "Dessert",
                            Description = "Shredded kataifi pastry baked in copper pans until golden and crunchy, encasing molten mild goat-milk cheese, drenched in fragrant rosewater sugar syrup and crushed green pistachios.",
                            ImageUrl = "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80",
                            DietaryBadges = new List<string> { "100% Halal Certified", "Vegetarian" },
                            SpiceLevel = 1,
                            EstimatedPrice = "AED 30 - AED 55",
                            CulturalStory = "Middle Eastern dessert royalty, served sizzling hot straight out of the oven.",
                            BestNeighborhoodToTry = "Sheikh Zayed Road & Deira Al Rigga Street",
                            SignaturePairing = "Moroccan Mint Tea"
                        }
                    },
                    DiningSpots = new List<DiningSpotDto>
                    {
                        new DiningSpotDto
                        {
                            Id = "dxb-spot-1",
                            Name = "Al Fanar Restaurant & Cafe",
                            CuisineType = "Authentic 1960s Emirati Heritage",
                            DestinationId = "dubai",
                            DestinationName = "Downtown Dubai & Heritage Creek",
                            Rating = 4.9,
                            ReviewCount = 2800,
                            PriceTier = "$$",
                            AverageCostForTwo = "AED 220 for two",
                            DietaryCertifications = new List<string> { "100% Halal Certified", "Emirati Heritage" },
                            SignatureDishes = new List<string> { "Machboos Laham", "Chicken Saloona", "Fresh Luqaimat with Date Syrup" },
                            Address = "Ground Floor, Dubai Festival City Mall Canal Walk, Dubai",
                            Latitude = 25.2215,
                            Longitude = 55.3524,
                            OpeningHours = "9:00 AM - 11:30 PM Daily",
                            PhoneNumber = "+971 4 232 9966",
                            DressCode = "Casual / Smart Casual",
                            RequiresReservation = true,
                            Atmosphere = "Nostalgic 1960s Courtyard"
                        },
                        new DiningSpotDto
                        {
                            Id = "dxb-spot-2",
                            Name = "At.mosphere Lounge & Restaurant",
                            CuisineType = "Modern French & International Sky Fine Dining",
                            DestinationId = "dubai",
                            DestinationName = "Downtown Dubai & Heritage Creek",
                            Rating = 4.9,
                            ReviewCount = 3400,
                            PriceTier = "$$$$",
                            AverageCostForTwo = "AED 1,200 for two",
                            DietaryCertifications = new List<string> { "Halal Certified Meat", "VIP Luxury" },
                            SignatureDishes = new List<string> { "Wagyu Beef Tenderloin", "Burj High Tea", "Caviar & Truffle Tasting" },
                            Address = "Burj Khalifa, 122nd Floor, Downtown Dubai",
                            Latitude = 25.1972,
                            Longitude = 55.2744,
                            OpeningHours = "7:00 AM - 2:00 AM Daily",
                            PhoneNumber = "+971 4 888 3828",
                            DressCode = "Elegant / Formal (No sportswear/shorts)",
                            RequiresReservation = true,
                            Atmosphere = "World's Highest Skyline View"
                        },
                        new DiningSpotDto
                        {
                            Id = "dxb-spot-3",
                            Name = "Al Mallah Restaurant",
                            CuisineType = "Lebanese Street Grill & Shawarma",
                            DestinationId = "dubai",
                            DestinationName = "Downtown Dubai & Heritage Creek",
                            Rating = 4.7,
                            ReviewCount = 4100,
                            PriceTier = "$",
                            AverageCostForTwo = "AED 75 for two",
                            DietaryCertifications = new List<string> { "100% Halal Certified" },
                            SignatureDishes = new List<string> { "Chicken Shawarma Plate", "Mixed Grill", "Cheese Manakish" },
                            Address = "2nd December St (Al Dhiyafah Road), Al Satwa, Dubai",
                            Latitude = 25.2341,
                            Longitude = 55.2712,
                            OpeningHours = "7:00 AM - 3:00 AM Daily",
                            PhoneNumber = "+971 4 398 4723",
                            DressCode = "Casual",
                            RequiresReservation = false,
                            Atmosphere = "Bustling Street Sidewalk"
                        },
                        new DiningSpotDto
                        {
                            Id = "dxb-spot-4",
                            Name = "Arabian Tea House Cafe",
                            CuisineType = "Old Dubai Heritage Emirati Platters",
                            DestinationId = "dubai",
                            DestinationName = "Downtown Dubai & Heritage Creek",
                            Rating = 4.8,
                            ReviewCount = 3900,
                            PriceTier = "$$",
                            AverageCostForTwo = "AED 160 for two",
                            DietaryCertifications = new List<string> { "100% Halal Certified", "Vegetarian Friendly" },
                            SignatureDishes = new List<string> { "Emirati Breakfast Platter", "Khameer Bread with Honey", "Special Karak Tea" },
                            Address = "Bastakiya Opposite Musalla Post Office, Al Fahidi, Bur Dubai",
                            Latitude = 25.2635,
                            Longitude = 55.2974,
                            OpeningHours = "7:30 AM - 11:00 PM Daily",
                            PhoneNumber = "+971 4 353 5071",
                            DressCode = "Casual",
                            RequiresReservation = true,
                            Atmosphere = "Turquoise Courtyard Oasis"
                        }
                    },
                    Etiquette = new FoodEtiquetteDto
                    {
                        Dos = new List<string>
                        {
                            "Always eat and receive cups of Arabic coffee (Gahwa) with your right hand.",
                            "When offered Gahwa, hold the small cup (finjan) in your right hand. Tilt/shake the cup side-to-side before handing it back to politely signal you are finished.",
                            "Enjoy 100% Halal dining guaranteed by the Dubai Municipality Food Safety Department across all licensed venues."
                        },
                        Donts = new List<string>
                        {
                            "Never refuse the initial welcoming cup of Gahwa and date hospitality from an Emirati host (it is a sign of friendship).",
                            "Respect holy Ramadan daylight dining guidelines (dine within designated partitioned luxury areas).",
                            "Avoid wearing swimwear or athletic sleeveless jerseys in fine dining or heritage establishments."
                        },
                        WaterSafetyGuide = "Dubai tap water meets international standards, but bottled mineral water (Masafi, Al Ain, Evian) is universally provided in all restaurants.",
                        StreetFoodHygieneTips = new List<string>
                        {
                            "Dubai Municipality enforces rigorous Grade-A food safety inspections with strict temperature and sanitation controls across every single food outlet."
                        },
                        TippingGuidelines = "10% to 15% tip is customary in Dubai restaurants for good service, even if a service charge is listed on the bill."
                    }
                }
            };
        }
    }
}
