using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using ToursApi.Models;

namespace ToursApi.Services;

public static class ResilientDataGenerator
{
    public static readonly string[] HotelPhotos = new[]
    {
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=85",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=85"
    };

    public static readonly string[] TourPhotos = new[]
    {
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85",
        "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&q=85",
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85",
        "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=1200&q=85"
    };

    public static readonly string[] PackagePhotos = new[]
    {
        "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=85",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85",
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85",
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85",
        "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?w=1200&q=85",
        "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=85"
    };

    public static readonly string[] FlightPhotos = new[]
    {
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85",
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85",
        "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1200&q=85",
        "https://images.unsplash.com/photo-1520437358207-323b43b50729?w=1200&q=85"
    };

    public static readonly string[] TransferPhotos = new[]
    {
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85",
        "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&q=85",
        "https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=1200&q=85"
    };

    public static readonly string[] VisaPhotos = new[]
    {
        "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85",
        "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=85",
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
        "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=85"
    };

    public static readonly string[] RestaurantPhotos = new[]
    {
        "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85"
    };

    public static readonly string[] BuildPackagePhotos = new[]
    {
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85",
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=85"
    };

    public static string NormalizeModule(string? module)
    {
        if (string.IsNullOrWhiteSpace(module)) return "hotels";
        var m = module.Trim().ToLowerInvariant();
        return m switch
        {
            "hotel" or "hotels" => "hotels",
            "tour" or "tours" or "activities" or "activity" => "tours",
            "package" or "packages" or "holiday" or "holidays" => "packages",
            "flight" or "flights" => "flights",
            "transfer" or "transfers" => "transfers",
            "visa" or "visas" => "visas",
            "restaurant" or "restaurants" or "dining" => "restaurants",
            "buildpackage" or "build-package" or "custompackage" => "buildpackage",
            _ => "hotels"
        };
    }

    public static List<JsonObject> GetItemsForModule(string module, int limit = 6, string siteName = "gujjutours")
    {
        var norm = NormalizeModule(module);
        var list = new List<JsonObject>();

        switch (norm)
        {
            case "hotels":
                list.Add(new JsonObject
                {
                    ["id"] = "h-burj-al-arab",
                    ["slug"] = "burj-al-arab-jumeirah-dubai",
                    ["title"] = "Burj Al Arab Jumeirah",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 68500,
                    ["originalPrice"] = 82000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1250,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[0],
                    ["propertyType"] = "Ultra Luxury Resort",
                    ["badge"] = "7-Star Luxury",
                    ["detailUrl"] = "/en/hotels/dubai/burj-al-arab-jumeirah-dubai",
                    ["features"] = new JsonArray { "Private Beach", "Butler Service", "Pure Veg & Jain Meals", "Helipad Transfers" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-atlantis-palm",
                    ["slug"] = "atlantis-the-palm-dubai",
                    ["title"] = "Atlantis The Palm Resort & Waterpark",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 42000,
                    ["originalPrice"] = 51000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 2400,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[1],
                    ["propertyType"] = "Beach Resort",
                    ["badge"] = "Aquaventure Access",
                    ["detailUrl"] = "/en/hotels/dubai/atlantis-the-palm-dubai",
                    ["features"] = new JsonArray { "Free Waterpark Entry", "Private Beach", "Jain Food Counter", "Kids Club" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-marina-bay-sands",
                    ["slug"] = "marina-bay-sands-singapore",
                    ["title"] = "Marina Bay Sands Hotel",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["price"] = 39500,
                    ["originalPrice"] = 46000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 3100,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[2],
                    ["propertyType"] = "City Center Luxury",
                    ["badge"] = "Infinity Pool",
                    ["detailUrl"] = "/en/hotels/singapore/marina-bay-sands-singapore",
                    ["features"] = new JsonArray { "Rooftop Infinity Pool", "SkyPark Observation Deck", "Luxury Mall Access", "Subway Station" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-oberoi-amarvilas",
                    ["slug"] = "the-oberoi-amarvilas-agra",
                    ["title"] = "The Oberoi Amarvilas",
                    ["city"] = "Agra",
                    ["country"] = "India",
                    ["price"] = 29800,
                    ["originalPrice"] = 36000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 880,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[3],
                    ["propertyType"] = "Heritage Palace",
                    ["badge"] = "Taj Mahal View",
                    ["detailUrl"] = "/en/hotels/agra/the-oberoi-amarvilas-agra",
                    ["features"] = new JsonArray { "Unobstructed Taj Views", "Royal Mughal Spa", "Pure Veg Gourmet", "Private Buggy" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-w-bali-seminyak",
                    ["slug"] = "w-bali-seminyak-resort",
                    ["title"] = "W Bali - Seminyak Beachfront Resort",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["price"] = 34200,
                    ["originalPrice"] = 41000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 1420,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[4],
                    ["propertyType"] = "Tropical Beach Villa",
                    ["badge"] = "Private Pool",
                    ["detailUrl"] = "/en/hotels/bali/w-bali-seminyak-resort",
                    ["features"] = new JsonArray { "Sunset Beach Bar", "Private Plunge Pool", "24/7 Concierge", "Vegetarian Kitchen" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "h-taj-mahal-mumbai",
                    ["slug"] = "the-taj-mahal-palace-mumbai",
                    ["title"] = "The Taj Mahal Palace",
                    ["city"] = "Mumbai",
                    ["country"] = "India",
                    ["price"] = 26500,
                    ["originalPrice"] = 32000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1950,
                    ["starRating"] = 5,
                    ["imageUrl"] = HotelPhotos[5],
                    ["propertyType"] = "Heritage Luxury Hotel",
                    ["badge"] = "Gateway View",
                    ["detailUrl"] = "/en/hotels/mumbai/the-taj-mahal-palace-mumbai",
                    ["features"] = new JsonArray { "Harbour Views", "Sea Lounge High Tea", "Jain Food Friendly", "Historic Elegance" }
                });
                break;

            case "tours":
                list.Add(new JsonObject
                {
                    ["id"] = "t-desert-safari",
                    ["slug"] = "dubai-red-dune-desert-safari-bbq",
                    ["title"] = "Red Dune Desert Safari & BBQ Dinner",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 3200,
                    ["originalPrice"] = 4200,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 2840,
                    ["imageUrl"] = TourPhotos[0],
                    ["duration"] = "6 Hours",
                    ["badge"] = "Best Seller",
                    ["detailUrl"] = "/en/tours/dubai-red-dune-desert-safari-bbq",
                    ["features"] = new JsonArray { "4x4 Land Cruiser", "Dune Bashing", "Pure Veg & Jain BBQ", "Tanoura & Fire Show" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-burj-khalifa",
                    ["slug"] = "burj-khalifa-at-the-top-tickets",
                    ["title"] = "Burj Khalifa At the Top (124th & 125th Floor)",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 4150,
                    ["originalPrice"] = 4900,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 3520,
                    ["imageUrl"] = TourPhotos[1],
                    ["duration"] = "2 Hours",
                    ["badge"] = "Must Visit",
                    ["detailUrl"] = "/en/tours/burj-khalifa-at-the-top-tickets",
                    ["features"] = new JsonArray { "Fast-Track Elevator", "Panoramic 360° View", "Outdoor Terrace", "Digital Souvenir Photo" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-bali-waterfalls",
                    ["slug"] = "bali-ubud-waterfalls-rice-terraces",
                    ["title"] = "Bali Ubud Waterfalls & Tegalalang Rice Terraces",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["price"] = 2850,
                    ["originalPrice"] = 3600,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 980,
                    ["imageUrl"] = TourPhotos[2],
                    ["duration"] = "8 Hours",
                    ["badge"] = "Top Experience",
                    ["detailUrl"] = "/en/tours/bali-ubud-waterfalls-rice-terraces",
                    ["features"] = new JsonArray { "Private Chauffeur", "Jungle Swing", "Sacred Monkey Forest", "Coffee Plantation" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-singapore-safari",
                    ["slug"] = "singapore-night-safari-tram-tour",
                    ["title"] = "Singapore Night Safari & Guided Tram Adventure",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["price"] = 3600,
                    ["originalPrice"] = 4400,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 1640,
                    ["imageUrl"] = TourPhotos[3],
                    ["duration"] = "4 Hours",
                    ["badge"] = "Family Favorite",
                    ["detailUrl"] = "/en/tours/singapore-night-safari-tram-tour",
                    ["features"] = new JsonArray { "Night Tram Ride", "Creatures of the Night Show", "Walking Trail Access", "Hotel Transfer Available" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-statue-of-unity",
                    ["slug"] = "statue-of-unity-guided-day-tour",
                    ["title"] = "Statue of Unity & Valley of Flowers Guided Tour",
                    ["city"] = "Kevadia",
                    ["country"] = "India",
                    ["price"] = 2450,
                    ["originalPrice"] = 3100,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1120,
                    ["imageUrl"] = TourPhotos[4],
                    ["duration"] = "Full Day",
                    ["badge"] = "World's Tallest",
                    ["detailUrl"] = "/en/tours/statue-of-unity-guided-day-tour",
                    ["features"] = new JsonArray { "Viewing Gallery Ticket", "Laser Light Show", "Gujarati Thali Lunch", "AC Bus Tour" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "t-bangkok-palace",
                    ["slug"] = "bangkok-grand-palace-floating-market",
                    ["title"] = "Bangkok Grand Palace & Floating Market Expedition",
                    ["city"] = "Bangkok",
                    ["country"] = "Thailand",
                    ["price"] = 3100,
                    ["originalPrice"] = 3900,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 870,
                    ["imageUrl"] = TourPhotos[5],
                    ["duration"] = "7 Hours",
                    ["badge"] = "Cultural Tour",
                    ["detailUrl"] = "/en/tours/bangkok-grand-palace-floating-market",
                    ["features"] = new JsonArray { "Temple of Emerald Buddha", "Longtail Boat Ride", "Indian Lunch Option", "English Speaking Guide" }
                });
                break;

            case "packages":
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-dubai-5d4n",
                    ["slug"] = "dubai-5d4n-grand-vacation-package",
                    ["title"] = "5D/4N Dubai Grand Vacation Package",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 48500,
                    ["originalPrice"] = 58000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 620,
                    ["imageUrl"] = PackagePhotos[0],
                    ["duration"] = "5 Days / 4 Nights",
                    ["days"] = 5,
                    ["nights"] = 4,
                    ["badge"] = "All Inclusive",
                    ["detailUrl"] = "/en/holidays/dubai-5d4n-grand-vacation-package",
                    ["features"] = new JsonArray { "4-Star Hotel Stay", "Desert Safari & Cruise", "Daily Jain & Veg Breakfast", "Private Airport Transfers" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-bali-6d5n",
                    ["slug"] = "bali-6d5n-tropical-pool-villa-escape",
                    ["title"] = "6D/5N Bali Tropical Pool Villa Holiday",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["price"] = 52000,
                    ["originalPrice"] = 62500,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 480,
                    ["imageUrl"] = PackagePhotos[1],
                    ["duration"] = "6 Days / 5 Nights",
                    ["days"] = 6,
                    ["nights"] = 5,
                    ["badge"] = "Honeymoon Special",
                    ["detailUrl"] = "/en/holidays/bali-6d5n-tropical-pool-villa-escape",
                    ["features"] = new JsonArray { "Private Pool Villa", "Floating Breakfast", "Nusa Penida Speedboat", "Full Sightseeing Cabs" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-rajasthan-4d3n",
                    ["slug"] = "royal-rajasthan-4d3n-heritage-tour",
                    ["title"] = "4D/3N Royal Rajasthan Heritage Tour",
                    ["city"] = "Jaipur & Udaipur",
                    ["country"] = "India",
                    ["price"] = 28900,
                    ["originalPrice"] = 35000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 730,
                    ["imageUrl"] = PackagePhotos[2],
                    ["duration"] = "4 Days / 3 Nights",
                    ["days"] = 4,
                    ["nights"] = 3,
                    ["badge"] = "Heritage Plan",
                    ["detailUrl"] = "/en/holidays/royal-rajasthan-4d3n-heritage-tour",
                    ["features"] = new JsonArray { "Palace Hotels", "Private Chauffeur Sedan", "Amer Fort Elephant/Jeep", "Kathiyawadi & Jain Dining" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-singapore-5d4n",
                    ["slug"] = "singapore-malaysia-duo-6d5n",
                    ["title"] = "6D/5N Singapore & Kuala Lumpur Twin Explorer",
                    ["city"] = "Singapore & Kuala Lumpur",
                    ["country"] = "Singapore & Malaysia",
                    ["price"] = 58900,
                    ["originalPrice"] = 71000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 390,
                    ["imageUrl"] = PackagePhotos[3],
                    ["duration"] = "6 Days / 5 Nights",
                    ["days"] = 6,
                    ["nights"] = 5,
                    ["badge"] = "Twin Country",
                    ["detailUrl"] = "/en/holidays/singapore-malaysia-duo-6d5n",
                    ["features"] = new JsonArray { "Universal Studios Pass", "Genting Cable Car", "Cross-Border Coach", "Indian Veg Meals" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-kashmir-7d6n",
                    ["slug"] = "kashmir-paradise-valley-7d6n",
                    ["title"] = "7D/6N Kashmir Paradise Valley with Dal Lake",
                    ["city"] = "Srinagar & Gulmarg",
                    ["country"] = "India",
                    ["price"] = 36500,
                    ["originalPrice"] = 44000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 850,
                    ["imageUrl"] = PackagePhotos[4],
                    ["duration"] = "7 Days / 6 Nights",
                    ["days"] = 7,
                    ["nights"] = 6,
                    ["badge"] = "Valley Special",
                    ["detailUrl"] = "/en/holidays/kashmir-paradise-valley-7d6n",
                    ["features"] = new JsonArray { "Dal Lake Houseboat", "Shikara Ride", "Gulmarg Gondola Ride", "All Breakfasts & Dinners" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "pkg-phuket-krabi-5d4n",
                    ["slug"] = "phuket-krabi-island-hopper-5d4n",
                    ["title"] = "5D/4N Phuket & Krabi Island Hopper",
                    ["city"] = "Phuket & Krabi",
                    ["country"] = "Thailand",
                    ["price"] = 41200,
                    ["originalPrice"] = 49500,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 540,
                    ["imageUrl"] = PackagePhotos[5],
                    ["duration"] = "5 Days / 4 Nights",
                    ["days"] = 5,
                    ["nights"] = 4,
                    ["badge"] = "Island Hopper",
                    ["detailUrl"] = "/en/holidays/phuket-krabi-island-hopper-5d4n",
                    ["features"] = new JsonArray { "Phi Phi Islands Speedboat", "4 Islands Tour Krabi", "Beachfront 4-Star Resort", "Speedboat Transfers" }
                });
                break;

            case "flights":
                list.Add(new JsonObject
                {
                    ["id"] = "fl-stv-dxb",
                    ["slug"] = "surat-stv-to-dubai-dxb-direct",
                    ["title"] = "Surat (STV) to Dubai (DXB) Direct",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["airline"] = "Air India Express",
                    ["flightNumber"] = "IX-173",
                    ["origin"] = "STV - Surat",
                    ["destination"] = "DXB - Dubai",
                    ["price"] = 14500,
                    ["originalPrice"] = 18200,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 820,
                    ["imageUrl"] = FlightPhotos[0],
                    ["badge"] = "Direct Flight",
                    ["detailUrl"] = "/en/flights/surat-stv-to-dubai-dxb-direct",
                    ["features"] = new JsonArray { "Non-Stop 3h 30m", "Hot Pure Veg / Jain Meal", "30kg Baggage", "Cabin Bag 7kg" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "fl-bom-dxb",
                    ["slug"] = "mumbai-bom-to-dubai-dxb-emirates",
                    ["title"] = "Mumbai (BOM) to Dubai (DXB) Emirates",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["airline"] = "Emirates",
                    ["flightNumber"] = "EK-501",
                    ["origin"] = "BOM - Mumbai",
                    ["destination"] = "DXB - Dubai",
                    ["price"] = 21000,
                    ["originalPrice"] = 25500,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1420,
                    ["imageUrl"] = FlightPhotos[1],
                    ["badge"] = "Premium Airline",
                    ["detailUrl"] = "/en/flights/mumbai-bom-to-dubai-dxb-emirates",
                    ["features"] = new JsonArray { "Boeing 777 Experience", "Gourmet Jain Meal", "ICE Inflight Entertainment", "30kg Baggage" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "fl-del-sin",
                    ["slug"] = "delhi-del-to-singapore-sin-sia",
                    ["title"] = "Delhi (DEL) to Singapore (SIN) Singapore Airlines",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["airline"] = "Singapore Airlines",
                    ["flightNumber"] = "SQ-401",
                    ["origin"] = "DEL - Delhi",
                    ["destination"] = "SIN - Singapore",
                    ["price"] = 26500,
                    ["originalPrice"] = 31000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 960,
                    ["imageUrl"] = FlightPhotos[2],
                    ["badge"] = "World's Best",
                    ["detailUrl"] = "/en/flights/delhi-del-to-singapore-sin-sia",
                    ["features"] = new JsonArray { "Airbus A380", "Complimentary Wi-Fi", "Pure Veg Meal Choice", "Changi Connection" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "fl-amd-bkk",
                    ["slug"] = "ahmedabad-amd-to-bangkok-bkk-indigo",
                    ["title"] = "Ahmedabad (AMD) to Bangkok (BKK) IndiGo",
                    ["city"] = "Bangkok",
                    ["country"] = "Thailand",
                    ["airline"] = "IndiGo",
                    ["flightNumber"] = "6E-1053",
                    ["origin"] = "AMD - Ahmedabad",
                    ["destination"] = "BKK - Bangkok",
                    ["price"] = 16800,
                    ["originalPrice"] = 20500,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 670,
                    ["imageUrl"] = FlightPhotos[3],
                    ["badge"] = "Low Fare",
                    ["detailUrl"] = "/en/flights/ahmedabad-amd-to-bangkok-bkk-indigo",
                    ["features"] = new JsonArray { "Direct Flight", "Pre-book Jain Snack", "On-Time Guarantee", "Instant PNR" }
                });
                break;

            case "transfers":
                list.Add(new JsonObject
                {
                    ["id"] = "tr-dxb-downtown",
                    ["slug"] = "dubai-airport-dxb-to-downtown-hotel-transfer",
                    ["title"] = "Dubai Airport (DXB) to Downtown Private Sedan",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["vehicleType"] = "Lexus ES / Toyota Camry",
                    ["capacity"] = "3 Passengers • 2 Bags",
                    ["price"] = 2800,
                    ["originalPrice"] = 3500,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 890,
                    ["imageUrl"] = TransferPhotos[0],
                    ["badge"] = "Airport Meet & Greet",
                    ["detailUrl"] = "/en/transfers/dubai-airport-dxb-to-downtown-hotel-transfer",
                    ["features"] = new JsonArray { "Flight Tracking", "60 Mins Free Waiting", "English Speaking Chauffeur", "Air Conditioned" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "tr-dxb-van",
                    ["slug"] = "dubai-airport-dxb-family-van-transfer",
                    ["title"] = "Dubai Airport (DXB) Family Van (7-Seater)",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["vehicleType"] = "Toyota Previa / Kia Carnival",
                    ["capacity"] = "6 Passengers • 6 Bags",
                    ["price"] = 4500,
                    ["originalPrice"] = 5400,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 620,
                    ["imageUrl"] = TransferPhotos[1],
                    ["badge"] = "Family SUV",
                    ["detailUrl"] = "/en/transfers/dubai-airport-dxb-family-van-transfer",
                    ["features"] = new JsonArray { "Ample Luggage Space", "Complimentary Water", "Door-to-Door", "Fixed Flat Fare" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "tr-bali-seminyak",
                    ["slug"] = "bali-airport-dps-to-seminyak-private-transfer",
                    ["title"] = "Bali Airport (DPS) to Seminyak Private Cab",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["vehicleType"] = "Toyota Avanza / Innova",
                    ["capacity"] = "4 Passengers • 3 Bags",
                    ["price"] = 1850,
                    ["originalPrice"] = 2300,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 540,
                    ["imageUrl"] = TransferPhotos[2],
                    ["badge"] = "Island Cab",
                    ["detailUrl"] = "/en/transfers/bali-airport-dps-to-seminyak-private-transfer",
                    ["features"] = new JsonArray { "Name Sign Pickup", "Toll Road Included", "Cooling AC", "Verified Local Driver" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "tr-sin-hotel",
                    ["slug"] = "singapore-changi-sin-to-city-hotel-transfer",
                    ["title"] = "Singapore Changi (SIN) to Marina Bay Executive Car",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["vehicleType"] = "Mercedes E-Class / Toyota Vellfire",
                    ["capacity"] = "4 Passengers • 4 Bags",
                    ["price"] = 3900,
                    ["originalPrice"] = 4800,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 410,
                    ["imageUrl"] = TransferPhotos[3],
                    ["badge"] = "VIP Executive",
                    ["detailUrl"] = "/en/transfers/singapore-changi-sin-to-city-hotel-transfer",
                    ["features"] = new JsonArray { "Terminal Gate Pickup", "ERP Tolls Included", "Leather Interior", "Bottled Water & Mints" }
                });
                break;

            case "visas":
                list.Add(new JsonObject
                {
                    ["id"] = "v-uae-30d",
                    ["slug"] = "uae-dubai-30-days-tourist-evisa",
                    ["title"] = "Dubai (UAE) 30 Days Tourist eVisa",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 6900,
                    ["originalPrice"] = 8200,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1840,
                    ["imageUrl"] = VisaPhotos[0],
                    ["processingTime"] = "24 - 48 Hours",
                    ["badge"] = "Instant Approval",
                    ["detailUrl"] = "/en/visas/uae-dubai-30-days-tourist-evisa",
                    ["features"] = new JsonArray { "No Embassy Visit", "Only Passport Copy & Photo", "Free Travel Insurance", "99.8% Approval" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "v-uae-60d",
                    ["slug"] = "uae-dubai-60-days-tourist-evisa",
                    ["title"] = "Dubai (UAE) 60 Days Tourist eVisa",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 12500,
                    ["originalPrice"] = 14500,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 920,
                    ["imageUrl"] = VisaPhotos[1],
                    ["processingTime"] = "2 - 3 Days",
                    ["badge"] = "Long Stay",
                    ["detailUrl"] = "/en/visas/uae-dubai-60-days-tourist-evisa",
                    ["features"] = new JsonArray { "60 Days Stay Period", "Single Entry", "Online Verification", "Dedicated Visa Expert" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "v-sin-tourist",
                    ["slug"] = "singapore-30-days-tourist-evisa",
                    ["title"] = "Singapore 30 Days Tourist eVisa",
                    ["city"] = "Singapore",
                    ["country"] = "Singapore",
                    ["price"] = 3400,
                    ["originalPrice"] = 4200,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 780,
                    ["imageUrl"] = VisaPhotos[2],
                    ["processingTime"] = "3 - 4 Working Days",
                    ["badge"] = "Authorized Agent",
                    ["detailUrl"] = "/en/visas/singapore-30-days-tourist-evisa",
                    ["features"] = new JsonArray { "High Approval Rate", "Document Verification", "Form 14A Filing", "Fast-Track Submission" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "v-thai-tourist",
                    ["slug"] = "thailand-tourist-visa-assistance",
                    ["title"] = "Thailand Tourist Visa Assistance",
                    ["city"] = "Bangkok",
                    ["country"] = "Thailand",
                    ["price"] = 2800,
                    ["originalPrice"] = 3500,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 640,
                    ["imageUrl"] = VisaPhotos[3],
                    ["processingTime"] = "2 - 3 Days",
                    ["badge"] = "Easy Process",
                    ["detailUrl"] = "/en/visas/thailand-tourist-visa-assistance",
                    ["features"] = new JsonArray { "Document Checklist", "Immigration Pre-Check", "24/7 WhatsApp Support", "Family Package" }
                });
                break;

            case "restaurants":
                list.Add(new JsonObject
                {
                    ["id"] = "rst-maharaja-pure-veg",
                    ["slug"] = "maharaja-bogh-premium-gujarati-thali-dubai",
                    ["title"] = "Maharaja Bhog - Premium Gujarati Thali",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["cuisine"] = "Authentic Gujarati & Rajasthani",
                    ["costForTwo"] = 2050,
                    ["costForTwoLabel"] = "AED 90 / ₹2,050 for two",
                    ["price"] = 2050,
                    ["originalPrice"] = 2500,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 1450,
                    ["imageUrl"] = RestaurantPhotos[0],
                    ["badge"] = "100% Pure Veg",
                    ["detailUrl"] = "/en/restaurants/maharaja-bogh-premium-gujarati-thali-dubai",
                    ["features"] = new JsonArray { "Unlimited Royal Thali", "Strictly Jain Food", "Karama & Al Barsha Branches", "Bronze Cutlery" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "rst-rasoi-ghar",
                    ["slug"] = "rasoi-ghar-pure-vegetarian-restaurant-dubai",
                    ["title"] = "Rasoi Ghar Pure Vegetarian",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["cuisine"] = "Gujarati & North Indian",
                    ["costForTwo"] = 1950,
                    ["costForTwoLabel"] = "AED 85 / ₹1,950 for two",
                    ["price"] = 1950,
                    ["originalPrice"] = 2400,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 1120,
                    ["imageUrl"] = RestaurantPhotos[1],
                    ["badge"] = "Jain Friendly",
                    ["detailUrl"] = "/en/restaurants/rasoi-ghar-pure-vegetarian-restaurant-dubai",
                    ["features"] = new JsonArray { "Warm Hospitality", "No Onion No Garlic Menu", "Family Dining", "Pre-Booked Table" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "rst-queen-spice-bali",
                    ["slug"] = "queens-tandoor-indian-pure-veg-bali",
                    ["title"] = "Queen's Tandoor Indian Restaurant",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["cuisine"] = "North & South Indian, Jain",
                    ["costForTwo"] = 1900,
                    ["costForTwoLabel"] = "IDR 350,000 / ₹1,900 for two",
                    ["price"] = 1900,
                    ["originalPrice"] = 2300,
                    ["rating"] = 4.7,
                    ["reviewCount"] = 760,
                    ["imageUrl"] = RestaurantPhotos[2],
                    ["badge"] = "Indian Cuisine",
                    ["detailUrl"] = "/en/restaurants/queens-tandoor-indian-pure-veg-bali",
                    ["features"] = new JsonArray { "Seminyak & Kuta Locations", "Indian Chefs", "Dal Makhani & Naan", "Jain Food Menu" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "rst-shiv-sagar-dubai",
                    ["slug"] = "shiv-sagar-street-food-pure-veg-dubai",
                    ["title"] = "Shiv Sagar Pure Veg & Chaat",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["cuisine"] = "Mumbai Street Food & South Indian",
                    ["costForTwo"] = 1350,
                    ["costForTwoLabel"] = "AED 60 / ₹1,350 for two",
                    ["price"] = 1350,
                    ["originalPrice"] = 1650,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 890,
                    ["imageUrl"] = RestaurantPhotos[3],
                    ["badge"] = "Pure Veg",
                    ["detailUrl"] = "/en/restaurants/shiv-sagar-street-food-pure-veg-dubai",
                    ["features"] = new JsonArray { "Crisp Dosas & Pav Bhaji", "Jain Chaat", "Meena Bazaar & Oud Metha", "Quick Bites" }
                });
                break;

            case "buildpackage":
                list.Add(new JsonObject
                {
                    ["id"] = "bp-dubai",
                    ["slug"] = "custom-dubai-tailor-made-itinerary",
                    ["title"] = "Design Your Dubai Dream Vacation",
                    ["city"] = "Dubai",
                    ["country"] = "United Arab Emirates",
                    ["price"] = 35000,
                    ["originalPrice"] = 42000,
                    ["rating"] = 4.9,
                    ["reviewCount"] = 920,
                    ["imageUrl"] = BuildPackagePhotos[0],
                    ["badge"] = "Custom Package Builder",
                    ["detailUrl"] = "/en/buildpackage",
                    ["features"] = new JsonArray { "Pick Hotel (3★ to 5★)", "Add Desert Safari & Burj Khalifa", "Choose Private Sedan", "Instant Cost Estimate" }
                });
                list.Add(new JsonObject
                {
                    ["id"] = "bp-bali",
                    ["slug"] = "custom-bali-island-itinerary",
                    ["title"] = "Design Your Bali Tropical Getaway",
                    ["city"] = "Bali",
                    ["country"] = "Indonesia",
                    ["price"] = 42000,
                    ["originalPrice"] = 51000,
                    ["rating"] = 4.8,
                    ["reviewCount"] = 610,
                    ["imageUrl"] = BuildPackagePhotos[1],
                    ["badge"] = "Island Customizer",
                    ["detailUrl"] = "/en/buildpackage",
                    ["features"] = new JsonArray { "Choose Pool Villa or Beach Resort", "Select Nusa Penida or Mount Batur", "Private Cab All Days", "Live Quote" }
                });
                break;
        }

        var cur = siteName == "technoheaven" ? "AED" : siteName == "tripgoasia" ? "USD" : "INR";
        foreach (var itm in list)
        {
            if (itm != null && !itm.ContainsKey("currency"))
            {
                itm["currency"] = cur;
            }
        }

        return list;
    }

    public static object BuildSafeHomePayload(string siteName, string module)
    {
        var norm = NormalizeModule(module);
        var isGujju = siteName == "gujjutours" || siteName == "website1";

        var meta = norm switch
        {
            "hotels" => new
            {
                title = isGujju ? "Perfect Stays in Dubai & Worldwide" : "Handpicked Stays & Luxury Resorts",
                subtitle = "Handpicked luxury resorts, beachside villas, and city center hotels with Pure Veg & Jain dining options.",
                badge = "VERIFIED STAYS & RESORTS",
                searchModule = "HOTEL",
                citySectionTitle = "Find Top Stays in Popular Cities",
                collectionTitle = "Featured Hotel Collections & Stays",
                collectionSubtitle = "Handpicked 5-star properties, beachfront villas, and luxury city center stays.",
                viewMoreUrl = "/en/hotels"
            },
            "tours" => new
            {
                title = isGujju ? "Top Activities & Desert Safaris in Dubai" : "Exciting Experiences & Guided Tours",
                subtitle = "Discover dune bashing, Burj Khalifa observation decks, luxury yacht cruises, and theme parks.",
                badge = "EXPERIENCES & EXCURSIONS",
                searchModule = "TOUR",
                citySectionTitle = "Top Activities in Destinations",
                collectionTitle = "Top Tour Combos & Multi-Day Experiences",
                collectionSubtitle = "Best-value bundled excursions, desert safaris, and attraction fast-track passes.",
                viewMoreUrl = "/en/tours"
            },
            "packages" => new
            {
                title = isGujju ? "Curated Holiday Packages with Jain Meals" : "All-Inclusive Holiday Packages",
                subtitle = "All-inclusive family getaways, honeymoon packages, and domestic holiday tours with verified meals.",
                badge = "HANDCRAFTED HOLIDAYS",
                searchModule = "PACKAGE",
                citySectionTitle = "Popular Package Destinations",
                collectionTitle = "Curated Holiday Packages",
                collectionSubtitle = "Dubai, Jain-friendly domestic, and international holiday escapes.",
                viewMoreUrl = "/en/holidays"
            },
            "flights" => new
            {
                title = "Popular Flight Routes & Best Airfares",
                subtitle = "Compare low airfares across leading domestic and global airlines with meal selections and instant booking.",
                badge = "EXCLUSIVE AIRFARES",
                searchModule = "FLIGHT",
                citySectionTitle = "Trending Flight Routes",
                collectionTitle = "Trending Flight Routes & Airfares",
                collectionSubtitle = "Direct flight tickets with complimentary vegetarian and Jain meal confirmation.",
                viewMoreUrl = "/en/flights"
            },
            "transfers" => new
            {
                title = "Seamless Airport & City Transfers",
                subtitle = "Private executive sedans, spacious SUVs, and luxury coaches with verified, punctual English-speaking chauffeurs.",
                badge = "SAFE & ON-TIME TRANSFERS",
                searchModule = "TRANSFER",
                citySectionTitle = "Top Transfer Locations & Airport Hubs",
                collectionTitle = "Popular Airport & Intercity Transfer Routes",
                collectionSubtitle = "Fixed-rate private executive sedans, spacious SUVs, and airport meet & greet.",
                viewMoreUrl = "/en/transfers"
            },
            "visas" => new
            {
                title = "Fast & Reliable Visa Services",
                subtitle = "Tourist, express, and business visas with end-to-end documentation support and 99.4% approval rates.",
                badge = "EXPRESS VISA PROCESSING",
                searchModule = "VISA",
                citySectionTitle = "Popular Visa Countries",
                collectionTitle = "Fast-Track Visa Types & Express Services",
                collectionSubtitle = "Official tourist and express visas with rapid document pre-verification and 99.4% approval.",
                viewMoreUrl = "/en/visas"
            },
            "restaurants" => new
            {
                title = isGujju ? "Top Dining & Pure Veg Restaurants" : "Finest Dining & Culinary Experiences",
                subtitle = "Verified 100% Pure Veg and Jain friendly restaurants serving Gujarati, North Indian, and international delicacies.",
                badge = "CULINARY EXPERIENCES",
                searchModule = "RESTAURANT",
                citySectionTitle = "Top Dining Destinations",
                collectionTitle = "Special Dining Packages & Thali Passes",
                collectionSubtitle = "Pre-booked pure veg thali experiences, dinner cruises, and family buffets.",
                viewMoreUrl = "/en/restaurants"
            },
            "buildpackage" => new
            {
                title = "Custom Tailor-Made Holidays",
                subtitle = "Mix and match hotels, private transfers, daily activities, and flights into a personalized dream itinerary.",
                badge = "TAILOR-MADE ITINERARIES",
                searchModule = "BUILDPACKAGE",
                citySectionTitle = "Custom Package Hubs",
                collectionTitle = "Popular Custom Itinerary Templates",
                collectionSubtitle = "Pre-designed customizable itineraries ready to modify and book instantly.",
                viewMoreUrl = "/en/buildpackage"
            },
            _ => new
            {
                title = "Explore World-Class Travel Services",
                subtitle = "Book hotels, tours, transfers, flights, and visas with guaranteed lowest rates.",
                badge = "TRAVEL SUITE",
                searchModule = "HOTEL",
                citySectionTitle = "Top Cities",
                collectionTitle = "Curated Travel Collections",
                collectionSubtitle = "Best travel offerings across the globe.",
                viewMoreUrl = "/en/hotels"
            }
        };

        var categories = GetCategoriesForModule(norm);
        var featured = GetItemsForModule(norm, 6, siteName);
        var destinations = GetDestinationsForModule(norm);
        var banners = GetBannersForModule(norm);
        var packages = GetItemsForModule("packages", 6, siteName)
            .Select(p =>
            {
                var copy = p.DeepClone().AsObject();
                if (copy.ContainsKey("id"))
                {
                    copy["id"] = $"curated-pkg-{copy["id"]}";
                }
                return copy;
            })
            .ToList();
        var videos = GetVideosForModule(norm);
        var reviews = GetReviewsForModule(norm);
        var faq = GetFaqForModule(norm);

        return new
        {
            success = true,
            websiteId = siteName,
            module = norm,
            meta = meta,
            banners = banners,
            featured = featured,
            destinations = destinations,
            categories = categories,
            packages = packages,
            videos = videos,
            reviews = reviews,
            faq = faq
        };
    }

    public static List<JsonObject> GetCategoriesForModule(string module)
    {
        var norm = NormalizeModule(module);
        var defaults = norm switch
        {
            "hotels" => new[]
            {
                ("luxury-5-star", "5-Star Luxury", "sparkles-outline"),
                ("beach-resort", "Beach Resorts", "water-outline"),
                ("city-center", "City Center", "business-outline"),
                ("boutique", "Boutique Villas", "home-outline"),
                ("pure-veg-friendly", "Pure Veg Friendly", "leaf-outline"),
                ("family-suites", "Family Suites", "people-outline")
            },
            "tours" => new[]
            {
                ("desert-safari", "Desert Safaris", "sunny-outline"),
                ("theme-parks", "Theme Parks", "happy-outline"),
                ("burj-attractions", "Burj Khalifa & Towers", "eye-outline"),
                ("cruises-yachts", "Yachts & Cruises", "boat-outline"),
                ("sightseeing", "City Sightseeing", "camera-outline"),
                ("adventure", "Water & Sky Sports", "flame-outline")
            },
            "packages" => new[]
            {
                ("dubai-packages", "Dubai Holidays", "airplane-outline"),
                ("bali-packages", "Bali Escapes", "umbrella-outline"),
                ("domestic-jain", "Jain Domestic Tours", "restaurant-outline"),
                ("honeymoon", "Honeymoon Specials", "heart-outline"),
                ("family-vacations", "Family Vacations", "people-outline"),
                ("weekend-getaways", "Weekend Breaks", "calendar-outline")
            },
            "flights" => new[]
            {
                ("direct-flights", "Direct Flights", "airplane-outline"),
                ("international", "International Airlines", "globe-outline"),
                ("domestic-routes", "Domestic Routes", "map-outline"),
                ("family-fares", "Family Fares", "people-outline"),
                ("business-class", "Business Class", "briefcase-outline"),
                ("low-fare-deals", "Low Fare Deals", "pricetag-outline")
            },
            "transfers" => new[]
            {
                ("airport-pickup", "Airport Pickup", "airplane-outline"),
                ("private-sedan", "Private Sedan", "car-outline"),
                ("family-suv", "Family SUV / Van", "car-sport-outline"),
                ("intercity", "Intercity Chauffeur", "navigate-outline"),
                ("luxury-limo", "Luxury Limousine", "sparkles-outline"),
                ("hourly-rental", "Hourly Rental", "time-outline")
            },
            "visas" => new[]
            {
                ("tourist-30", "Tourist Visa (30 Days)", "card-outline"),
                ("tourist-60", "Tourist Visa (60 Days)", "document-text-outline"),
                ("express-24h", "Express 24h Visa", "flash-outline"),
                ("multiple-entry", "Multiple Entry", "repeat-outline"),
                ("transit-visa", "Transit Visa", "swap-horizontal-outline"),
                ("business-visa", "Business Visa", "briefcase-outline")
            },
            "restaurants" => new[]
            {
                ("pure-veg", "100% Pure Veg", "leaf-outline"),
                ("gujarati-thali", "Gujarati Thali", "restaurant-outline"),
                ("jain-friendly", "Jain Friendly Dining", "nutrition-outline"),
                ("dinner-buffet", "Dinner Buffets", "fast-food-outline"),
                ("rooftop-lounges", "Rooftop Lounges", "wine-outline"),
                ("street-chaat", "Mumbai Chaat & Street Food", "cafe-outline")
            },
            "buildpackage" => new[]
            {
                ("dubai-builder", "Dubai Custom Tour", "create-outline"),
                ("bali-builder", "Bali Custom Villa", "brush-outline"),
                ("europe-builder", "Europe Multi-City", "globe-outline"),
                ("rajasthan-builder", "Rajasthan Palace Tour", "color-wand-outline")
            },
            _ => new[]
            {
                ("all", "All Selections", "grid-outline"),
                ("popular", "Popular Picks", "star-outline")
            }
        };

        var list = new List<JsonObject>();
        var ord = 1;
        foreach (var d in defaults)
        {
            list.Add(new JsonObject
            {
                ["slug"] = d.Item1,
                ["name"] = d.Item2,
                ["title"] = d.Item2,
                ["icon"] = d.Item3,
                ["order"] = ord++,
                ["module"] = norm
            });
        }
        return list;
    }

    public static List<JsonObject> GetDestinationsForModule(string module)
    {
        var norm = NormalizeModule(module);
        var unit = norm switch
        {
            "hotels" => "hotels",
            "tours" => "activities",
            "packages" => "packages",
            "flights" => "flight routes",
            "transfers" => "transfer routes",
            "visas" => "visa categories",
            "restaurants" => "dining places",
            _ => "options"
        };

        return new List<JsonObject>
        {
            new JsonObject { ["name"] = "Dubai", ["city"] = "Dubai", ["country"] = "United Arab Emirates", ["itemCount"] = 124, ["count"] = 124, ["label"] = $"124 {unit}", ["imageUrl"] = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80", ["image"] = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80" },
            new JsonObject { ["name"] = "Abu Dhabi", ["city"] = "Abu Dhabi", ["country"] = "United Arab Emirates", ["itemCount"] = 52, ["count"] = 52, ["label"] = $"52 {unit}", ["imageUrl"] = "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80", ["image"] = "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80" },
            new JsonObject { ["name"] = "Goa", ["city"] = "Goa", ["country"] = "India", ["itemCount"] = 65, ["count"] = 65, ["label"] = $"65 {unit}", ["imageUrl"] = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80", ["image"] = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80" },
            new JsonObject { ["name"] = "Singapore", ["city"] = "Singapore", ["country"] = "Singapore", ["itemCount"] = 92, ["count"] = 92, ["label"] = $"92 {unit}", ["imageUrl"] = "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80", ["image"] = "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80" },
            new JsonObject { ["name"] = "Bangkok", ["city"] = "Bangkok", ["country"] = "Thailand", ["itemCount"] = 78, ["count"] = 78, ["label"] = $"78 {unit}", ["imageUrl"] = "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80", ["image"] = "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80" },
            new JsonObject { ["name"] = "London", ["city"] = "London", ["country"] = "United Kingdom", ["itemCount"] = 86, ["count"] = 86, ["label"] = $"86 {unit}", ["imageUrl"] = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80", ["image"] = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80" }
        };
    }

    public static List<JsonObject> GetBannersForModule(string module)
    {
        var norm = NormalizeModule(module);
        return norm switch
        {
            "restaurants" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-dining-thali",
                    ["title"] = "Unlimited Gujarati Thali Dining Pass",
                    ["subtitle"] = "Pre-book authentic 100% Pure Veg and Jain thali experiences in Dubai with guaranteed table seating.",
                    ["tag"] = "Pure Veg & Jain",
                    ["buttonText"] = "View Thali Menus",
                    ["buttonUrl"] = "/en/restaurants",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
                    ["bgGradient"] = "from-amber-700 via-orange-800 to-rose-900"
                },
                new JsonObject
                {
                    ["id"] = "banner-dining-cruise",
                    ["title"] = "Dubai Marina Pure Veg Dinner Cruise",
                    ["subtitle"] = "Enjoy a lavish vegetarian buffet and live entertainment while cruising past the illuminated marina skyline.",
                    ["tag"] = "Special Evening",
                    ["buttonText"] = "Book Dinner Cruise",
                    ["buttonUrl"] = "/en/restaurants",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85",
                    ["bgGradient"] = "from-indigo-800 via-violet-900 to-purple-950"
                }
            },
            "visas" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-visa-express",
                    ["title"] = "Express 24-Hour UAE Visa Guaranteed",
                    ["subtitle"] = "Rapid document pre-verification and fast-track immigration submission with 99.4% approval.",
                    ["tag"] = "Express Processing",
                    ["buttonText"] = "Apply Express Visa",
                    ["buttonUrl"] = "/en/visas",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85",
                    ["bgGradient"] = "from-blue-800 via-sky-800 to-indigo-950"
                },
                new JsonObject
                {
                    ["id"] = "banner-visa-family",
                    ["title"] = "Flat ₹500 Off Family Visas",
                    ["subtitle"] = "Apply for 3 or more family tourist visas and receive free travel insurance coverage.",
                    ["tag"] = "Family Package",
                    ["buttonText"] = "Start Application",
                    ["buttonUrl"] = "/en/visas",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=85",
                    ["bgGradient"] = "from-emerald-800 via-teal-900 to-slate-900"
                }
            },
            "transfers" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-trf-roundtrip",
                    ["title"] = "Airport Roundtrip Discount: Flat 20% Off",
                    ["subtitle"] = "Book your airport arrival pickup and return transfer together for guaranteed savings.",
                    ["tag"] = "Airport Special",
                    ["buttonText"] = "Book Airport Transfer",
                    ["buttonUrl"] = "/en/transfers",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85",
                    ["bgGradient"] = "from-neutral-800 via-neutral-900 to-black"
                },
                new JsonObject
                {
                    ["id"] = "banner-trf-intercity",
                    ["title"] = "Dubai to Abu Dhabi Intercity Flat Rates",
                    ["subtitle"] = "Private luxury sedans and family SUVs with English-speaking chauffeurs and free waiting time.",
                    ["tag"] = "Fixed Fares",
                    ["buttonText"] = "Explore Cab Routes",
                    ["buttonUrl"] = "/en/transfers",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85",
                    ["bgGradient"] = "from-amber-700 via-yellow-800 to-stone-900"
                }
            },
            "flights" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-airfare-stv",
                    ["title"] = "Exclusive Surat (STV) to Dubai Direct Flights",
                    ["subtitle"] = "Special group discounts with confirmed Pure Veg and Jain meals included.",
                    ["tag"] = "Direct Flight",
                    ["buttonText"] = "Book Now",
                    ["buttonUrl"] = "/en/flights",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85",
                    ["bgGradient"] = "from-sky-700 via-blue-800 to-indigo-900"
                },
                new JsonObject
                {
                    ["id"] = "banner-airfare-emirates",
                    ["title"] = "Emirates & Air India Special Holiday Fares",
                    ["subtitle"] = "Save up to 15% on return tickets with 30kg luggage allowance.",
                    ["tag"] = "Limited Offer",
                    ["buttonText"] = "View Fares",
                    ["buttonUrl"] = "/en/flights",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85",
                    ["bgGradient"] = "from-red-800 via-rose-900 to-amber-950"
                }
            },
            "packages" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-pkg-jain",
                    ["title"] = "All-Inclusive Dubai Family Holidays with Jain Food",
                    ["subtitle"] = "5D/4N luxury package with 4-star stays, desert safari, Burj Khalifa, and private cabs.",
                    ["tag"] = "Family Special",
                    ["buttonText"] = "View Package",
                    ["buttonUrl"] = "/en/holidays",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=85",
                    ["bgGradient"] = "from-emerald-700 via-teal-800 to-cyan-900"
                },
                new JsonObject
                {
                    ["id"] = "banner-pkg-bali",
                    ["title"] = "Bali Private Pool Villa 6D/5N Honeymoon Escape",
                    ["subtitle"] = "Free floating breakfast, Nusa Penida speedboat tour, and daily chauffeur.",
                    ["tag"] = "Honeymoon Special",
                    ["buttonText"] = "Explore Bali",
                    ["buttonUrl"] = "/en/holidays",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85",
                    ["bgGradient"] = "from-violet-800 via-purple-900 to-indigo-950"
                }
            },
            "tours" => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-tour-safari",
                    ["title"] = "Red Dune Desert Safari & BBQ Dinner",
                    ["subtitle"] = "4x4 Land Cruiser dune bashing, sandboarding, camel rides, and vegetarian BBQ buffet.",
                    ["tag"] = "Top Rated",
                    ["buttonText"] = "Book Safari",
                    ["buttonUrl"] = "/en/tours",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85",
                    ["bgGradient"] = "from-amber-700 via-orange-800 to-rose-900"
                },
                new JsonObject
                {
                    ["id"] = "banner-tour-burj",
                    ["title"] = "Burj Khalifa 124th + Dubai Aquarium Combo",
                    ["subtitle"] = "Save 25% with the official fast-track combo pass. Instant mobile voucher.",
                    ["tag"] = "Combo Pass",
                    ["buttonText"] = "Get Combo Pass",
                    ["buttonUrl"] = "/en/tours",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
                    ["bgGradient"] = "from-blue-800 via-sky-800 to-indigo-950"
                }
            },
            _ => new List<JsonObject>
            {
                new JsonObject
                {
                    ["id"] = "banner-general-1",
                    ["title"] = "Book With Confidence - Free Cancellation",
                    ["subtitle"] = "Enjoy zero cancellation fees up to 48 hours before departure on handpicked stays and tours.",
                    ["tag"] = "Flexi Booking",
                    ["buttonText"] = "Discover Stays",
                    ["buttonUrl"] = "/en/hotels",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
                    ["bgGradient"] = "from-blue-800 via-indigo-900 to-slate-900"
                },
                new JsonObject
                {
                    ["id"] = "banner-general-2",
                    ["title"] = "Verified Pure Veg & Jain Friendly Tours",
                    ["subtitle"] = "Never compromise on your dietary habits while exploring the world.",
                    ["tag"] = "Dietary Guarantee",
                    ["buttonText"] = "Learn More",
                    ["buttonUrl"] = "/en/tours",
                    ["imageUrl"] = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
                    ["image"] = "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85",
                    ["bgGradient"] = "from-emerald-700 via-teal-800 to-cyan-900"
                }
            }
        };
    }

    public static List<JsonObject> GetVideosForModule(string module)
    {
        return new List<JsonObject>
        {
            new JsonObject
            {
                ["id"] = "vid-1",
                ["title"] = "Dubai Desert Safari & Red Dune Bashing Experience",
                ["location"] = "Dubai Desert, UAE",
                ["duration"] = "1:15",
                ["thumbnail"] = TourPhotos[0],
                ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-safari-jeep-driving-on-sand-dunes-41852-large.mp4"
            },
            new JsonObject
            {
                ["id"] = "vid-2",
                ["title"] = "Atlantis The Palm Royal Suite & Waterpark Walkthrough",
                ["location"] = "Palm Jumeirah, Dubai",
                ["duration"] = "1:30",
                ["thumbnail"] = HotelPhotos[1],
                ["videoUrl"] = "https://assets.mixkit.co/videos/preview/mixkit-hotel-room-with-a-view-of-the-city-41712-large.mp4"
            }
        };
    }

    public static List<JsonObject> GetReviewsForModule(string module)
    {
        return new List<JsonObject>
        {
            new JsonObject
            {
                ["id"] = "rev-1",
                ["author"] = "Pooja Shah",
                ["city"] = "Surat, Gujarat",
                ["rating"] = 5,
                ["platform"] = "TripAdvisor",
                ["date"] = "2 days ago",
                ["text"] = "Our family trip to Dubai was absolutely magical! Every detail was taken care of—especially the delicious Jain meals arranged at every tour stop. The desert safari 4x4 pickup was right on time."
            },
            new JsonObject
            {
                ["id"] = "rev-2",
                ["author"] = "Jignesh Patel",
                ["city"] = "Ahmedabad, Gujarat",
                ["rating"] = 5,
                ["platform"] = "Google Reviews",
                ["date"] = "1 week ago",
                ["text"] = "Booked the 5D/4N Dubai Grand Vacation Package. Seamless private transfers from airport, prompt WhatsApp concierge assistance, and beautiful hotel rooms. Highly recommended!"
            },
            new JsonObject
            {
                ["id"] = "rev-3",
                ["author"] = "Anand Mehra",
                ["city"] = "Mumbai, Maharashtra",
                ["rating"] = 5,
                ["platform"] = "Trustpilot",
                ["date"] = "2 weeks ago",
                ["text"] = "Fastest visa service ever. Received our 30-day UAE tourist visas within 24 hours without any paperwork hassle. Customer support was polite and knowledgeable."
            }
        };
    }

    public static List<JsonObject> GetFaqForModule(string module)
    {
        return new List<JsonObject>
        {
            new JsonObject
            {
                ["id"] = "faq-1",
                ["question"] = "Are Pure Veg and Jain meal options guaranteed on tours?",
                ["answer"] = "Yes! All our tour packages, desert safaris, dhow dinner cruises, and hotel bookings include verified 100% Pure Vegetarian and Jain meal arrangements without root vegetables or onion/garlic."
            },
            new JsonObject
            {
                ["id"] = "faq-2",
                ["question"] = "How do I receive my booking vouchers and tickets?",
                ["answer"] = "Once booked, your confirmed e-vouchers with QR codes are immediately available in the app under 'Bookings' and also emailed to you. Simply display the voucher on your phone upon arrival."
            },
            new JsonObject
            {
                ["id"] = "faq-3",
                ["question"] = "What is the cancellation and refund policy?",
                ["answer"] = "Most tours and stays feature free cancellation up to 48 hours prior to departure. Instant refunds are processed directly to your original payment method or travel wallet."
            },
            new JsonObject
            {
                ["id"] = "faq-4",
                ["question"] = "Can I customize the itinerary or add extra days?",
                ["answer"] = "Absolutely! You can use our 'Build Package' feature or chat with our 24/7 WhatsApp concierge to customize hotels, add private vehicles, or include extra attraction tickets."
            }
        };
    }

    public static Tour? GetTourByIdOrSlug(string? idOrSlug, string? siteId = null) => GetTourDetail(idOrSlug, siteId);

    public static Tour GetTourDetail(string? idOrSlug, string? siteId = null)
    {
        var cleanSite = string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId.Trim().ToLowerInvariant();
        if (cleanSite.Contains("gujju") || cleanSite == "website1") cleanSite = "gujjutours";
        else if (cleanSite.Contains("tripgo") || cleanSite == "website2") cleanSite = "tripgoasia";
        else if (cleanSite.Contains("techno") || cleanSite == "website3") cleanSite = "technoheaven";
        else cleanSite = "gujjutours";

        var raw = (idOrSlug ?? "1").Trim();
        if (raw.Contains('/'))
        {
            raw = raw.Substring(raw.LastIndexOf('/') + 1).Trim();
        }
        var slugOrId = raw.ToLowerInvariant();

        // 1. Try disk seed files: tours.{cleanSite}.json
        var tourFromSeed = TryLoadFromSeedCatalog(slugOrId, cleanSite);
        if (tourFromSeed != null) return tourFromSeed;

        // 2. Try disk seed files: hotels.json or packages.json
        var itemFromOtherSeed = TryLoadFromOtherSeed(slugOrId, cleanSite);
        if (itemFromOtherSeed != null) return itemFromOtherSeed;

        // 3. Known Curated Tours & Experiences
        if (slugOrId.Contains("desert-safari") || slugOrId == "t-desert-safari")
        {
            return new Tour
            {
                Id = "t-desert-safari",
                TourNumericId = 1001,
                Website = cleanSite,
                WebsiteId = cleanSite,
                Name = "Red Dune Desert Safari & BBQ Dinner",
                Title = "Red Dune Desert Safari & BBQ Dinner",
                Slug = "dubai-red-dune-desert-safari-bbq",
                Category = "Desert & Safari",
                Destination = "Dubai, United Arab Emirates",
                Location = "Lahbab Red Dunes Desert, Dubai",
                Country = "United Arab Emirates",
                Description = "Embark on an exhilarating desert adventure in Dubai featuring high red dune bashing in a 4x4 Land Cruiser, sandboarding down crimson dunes, camel rides, and a traditional Bedouin camp experience with an unlimited Pure Veg & Jain BBQ buffet and captivating live Tanoura and fire performances.",
                ShortDescription = "4x4 red dune bashing, sunset camel rides, and gourmet Pure Veg & Jain BBQ dinner under desert stars.",
                FullDescription = "Experience the best of the Arabian desert. Your afternoon journey begins with luxury 4x4 pickup from your hotel, driving into the iconic Lahbab high red dunes. Experience 45 minutes of thrilling dune bashing led by licensed master drivers, try sandboarding down golden ridges, and capture spectacular sunset portraits. Arrive at our five-star desert safari camp where Arabic coffee (Gahwa) and dates await. Enjoy camel rides, henna painting, and live entertainment including Tanoura dancing and fire shows, complemented by a lavish 5-star Pure Veg & Jain buffet dinner.",
                Price = 3200,
                OriginalPrice = 4200,
                DiscountedPrice = 3200,
                Currency = "INR",
                Duration = "6 Hours",
                DurationDays = 1,
                DurationNights = 0,
                Difficulty = "Easy",
                Rating = 4.9,
                Reviews = 2840,
                ReviewCount = 2840,
                GroupSize = "6-7 per 4x4 vehicle",
                BestTime = "Afternoon (3:00 PM - 9:30 PM)",
                Language = "English, Hindi, Gujarati, Arabic",
                Image = TourPhotos[0],
                Gallery = new List<string>
                {
                    TourPhotos[0],
                    TourPhotos[1],
                    TourPhotos[2],
                    TourPhotos[4]
                },
                Highlights = new List<string>
                {
                    "4x4 Land Cruiser Red Dune Bashing with professional safari driver",
                    "Sunset photography stop on panoramic high crimson dunes",
                    "Complimentary sandboarding and desert camel rides",
                    "Gourmet 5-star Pure Veg & Jain BBQ dinner buffet",
                    "Live cultural entertainment: Tanoura, Fire Show, and Belly Dance"
                },
                Included = new List<string>
                {
                    "Hotel pickup and drop-off in air-conditioned 4x4 Land Cruiser",
                    "Licensed English & Hindi speaking safari marshal",
                    "Unlimited cold bottled water, soft drinks, Arabic tea & coffee",
                    "5-Star Pure Veg & Jain dinner buffet with separate dietary counters",
                    "Sandboarding equipment and traditional Arabic costume photography"
                },
                Excluded = new List<string>
                {
                    "Quad biking / ATV rentals (available at campsite for extra charge)",
                    "Alcoholic beverages",
                    "Personal souvenirs and photography packages"
                },
                Itinerary = new List<ItineraryDay>
                {
                    new ItineraryDay
                    {
                        Day = 1,
                        Title = "Dune Bashing, Sandboarding & Sunset Views",
                        Description = "Afternoon 3:00 PM pickup from your hotel in Dubai in an air-conditioned 4x4 Land Cruiser. Arrive at the Lahbab high red dunes for 45 minutes of exhilarating dune bashing, followed by a panoramic sunset photo stop and sandboarding."
                    },
                    new ItineraryDay
                    {
                        Day = 2,
                        Title = "Bedouin Camp, Cultural Shows & Jain BBQ Dinner",
                        Description = "Arrive at the traditional desert camp welcomed with Gahwa and fresh dates. Enjoy camel riding, henna tattoo art, and shisha. Watch world-class Tanoura spinning and fire dancing while savoring a five-star Pure Veg and Jain dinner buffet. Return drop-off at your hotel by 9:30 PM."
                    }
                },
                GuestReviews = new List<GuestReview>
                {
                    new GuestReview
                    {
                        Author = "Bhavin Patel",
                        Rating = 5,
                        Text = "Exceptional safari experience! The driver was superb and very courteous. The dedicated Jain food counter had hot, delicious food without onion and garlic. The Tanoura show was mesmerizing!",
                        Date = "November 2026",
                        Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"
                    },
                    new GuestReview
                    {
                        Author = "Pooja Shah",
                        Rating = 5,
                        Text = "Everything was smoothly organized from pickup to drop-off. The red dunes are unbelievable at sunset. Highly recommended for families!",
                        Date = "October 2026",
                        Avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
                    }
                }
            };
        }

        if (slugOrId.Contains("burj-khalifa") || slugOrId == "t-burj-khalifa")
        {
            return new Tour
            {
                Id = "t-burj-khalifa",
                TourNumericId = 1002,
                Website = cleanSite,
                WebsiteId = cleanSite,
                Name = "Burj Khalifa At the Top (124th & 125th Floor)",
                Title = "Burj Khalifa At the Top (124th & 125th Floor)",
                Slug = "burj-khalifa-at-the-top-tickets",
                Category = "Attractions & Sightseeing",
                Destination = "Dubai, United Arab Emirates",
                Location = "Downtown Dubai, UAE",
                Country = "United Arab Emirates",
                Description = "Ascend the world's tallest skyscraper in high-speed double-deck elevators traveling at 10 meters per second. Enjoy breathtaking 360-degree panoramic views of Dubai's futuristic skyline, the Dubai Fountain, and the Persian Gulf from the observation decks on Levels 124 and 125.",
                ShortDescription = "Fast-track tickets to Levels 124 & 125 of Burj Khalifa with outdoor observation terrace and high-powered telescopes.",
                FullDescription = "Stand on top of the world at Burj Khalifa, the crowning jewel of Dubai. Ride the world's fastest double-deck elevators to the 124th floor observation deck at 452 meters above ground. Step onto the open-air outdoor terrace to gaze across the desert, city, and sea. Explore Level 125, decorated in Arabic mashrabiya motifs, featuring high-powered view-finding telescopes and interactive green-screen photography.",
                Price = 4150,
                OriginalPrice = 4900,
                DiscountedPrice = 4150,
                Currency = "INR",
                Duration = "2 Hours",
                DurationDays = 1,
                DurationNights = 0,
                Difficulty = "Easy",
                Rating = 4.9,
                Reviews = 3520,
                ReviewCount = 3520,
                GroupSize = "Self-guided entry",
                BestTime = "Morning / Sunset hours",
                Language = "English, Arabic, Multi-language guides",
                Image = TourPhotos[1],
                Gallery = new List<string>
                {
                    TourPhotos[1],
                    TourPhotos[0],
                    TourPhotos[2],
                    TourPhotos[5]
                },
                Highlights = new List<string>
                {
                    "Instant guaranteed entry to Burj Khalifa Levels 124 and 125",
                    "Ride the world's fastest elevator ascending at 10 meters per second",
                    "Gaze through high-powered observation telescopes to see Dubai past and present",
                    "Step onto the outdoor open-air observation terrace for unobstructed photos",
                    "Interactive falcon-eye glass flooring on Level 125"
                },
                Included = new List<string>
                {
                    "Admission ticket to At the Top (Levels 124 and 125)",
                    "Access to the outdoor observation deck terrace",
                    "High-speed elevator ride with multimedia presentation",
                    "Complimentary high-speed guest Wi-Fi throughout the venue"
                },
                Excluded = new List<string>
                {
                    "Access to Level 148 (At the Top SKY)",
                    "Food and beverages at the cafe",
                    "Hotel pickup and drop-off (optional add-on)"
                },
                Itinerary = new List<ItineraryDay>
                {
                    new ItineraryDay
                    {
                        Day = 1,
                        Title = "Arrival at Dubai Mall & High-Speed Elevator Ride",
                        Description = "Arrive at the Lower Ground level of Dubai Mall. Present your mobile e-ticket voucher and bypass ticket counter queues. Board the double-decker elevator to ascend to Level 124 in just 60 seconds."
                    },
                    new ItineraryDay
                    {
                        Day = 2,
                        Title = "Panoramic Observation & Level 125 Interactive Floor",
                        Description = "Spend 90 to 120 minutes exploring Levels 124 and 125. Walk on the open-air terrace, admire the Dubai Fountain from above, and enjoy photo keepsakes before descending to the mall."
                    }
                },
                GuestReviews = new List<GuestReview>
                {
                    new GuestReview
                    {
                        Author = "Deepak Mehta",
                        Rating = 5,
                        Text = "The view from level 124 is out of this world! Booking through the app was completely hassle-free with immediate mobile barcode entry.",
                        Date = "November 2026",
                        Avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop"
                    }
                }
            };
        }

        // 4. Fallback for all other tours, hotels, packages, or custom IDs
        var humanTitle = ToTitleCase(slugOrId.Replace("-", " ").Replace("_", " "));
        var isHotel = slugOrId.Contains("hotel") || slugOrId.Contains("resort") || slugOrId.Contains("apartment") || slugOrId.Contains("palace") || slugOrId.Contains("stay") || slugOrId.StartsWith("h-");
        var isPackage = slugOrId.Contains("package") || slugOrId.Contains("tour") || slugOrId.StartsWith("pkg-") || slugOrId.Contains("holiday");

        var destination = "Dubai, UAE";
        var country = "United Arab Emirates";
        if (slugOrId.Contains("bali") || slugOrId.Contains("ubud")) { destination = "Bali, Indonesia"; country = "Indonesia"; }
        else if (slugOrId.Contains("singapore")) { destination = "Singapore"; country = "Singapore"; }
        else if (slugOrId.Contains("thailand") || slugOrId.Contains("bangkok") || slugOrId.Contains("phuket")) { destination = "Bangkok, Thailand"; country = "Thailand"; }
        else if (slugOrId.Contains("udaipur") || slugOrId.Contains("rajasthan")) { destination = "Udaipur, Rajasthan"; country = "India"; }
        else if (slugOrId.Contains("kerala") || slugOrId.Contains("munnar")) { destination = "Kerala, India"; country = "India"; }
        else if (slugOrId.Contains("vietnam") || slugOrId.Contains("hanoi")) { destination = "Halong Bay, Vietnam"; country = "Vietnam"; }
        else if (slugOrId.Contains("kutch") || slugOrId.Contains("gujarat") || slugOrId.Contains("diu") || slugOrId.Contains("gir") || slugOrId.Contains("unity")) { destination = "Gujarat, India"; country = "India"; }

        var photoIdx = Math.Abs(slugOrId.GetHashCode()) % TourPhotos.Length;
        var heroPhoto = isHotel ? HotelPhotos[Math.Abs(slugOrId.GetHashCode()) % HotelPhotos.Length] : TourPhotos[photoIdx];

        return new Tour
        {
            Id = slugOrId,
            TourNumericId = Math.Abs(slugOrId.GetHashCode() % 9000) + 1000,
            Website = cleanSite,
            WebsiteId = cleanSite,
            Name = humanTitle,
            Title = humanTitle,
            Slug = slugOrId,
            Category = isHotel ? "Luxury Stays" : (isPackage ? "Holiday Packages" : "Guided Tours"),
            Destination = destination,
            Location = $"{humanTitle}, {destination}",
            Country = country,
            Description = $"Discover the finest {humanTitle} with premium hospitality, authentic curated excursions, verified Pure Vegetarian & Jain culinary dining options, and 24/7 dedicated customer assistance.",
            ShortDescription = $"Handcrafted {humanTitle} experience with guaranteed luxury amenities, private transfers, and verified Pure Veg & Jain meals.",
            FullDescription = $"Embark on an unforgettable journey with {humanTitle}. Handcrafted by our destination experts for discerning travelers, this complete experience includes premium accommodations, seamless transfers, local licensed guides, entrance tickets, and customized daily excursions with all dietary preferences graciously honored.",
            Price = 14999,
            OriginalPrice = 18500,
            DiscountedPrice = 14999,
            Currency = "INR",
            Duration = isHotel ? "3 Nights / 4 Days" : "Full Day Experience",
            DurationDays = 4,
            DurationNights = 3,
            Difficulty = "Easy",
            Rating = 4.9,
            Reviews = 186,
            ReviewCount = 186,
            GroupSize = "2-10 Travelers",
            BestTime = "September to April",
            Language = "English, Hindi, Gujarati",
            Image = heroPhoto,
            Gallery = new List<string>
            {
                heroPhoto,
                HotelPhotos[0],
                TourPhotos[1],
                PackagePhotos[0]
            },
            Highlights = new List<string>
            {
                "Top-rated curated itinerary with priority entrance access",
                "100% verified Pure Vegetarian and Jain dining arrangements",
                "Comfortable private air-conditioned vehicle transfers",
                "Experienced English and Hindi speaking tour specialist",
                "Complimentary high-speed Wi-Fi and 24/7 WhatsApp concierge"
            },
            Included = new List<string>
            {
                "Premium accommodation / experience admission",
                "Daily breakfast with pure veg and Jain meal counters",
                "Private AC vehicle for all transfers and sightseeing",
                "All monument taxes, toll charges, and parking fees",
                "Dedicated 24/7 local trip assistance team"
            },
            Excluded = new List<string>
            {
                "Airfare and international visa fees",
                "Personal expenses, laundry, and telephone calls",
                "Optional adventure activities not mentioned in itinerary"
            },
            Itinerary = new List<ItineraryDay>
            {
                new ItineraryDay
                {
                    Day = 1,
                    Title = "Arrival, Warm Welcome & Evening Leisure",
                    Description = "Arrive at the destination where our private chauffeur welcomes you. Transfer to the property for VIP check-in, relax, and enjoy an evening orientation stroll with gourmet dinner."
                },
                new ItineraryDay
                {
                    Day = 2,
                    Title = "Signature Sightseeing & Cultural Highlights",
                    Description = "After a fresh breakfast, embark on a full-day guided exploration covering iconic landmarks, architectural marvels, and authentic cultural quarters with dedicated photo stops."
                },
                new ItineraryDay
                {
                    Day = 3,
                    Title = "Scenic Excursion, Shopping & Evening Show",
                    Description = "Explore natural scenic wonders, vibrant traditional bazaars for handcrafted souvenirs, and attend a captivating evening cultural show with dinner."
                },
                new ItineraryDay
                {
                    Day = 4,
                    Title = "Leisurely Morning & Departure Transfer",
                    Description = "Savor your final morning breakfast, capture last-minute memories, and enjoy a comfortable private transfer to the airport or railway station for your onward journey."
                }
            },
            GuestReviews = new List<GuestReview>
            {
                new GuestReview
                {
                    Author = "Rajesh Mehta",
                    Rating = 5,
                    Text = "Flawless arrangements from start to finish! The Jain food was fresh and delicious at every stop, and the chauffeur was exceptionally polite and punctual.",
                    Date = "November 2026",
                    Avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop"
                },
                new GuestReview
                {
                    Author = "Sneha Trivedi",
                    Rating = 5,
                    Text = "We traveled as a family of five. Everything went like clockwork. Beautiful hotels, clean vehicles, and excellent communication throughout.",
                    Date = "October 2026",
                    Avatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"
                }
            }
        };
    }

    private static Tour? TryLoadFromSeedCatalog(string slugOrId, string cleanSite)
    {
        try
        {
            var fileName = $"tours.{cleanSite}.json";
            var currentDir = Directory.GetCurrentDirectory();
            var candidates = new[]
            {
                Path.Combine(currentDir, "seed", fileName),
                Path.Combine(currentDir, "backend", "toursApi", "seed", fileName),
                Path.Combine(currentDir, "..", "..", "seed", fileName),
                Path.Combine(AppContext.BaseDirectory, "seed", fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "toursApi", "seed", fileName)
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    var json = File.ReadAllText(path);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<Tour>>(json, opts);
                    if (list != null)
                    {
                        var match = list.FirstOrDefault(t =>
                            string.Equals(t.Slug, slugOrId, StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(t.Id, slugOrId, StringComparison.OrdinalIgnoreCase) ||
                            (int.TryParse(slugOrId, out int nid) && t.TourNumericId == nid));
                        if (match != null)
                        {
                            EnsureTourHasRichDefaults(match);
                            return match;
                        }
                    }
                }
            }
        }
        catch {}
        return null;
    }

    private static Tour? TryLoadFromOtherSeed(string slugOrId, string cleanSite)
    {
        try
        {
            var currentDir = Directory.GetCurrentDirectory();
            var seedDirs = new[]
            {
                Path.Combine(currentDir, "seed", cleanSite),
                Path.Combine(currentDir, "backend", "toursApi", "seed", cleanSite),
                Path.Combine(currentDir, "..", "..", "seed", cleanSite),
                Path.Combine(AppContext.BaseDirectory, "seed", cleanSite),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", cleanSite),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "toursApi", "seed", cleanSite)
            };

            foreach (var dir in seedDirs)
            {
                if (!Directory.Exists(dir)) continue;

                // Check activities.json, hotels.json, packages.json
                var fileNames = new[] { "activities.json", "hotels.json", "packages.json" };
                foreach (var fn in fileNames)
                {
                    var fullPath = Path.Combine(dir, fn);
                    if (!File.Exists(fullPath)) continue;

                    var json = File.ReadAllText(fullPath);
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.ValueKind != JsonValueKind.Array) continue;

                    foreach (var elem in doc.RootElement.EnumerateArray())
                    {
                        var idProp = elem.TryGetProperty("id", out var idVal) ? idVal.ToString() : "";
                        var slugProp = elem.TryGetProperty("slug", out var slugVal) ? slugVal.ToString() : "";
                        var activityIdProp = elem.TryGetProperty("activityId", out var actIdVal) ? actIdVal.ToString() : "";
                        var nameProp = elem.TryGetProperty("name", out var nameVal)
                            ? nameVal.ToString()
                            : (elem.TryGetProperty("title", out var titleVal) ? titleVal.ToString() : "");

                        bool isMatch = string.Equals(idProp, slugOrId, StringComparison.OrdinalIgnoreCase) ||
                                       string.Equals(slugProp, slugOrId, StringComparison.OrdinalIgnoreCase) ||
                                       string.Equals(activityIdProp, slugOrId, StringComparison.OrdinalIgnoreCase) ||
                                       (nameProp.Length > 0 && slugOrId.Length > 5 && nameProp.ToLowerInvariant().Contains(slugOrId));

                        if (isMatch)
                        {
                            var price = elem.TryGetProperty("price", out var pVal) && pVal.TryGetDouble(out var p) ? p : 3860;
                            var originalPrice = elem.TryGetProperty("originalPrice", out var opVal) && opVal.TryGetDouble(out var op) ? op : price * 1.25;
                            var rating = elem.TryGetProperty("rating", out var rVal) && rVal.TryGetDouble(out var r) ? r : 4.9;
                            var reviews = elem.TryGetProperty("reviews", out var rvVal) && rvVal.TryGetInt32(out var rv) ? rv : (elem.TryGetProperty("reviewCount", out var rcVal) && rcVal.TryGetInt32(out var rc) ? rc : 142);
                            var city = elem.TryGetProperty("city", out var cVal) ? cVal.ToString() : (elem.TryGetProperty("destination", out var dVal) ? dVal.ToString() : "Jaipur");
                            var country = elem.TryGetProperty("country", out var cntVal) ? cntVal.ToString() : "India";
                            var duration = elem.TryGetProperty("duration", out var durVal) ? durVal.ToString() : (fn.Contains("hotel") ? "3 Nights / 4 Days" : "Full Day Experience");
                            var category = elem.TryGetProperty("category", out var catVal) ? catVal.ToString() : (fn.Contains("hotel") ? "Luxury Stays" : "Desert Safaris & Tours");

                            var image = fn.Contains("hotel") ? HotelPhotos[0] : TourPhotos[0];
                            if (elem.TryGetProperty("image", out var imgVal) && !string.IsNullOrWhiteSpace(imgVal.GetString()))
                            {
                                image = imgVal.GetString()!;
                            }
                            else if (elem.TryGetProperty("imageUrl", out var imgUrlVal) && !string.IsNullOrWhiteSpace(imgUrlVal.GetString()))
                            {
                                image = imgUrlVal.GetString()!;
                            }

                            var galleryList = new List<string> { image };
                            if (elem.TryGetProperty("gallery", out var galVal) && galVal.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var g in galVal.EnumerateArray())
                                {
                                    var gStr = g.GetString();
                                    if (!string.IsNullOrWhiteSpace(gStr) && !galleryList.Contains(gStr))
                                    {
                                        galleryList.Add(gStr);
                                    }
                                }
                            }
                            if (galleryList.Count < 2)
                            {
                                galleryList.Add(TourPhotos[1]);
                                galleryList.Add(TourPhotos[2]);
                            }

                            var highlightsList = new List<string>();
                            if (elem.TryGetProperty("highlights", out var hlVal) && hlVal.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var h in hlVal.EnumerateArray())
                                {
                                    var hStr = h.GetString();
                                    if (!string.IsNullOrWhiteSpace(hStr)) highlightsList.Add(hStr);
                                }
                            }
                            if (highlightsList.Count == 0)
                            {
                                highlightsList.AddRange(new[]
                                {
                                    "Instant digital confirmation voucher with QR code access",
                                    "Licensed English & Hindi speaking storytelling guide",
                                    "Dedicated 100% Pure Vegetarian & Jain dining options included",
                                    "Door-to-door air-conditioned hotel transfers available"
                                });
                            }

                            var includedList = new List<string>();
                            if (elem.TryGetProperty("included", out var incVal) && incVal.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var inc in incVal.EnumerateArray())
                                {
                                    var incStr = inc.GetString();
                                    if (!string.IsNullOrWhiteSpace(incStr)) includedList.Add(incStr);
                                }
                            }
                            if (includedList.Count == 0)
                            {
                                includedList.AddRange(new[]
                                {
                                    "All entrance admissions and sightseeing tickets",
                                    "Professional tour marshal and storytelling guide",
                                    "All local taxes, road tolls, and fuel surcharges"
                                });
                            }

                            var excludedList = new List<string>();
                            if (elem.TryGetProperty("excluded", out var excVal) && excVal.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var exc in excVal.EnumerateArray())
                                {
                                    var excStr = exc.GetString();
                                    if (!string.IsNullOrWhiteSpace(excStr)) excludedList.Add(excStr);
                                }
                            }
                            if (excludedList.Count == 0)
                            {
                                excludedList.AddRange(new[]
                                {
                                    "Personal expenses, shopping, and souvenirs",
                                    "Optional gratuities and tips"
                                });
                            }

                            var resolvedSlug = !string.IsNullOrWhiteSpace(slugProp) ? slugProp : slugOrId;
                            var resolvedId = !string.IsNullOrWhiteSpace(idProp) ? idProp : slugOrId;

                            return new Tour
                            {
                                Id = resolvedId,
                                TourNumericId = int.TryParse(idProp, out var numId) ? numId : Math.Abs(resolvedSlug.GetHashCode() % 9000) + 1000,
                                Website = cleanSite,
                                WebsiteId = cleanSite,
                                Name = string.IsNullOrWhiteSpace(nameProp) ? ToTitleCase(resolvedSlug.Replace("-", " ")) : nameProp,
                                Title = string.IsNullOrWhiteSpace(nameProp) ? ToTitleCase(resolvedSlug.Replace("-", " ")) : nameProp,
                                Slug = resolvedSlug,
                                Category = category,
                                Destination = $"{city}, {country}",
                                Location = $"{nameProp}, {city}",
                                Country = country,
                                Description = $"Experience an unforgettable journey with {nameProp}. Featuring verified luxury amenities, licensed local guides, and dedicated Pure Veg & Jain dining.",
                                ShortDescription = $"Top-rated {nameProp} with verified Pure Veg & Jain meals and instant confirmation.",
                                FullDescription = $"Discover the best of {city} with {nameProp}. Handpicked for exceptional quality, comfort, and safety. Includes comprehensive excursions, licensed guides, and seamless customer support.",
                                Price = price,
                                OriginalPrice = originalPrice,
                                DiscountedPrice = price,
                                Currency = "INR",
                                Duration = duration,
                                DurationDays = 1,
                                DurationNights = 0,
                                Difficulty = "Easy",
                                Rating = rating,
                                Reviews = reviews,
                                ReviewCount = reviews,
                                GroupSize = "Shared & Private Options",
                                BestTime = "Year-round",
                                Language = "English, Hindi, Gujarati",
                                Image = image,
                                Gallery = galleryList,
                                Highlights = highlightsList,
                                Included = includedList,
                                Excluded = excludedList,
                                Itinerary = new List<ItineraryDay>
                                {
                                    new ItineraryDay
                                    {
                                        Day = 1,
                                        Title = "Arrival & Welcome Briefing",
                                        Description = "Arrive at meeting point or hotel pickup. Meet your certified tour guide and receive digital credentials."
                                    },
                                    new ItineraryDay
                                    {
                                        Day = 2,
                                        Title = "Guided Sightseeing & Activities",
                                        Description = "Experience the curated highlights with dedicated commentary, photo stops, and refreshments."
                                    }
                                }
                            };
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TryLoadFromOtherSeed] Error loading seed: {ex.Message}");
        }
        return null;
    }

    private static void EnsureTourHasRichDefaults(Tour t)
    {
        if (t.Gallery == null || t.Gallery.Count == 0)
        {
            t.Gallery = new List<string>
            {
                !string.IsNullOrWhiteSpace(t.Image) ? t.Image : TourPhotos[0],
                TourPhotos[1],
                TourPhotos[2],
                HotelPhotos[0]
            };
        }
        if (t.Highlights == null || t.Highlights.Count == 0)
        {
            t.Highlights = new List<string>
            {
                "Top-rated sightseeing itinerary with verified local guides",
                "Dedicated Pure Vegetarian and Jain meal arrangements",
                "Comfortable private vehicle transport throughout the tour",
                "Instant digital vouchers with QR code admission"
            };
        }
        if (t.Included == null || t.Included.Count == 0)
        {
            t.Included = new List<string>
            {
                "Hotel / experience admission and guided excursions",
                "Daily breakfast with pure veg and Jain dining counters",
                "All monument entrance fees and local transport"
            };
        }
        if (t.Excluded == null || t.Excluded.Count == 0)
        {
            t.Excluded = new List<string>
            {
                "Personal expenses, telephone, and tipping",
                "Optional recreational activities not listed in itinerary"
            };
        }
        if (t.Itinerary == null || t.Itinerary.Count == 0)
        {
            t.Itinerary = new List<ItineraryDay>
            {
                new ItineraryDay { Day = 1, Title = "Arrival & Welcome", Description = "Arrive and settle in with an orientation briefing and dinner." },
                new ItineraryDay { Day = 2, Title = "Main Sightseeing & Highlights", Description = "Full-day guided exploration of major sights with photo stops." },
                new ItineraryDay { Day = 3, Title = "Leisure & Departure", Description = "Enjoy morning breakfast and transfer to departure point." }
            };
        }
        if (t.GuestReviews == null || t.GuestReviews.Count == 0)
        {
            t.GuestReviews = new List<GuestReview>
            {
                new GuestReview
                {
                    Author = "Nilesh Joshi",
                    Rating = 5,
                    Text = "Fantastic trip! Everything was organized impeccably, food was outstanding and authentic. Will definitely book again!",
                    Date = "November 2026",
                    Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"
                }
            };
        }
    }

    private static string ToTitleCase(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var words = text.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
        return string.Join(" ", words.Select(w => char.ToUpperInvariant(w[0]) + (w.Length > 1 ? w.Substring(1).ToLowerInvariant() : "")));
    }
}


