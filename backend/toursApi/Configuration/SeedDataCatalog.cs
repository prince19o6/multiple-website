using System;
using System.Collections.Generic;
using System.Linq;
using ToursApi.Models;

namespace ToursApi.Configuration;

public static class SeedDataCatalog
{
    public static List<Destination> Website1Destinations() => new()
    {
        new Destination { Website = "website1", Name = "Rann of Kutch, Gujarat", Image = "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&h=500&fit=crop", Tours = 4, SortOrder = 0 },
        new Destination { Website = "website1", Name = "Dwarka & Somnath, Gujarat", Image = "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=500&fit=crop", Tours = 2, SortOrder = 1 },
        new Destination { Website = "website1", Name = "Sasan Gir & Junagadh, Gujarat", Image = "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=600&h=500&fit=crop", Tours = 2, SortOrder = 2 },
        new Destination { Website = "website1", Name = "Ahmedabad & Kevadia, Gujarat", Image = "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=500&fit=crop", Tours = 3, SortOrder = 3 },
        new Destination { Website = "website1", Name = "Royal Rajasthan", Image = "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&h=500&fit=crop", Tours = 2, SortOrder = 4 },
        new Destination { Website = "website1", Name = "Goa & Diu Beaches", Image = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&h=500&fit=crop", Tours = 4, SortOrder = 5 },
        new Destination { Website = "website1", Name = "Leh-Ladakh & Himalayas", Image = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=500&fit=crop", Tours = 4, SortOrder = 6 },
        new Destination { Website = "website1", Name = "Kerala & Backwaters", Image = "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=500&fit=crop", Tours = 2, SortOrder = 7 },
        new Destination { Website = "website1", Name = "Saputara & Polo Forest, Gujarat", Image = "https://images.unsplash.com/photo-1511497584788-87676104235f?w=600&h=500&fit=crop", Tours = 3, SortOrder = 8 },
        new Destination { Website = "website1", Name = "Varanasi & Amritsar", Image = "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&h=500&fit=crop", Tours = 2, SortOrder = 9 },
    };

    public static List<Destination> Website2Destinations() => new()
    {
        new Destination { Website = "website2", Name = "Bali, Indonesia", Image = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=500&fit=crop", Tours = 3, SortOrder = 0 },
        new Destination { Website = "website2", Name = "Phuket & Krabi, Thailand", Image = "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&h=500&fit=crop", Tours = 5, SortOrder = 1 },
        new Destination { Website = "website2", Name = "Ha Long Bay & Da Nang, Vietnam", Image = "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=500&fit=crop", Tours = 5, SortOrder = 2 },
        new Destination { Website = "website2", Name = "Borneo & Malaysia", Image = "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600&h=500&fit=crop", Tours = 6, SortOrder = 3 },
        new Destination { Website = "website2", Name = "Kyoto & Mount Fuji, Japan", Image = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=500&fit=crop", Tours = 4, SortOrder = 4 },
        new Destination { Website = "website2", Name = "Sri Lanka", Image = "https://images.unsplash.com/photo-1546708973-b339540b5162?w=600&h=500&fit=crop", Tours = 5, SortOrder = 5 },
        new Destination { Website = "website2", Name = "Raja Ampat & Komodo, Indonesia", Image = "https://images.unsplash.com/photo-1516690561799-46d8f74ff9ab?w=600&h=500&fit=crop", Tours = 2, SortOrder = 6 },
        new Destination { Website = "website2", Name = "Pokhara & Himalayas, Nepal", Image = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&h=500&fit=crop", Tours = 2, SortOrder = 7 },
        new Destination { Website = "website2", Name = "Boracay & Cebu, Philippines", Image = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=500&fit=crop", Tours = 2, SortOrder = 8 },
        new Destination { Website = "website2", Name = "Seoul & Jeju, South Korea", Image = "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&h=500&fit=crop", Tours = 2, SortOrder = 9 },
    };

    public static List<Destination> Website3Destinations() => new()
    {
        new Destination { Website = "website3", Name = "Maldives", Image = "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=500&fit=crop", Tours = 1, SortOrder = 0 },
        new Destination { Website = "website3", Name = "Santorini, Greece", Image = "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=500&fit=crop", Tours = 2, SortOrder = 1 },
        new Destination { Website = "website3", Name = "Bora Bora, French Polynesia", Image = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=500&fit=crop", Tours = 1, SortOrder = 2 },
        new Destination { Website = "website3", Name = "Amalfi Coast, Italy", Image = "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=500&fit=crop", Tours = 1, SortOrder = 3 },
        new Destination { Website = "website3", Name = "Maui, Hawaii", Image = "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=600&h=500&fit=crop", Tours = 1, SortOrder = 4 },
        new Destination { Website = "website3", Name = "Seychelles", Image = "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=600&h=500&fit=crop", Tours = 1, SortOrder = 5 },
        new Destination { Website = "website3", Name = "Fiji", Image = "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=500&fit=crop", Tours = 1, SortOrder = 6 },
        new Destination { Website = "website3", Name = "Riviera Maya, Mexico", Image = "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=600&h=500&fit=crop", Tours = 1, SortOrder = 7 },
        new Destination { Website = "website3", Name = "Mykonos, Greece", Image = "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=600&h=500&fit=crop", Tours = 1, SortOrder = 8 },
        new Destination { Website = "website3", Name = "St. Barts & Anguilla", Image = "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&h=500&fit=crop", Tours = 1, SortOrder = 9 },
    };

    public static List<Tour> Website1Tours() => new()
    {
        new Tour
        {
            Id = "seed-w1-1",
            TourNumericId = 1,
            Website = "website1",
            Name = "Paris City Tour",
            Description = "Explore the City of Light with iconic landmarks and charming streets",
            Price = 999,
            Duration = "5 days / 4 nights",
            Rating = 4.8,
            Reviews = 128,
            Image = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=600&fit=crop",
            Gallery = new List<string>
            {
                "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
                "https://images.unsplash.com/photo-1550340499-b12fa6f6c5f9?w=400&h=300&fit=crop",
            },
            Difficulty = "Easy",
            GroupSize = "8-12 people",
            BestTime = "April - May, September - October",
            Language = "English, French",
            FullDescription = "Experience the magic of Paris with our comprehensive 5-day city tour.",
            Highlights = new List<string>
            {
                "Eiffel Tower visit with summit access",
                "Louvre Museum guided tour",
                "Seine River evening cruise",
            },
            Included = new List<string>
            {
                "4 nights luxury 4-star hotel accommodation",
                "Daily gourmet breakfast",
                "Airport transfers",
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        },
        new Tour
        {
            Id = "seed-w1-2",
            TourNumericId = 2,
            Website = "website1",
            Name = "Tokyo Adventures",
            Description = "Immerse yourself in Japan's vibrant culture and modern traditions",
            Price = 1299,
            Duration = "7 days / 6 nights",
            Rating = 4.9,
            Reviews = 156,
            Image = "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&h=600&fit=crop",
            Gallery = new List<string>
            {
                "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=300&fit=crop",
            },
            Difficulty = "Moderate",
            GroupSize = "10-14 people",
            BestTime = "March - May, September - November",
            Language = "English, Japanese",
            FullDescription = "Discover the perfect blend of ancient tradition and cutting-edge modernity in Tokyo.",
            Highlights = new List<string>
            {
                "Senso-ji Temple & traditional crafts",
                "Shibuya Crossing",
                "Traditional tea ceremony experience",
            },
            Included = new List<string>
            {
                "6 nights 4-star hotel in central Tokyo",
                "JR Pass for trains",
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        },
        new Tour
        {
            Id = "seed-w1-3",
            TourNumericId = 3,
            Website = "website1",
            Name = "New York Experience",
            Description = "Discover the magic of the Big Apple with unforgettable experiences",
            Price = 899,
            Duration = "4 days / 3 nights",
            Rating = 4.7,
            Reviews = 203,
            Image = "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=600&fit=crop",
            Gallery = new List<string>
            {
                "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop",
            },
            Difficulty = "Easy",
            GroupSize = "6-10 people",
            BestTime = "September - November, March - May",
            Language = "English",
            FullDescription = "Experience the energy and excitement of New York City.",
            Highlights = new List<string>
            {
                "Statue of Liberty & Ellis Island tour",
                "Broadway show tickets",
            },
            Included = new List<string>
            {
                "3 nights 4-star Manhattan hotel",
                "Broadway show ticket",
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        },
    };

    public static List<Tour> Website2Tours() => new()
    {
        new Tour
        {
            Id = "seed-w2-1",
            TourNumericId = 1,
            Website = "website2",
            Name = "Patagonia Trekking Expedition",
            Description = "Trek through dramatic glaciers, granite peaks, and windswept steppe",
            Price = 1899,
            Duration = "9 days / 8 nights",
            Rating = 4.9,
            Reviews = 87,
            Image = "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=1200&h=600&fit=crop",
            Gallery = new List<string>
            {
                "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=400&h=300&fit=crop",
            },
            Difficulty = "Challenging",
            GroupSize = "6-10 people",
            BestTime = "November - March",
            Language = "English, Spanish",
            FullDescription = "A 9-day trekking expedition through Torres del Paine and the Patagonian wilderness.",
            Highlights = new List<string>
            {
                "Torres del Paine multi-day trek",
                "Perito Moreno Glacier boat excursion",
            },
            Included = new List<string>
            {
                "8 nights eco-lodges",
                "Professional mountain guide",
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        },
        new Tour
        {
            Id = "seed-w2-2",
            TourNumericId = 2,
            Website = "website2",
            Name = "Amazon Rainforest Expedition",
            Description = "Venture deep into the world's largest rainforest with expert naturalist guides",
            Price = 1599,
            Duration = "6 days / 5 nights",
            Rating = 4.8,
            Reviews = 64,
            Image = "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&h=600&fit=crop",
            Gallery = new List<string>
            {
                "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&h=300&fit=crop",
            },
            Difficulty = "Moderate",
            GroupSize = "8-12 people",
            BestTime = "June - November",
            Language = "English, Portuguese",
            FullDescription = "Explore the Amazon by canoe and on foot, staying in a remote jungle lodge.",
            Highlights = new List<string>
            {
                "Night caiman-spotting canoe trip",
                "Canopy walkway at sunrise",
            },
            Included = new List<string>
            {
                "5 nights jungle lodge accommodation",
                "All meals and guided excursions",
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        },
        new Tour
        {
            Id = "seed-w2-3",
            TourNumericId = 3,
            Website = "website2",
            Name = "Nepal Himalayan Trek",
            Description = "Trek toward Everest Base Camp through Sherpa villages and high-altitude trails",
            Price = 2199,
            Duration = "12 days / 11 nights",
            Rating = 4.9,
            Reviews = 112,
            Image = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&h=600&fit=crop",
            Gallery = new List<string>
            {
                "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop",
            },
            Difficulty = "Challenging",
            GroupSize = "6-8 people",
            BestTime = "March - May, September - November",
            Language = "English, Nepali",
            FullDescription = "A classic 12-day trek toward Everest Base Camp through the Khumbu region.",
            Highlights = new List<string>
            {
                "Everest Base Camp trek",
                "Sunrise over Kala Patthar",
            },
            Included = new List<string>
            {
                "11 nights teahouse lodging",
                "Licensed trekking guide and porter",
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        },
    };

    public static List<Tour> Website3Tours() => new()
    {
        new Tour
        {
            Id = "seed-w3-1",
            TourNumericId = 1,
            Website = "website3",
            Name = "Maldives Overwater Escape",
            Description = "Unwind in a private overwater villa surrounded by turquoise lagoons",
            Price = 2499,
            Duration = "6 days / 5 nights",
            Rating = 4.9,
            Reviews = 94,
            Image = "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&h=600&fit=crop",
            Gallery = new List<string>
            {
                "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop",
            },
            Difficulty = "Easy",
            GroupSize = "2-4 people",
            BestTime = "November - April",
            Language = "English",
            FullDescription = "A 5-night stay in an overwater villa with snorkeling, spa, and sunset cruises included.",
            Highlights = new List<string>
            {
                "Private overwater villa with lagoon access",
                "Sunset dolphin cruise",
            },
            Included = new List<string>
            {
                "5 nights overwater villa accommodation",
                "Speedboat airport transfers",
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        },
        new Tour
        {
            Id = "seed-w3-2",
            TourNumericId = 2,
            Website = "website3",
            Name = "Bali Luxury Retreat",
            Description = "Relax in a private pool villa surrounded by rice terraces and temples",
            Price = 1399,
            Duration = "7 days / 6 nights",
            Rating = 4.8,
            Reviews = 141,
            Image = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=600&fit=crop",
            Gallery = new List<string>
            {
                "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop",
            },
            Difficulty = "Easy",
            GroupSize = "2-6 people",
            BestTime = "April - October",
            Language = "English, Indonesian",
            FullDescription = "A 6-night Bali retreat combining private-villa relaxation with cultural excursions.",
            Highlights = new List<string>
            {
                "Private pool villa in Ubud",
                "Tegallalang rice terrace sunrise walk",
            },
            Included = new List<string>
            {
                "6 nights private pool villa",
                "Airport transfers and one guided day tour",
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        },
        new Tour
        {
            Id = "seed-w3-3",
            TourNumericId = 3,
            Website = "website3",
            Name = "Santorini Island Getaway",
            Description = "Take in whitewashed villages and caldera sunsets on the Greek island of Santorini",
            Price = 1699,
            Duration = "5 days / 4 nights",
            Rating = 4.9,
            Reviews = 176,
            Image = "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=600&fit=crop",
            Gallery = new List<string>
            {
                "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300&fit=crop",
            },
            Difficulty = "Easy",
            GroupSize = "2-8 people",
            BestTime = "May - October",
            Language = "English, Greek",
            FullDescription = "A 4-night stay in Oia with caldera views, a wine tour, and a private sunset catamaran cruise.",
            Highlights = new List<string>
            {
                "Oia sunset viewpoint",
                "Private catamaran cruise with dinner",
            },
            Included = new List<string>
            {
                "4 nights caldera-view accommodation",
                "Sunset catamaran cruise with dinner",
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        },
    };

    public static List<Tour> GetTours(string? websiteId)
    {
        var raw = (websiteId ?? "").Trim().ToLowerInvariant();
        List<Tour> tours;
        if (raw.Contains("website3") || raw.Contains("technoheaven") || raw.Contains("holidayparadise"))
            tours = Website3Tours();
        else if (raw.Contains("website2") || raw.Contains("tripgoasia") || raw.Contains("adventureworld"))
            tours = Website2Tours();
        else
            tours = Website1Tours();

        ToursApi.Common.UniqueImageRegistry.EnforceUniqueImages(tours);
        return tours;
    }

    public static List<Destination> GetDestinations(string? websiteId)
    {
        var raw = (websiteId ?? "").Trim().ToLowerInvariant();
        List<Destination> destinations;
        if (raw.Contains("website3") || raw.Contains("technoheaven") || raw.Contains("holidayparadise"))
            destinations = Website3Destinations();
        else if (raw.Contains("website2") || raw.Contains("tripgoasia") || raw.Contains("adventureworld"))
            destinations = Website2Destinations();
        else
            destinations = Website1Destinations();

        ToursApi.Common.UniqueImageRegistry.EnforceUniqueImages(destinations);
        return destinations;
    }

    public static List<Banner> GetBanners(string siteId)
    {
        var isGujju = siteId.Contains("gujju") || siteId.Contains("website1");
        var isTripGo = siteId.Contains("tripgo") || siteId.Contains("website2");

        List<Banner> banners;
        if (isGujju)
        {
            banners = new List<Banner>
            {
                new Banner
                {
                    WebsiteId = siteId,
                    Module = "home",
                    Title = "Discover Dubai & Gujarat With Gujju Tours",
                    Subtitle = "Customized holiday packages with 100% Pure Veg and Jain dining arrangements.",
                    Tagline = "AUTHENTIC EXPERIENCES & FAMILY CARE",
                    Badge = "SPECIAL SAVINGS",
                    ImageUrl = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=85",
                    CtaText = "Explore Dubai Packages",
                    CtaLink = "/en/packages",
                    SortOrder = 0,
                    IsActive = true
                },
                new Banner
                {
                    WebsiteId = siteId,
                    Module = "home",
                    Title = "Royal Rann Utsav & White Desert Safaris",
                    Subtitle = "Immerse in Kutch cultural nights, tent city luxury, and starlit desert camping.",
                    Tagline = "WINTER CARNIVAL 2026",
                    Badge = "LIMITED SLOTS",
                    ImageUrl = "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1600&q=85",
                    CtaText = "Book Kutch Tour",
                    CtaLink = "/en/tours",
                    SortOrder = 1,
                    IsActive = true
                },
                new Banner
                {
                    WebsiteId = siteId,
                    Module = "hotels",
                    Title = "Luxury Stays With Jain & Pure Veg Dining",
                    Subtitle = "Verified 5-star properties and desert resorts tailored for Indian travelers.",
                    Tagline = "HANDPICKED RESORTS",
                    Badge = "EXCLUSIVE RATES",
                    ImageUrl = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85",
                    CtaText = "View Hotels",
                    CtaLink = "/en/hotels",
                    SortOrder = 0,
                    IsActive = true
                }
            };
        }
        else if (isTripGo)
        {
            banners = new List<Banner>
            {
                new Banner
                {
                    WebsiteId = siteId,
                    Module = "home",
                    Title = "Epic Southeast Asia Island Expeditions",
                    Subtitle = "Explore pristine beaches of Bali, hidden coves of Krabi, and majestic Ha Long Bay.",
                    Tagline = "UNFORGETTABLE ADVENTURES",
                    Badge = "EARLY BIRD DEALS",
                    ImageUrl = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=85",
                    CtaText = "Discover Island Trips",
                    CtaLink = "/en/tours",
                    SortOrder = 0,
                    IsActive = true
                },
                new Banner
                {
                    WebsiteId = siteId,
                    Module = "home",
                    Title = "Kyoto & Mount Fuji Cultural Odyssey",
                    Subtitle = "Historic shrines, cherry blossoms, bullet train journeys, and authentic onsen stays.",
                    Tagline = "JAPAN DISCOVERY",
                    Badge = "FEATURED JOURNEY",
                    ImageUrl = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=85",
                    CtaText = "View Japan Packages",
                    CtaLink = "/en/packages",
                    SortOrder = 1,
                    IsActive = true
                }
            };
        }
        else
        {
            // Technoheaven B2B
            banners = new List<Banner>
            {
                new Banner
                {
                    WebsiteId = siteId,
                    Module = "home",
                    Title = "Next-Gen Global Travel Distribution Platform",
                    Subtitle = "Real-time XML API feeds, contracted wholesale hotels, dynamic packaging, and instant booking confirmations.",
                    Tagline = "ENTERPRISE B2B TRAVEL TECH",
                    Badge = "GLOBAL DMC NETWORK",
                    ImageUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=85",
                    CtaText = "Integrate API",
                    CtaLink = "/en/contact-us",
                    SortOrder = 0,
                    IsActive = true
                },
                new Banner
                {
                    WebsiteId = siteId,
                    Module = "home",
                    Title = "Wholesale Rates Across 250,000+ Verified Stays",
                    Subtitle = "Direct supplier contracts, corporate credit facilities, and guaranteed 99.9% uptime SLA.",
                    Tagline = "DIRECT INVENTORY",
                    Badge = "B2B WHOLESALE",
                    ImageUrl = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=85",
                    CtaText = "Explore Inventory",
                    CtaLink = "/en/hotels",
                    SortOrder = 1,
                    IsActive = true
                }
            };
        }

        ToursApi.Common.UniqueImageRegistry.EnforceUniqueImages(banners);
        return banners;
    }

    public static List<SpecialOffer> GetOffers(string siteId)
    {
        var isGujju = siteId.Contains("gujju") || siteId.Contains("website1");
        var isTripGo = siteId.Contains("tripgo") || siteId.Contains("website2");

        List<SpecialOffer> offers;
        if (isGujju)
        {
            offers = new List<SpecialOffer>
            {
                new SpecialOffer
                {
                    WebsiteId = siteId,
                    Code = "GUJJU15",
                    Title = "Dubai Family Mega Saver",
                    Description = "Get flat 15% discount on Dubai packages including Burj Khalifa & Desert Safari.",
                    DiscountPercent = 15,
                    Badge = "POPULAR",
                    ImageUrl = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
                    ExpiryDate = DateTime.UtcNow.AddMonths(3),
                    SortOrder = 0,
                    IsActive = true
                },
                new SpecialOffer
                {
                    WebsiteId = siteId,
                    Code = "KUTCH20",
                    Title = "Rann Utsav Tent City Early Booking",
                    Description = "Save 20% on premium AC Swiss tents with Gujarati cultural dinner included.",
                    DiscountPercent = 20,
                    Badge = "LIMITED",
                    ImageUrl = "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80",
                    ExpiryDate = DateTime.UtcNow.AddMonths(2),
                    SortOrder = 1,
                    IsActive = true
                }
            };
        }
        else if (isTripGo)
        {
            offers = new List<SpecialOffer>
            {
                new SpecialOffer
                {
                    WebsiteId = siteId,
                    Code = "ASIAESCAPE",
                    Title = "Bali & Thailand Island Hopping Pass",
                    Description = "Save $120 on all combined beach resort and snorkeling tour packages.",
                    DiscountPercent = 12,
                    Badge = "BEST VALUE",
                    ImageUrl = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
                    ExpiryDate = DateTime.UtcNow.AddMonths(3),
                    SortOrder = 0,
                    IsActive = true
                }
            };
        }
        else
        {
            offers = new List<SpecialOffer>
            {
                new SpecialOffer
                {
                    WebsiteId = siteId,
                    Code = "B2BVOLUME",
                    Title = "Corporate High-Volume API Credit",
                    Description = "Extra 5% override commission on monthly bookings exceeding 100,000 AED.",
                    DiscountPercent = 5,
                    Badge = "ENTERPRISE",
                    ImageUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
                    ExpiryDate = DateTime.UtcNow.AddMonths(6),
                    SortOrder = 0,
                    IsActive = true
                }
            };
        }

        ToursApi.Common.UniqueImageRegistry.EnforceUniqueImages(offers);
        return offers;
    }

    public static List<TravelVideo> GetVideos(string siteId)
    {
        var videos = new List<TravelVideo>
        {
            new TravelVideo
            {
                WebsiteId = siteId,
                Title = "Sunset Over Dubai Marina & Desert Dunes",
                Destination = "Dubai, UAE",
                VideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-dubai-city-skyline-at-dusk-42171-large.mp4",
                ThumbnailUrl = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
                TravelerName = "Hardik & Priya Patel",
                ViewsCount = 14200,
                SortOrder = 0,
                IsActive = true
            },
            new TravelVideo
            {
                WebsiteId = siteId,
                Title = "Crystal Waters of Nusa Penida & Secret Lagoon",
                Destination = "Bali, Indonesia",
                VideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-rocky-coastline-with-azure-water-43615-large.mp4",
                ThumbnailUrl = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
                TravelerName = "Sarah Jenkins",
                ViewsCount = 28900,
                SortOrder = 1,
                IsActive = true
            }
        };
        ToursApi.Common.UniqueImageRegistry.EnforceUniqueImages(videos);
        return videos;
    }

    public static List<Review> GetReviews(string siteId)
    {
        var isGujju = siteId.Contains("gujju") || siteId.Contains("website1");
        if (isGujju)
        {
            return new List<Review>
            {
                new Review
                {
                    WebsiteId = siteId,
                    Author = "Bhavin & Family",
                    Location = "Surat, Gujarat",
                    Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
                    Rating = 5.0,
                    Comment = "Our Dubai 6-day family holiday was completely stress-free! Pure Jain food arranged at every meal, airport pickup on time, and Burj Khalifa tickets with zero wait. Gujju Tours is 100% recommended!",
                    TourName = "Dubai 6D/5N Family Extravaganza",
                    Verified = true,
                    SortOrder = 0,
                    IsActive = true
                },
                new Review
                {
                    WebsiteId = siteId,
                    Author = "Dharmesh Shah",
                    Location = "Ahmedabad, Gujarat",
                    Avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                    Rating = 5.0,
                    Comment = "The Kutch Rann Utsav tent booking was marvelous. Premium tent amenities, live music performances in the evening, and sunrise camel ride on the white desert.",
                    TourName = "Rann Utsav Royal Experience",
                    Verified = true,
                    SortOrder = 1,
                    IsActive = true
                }
            };
        }

        return new List<Review>
        {
            new Review
            {
                WebsiteId = siteId,
                Author = "Michael Chen",
                Location = "Singapore",
                Avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
                Rating = 5.0,
                Comment = "Seamless booking experience and incredible private guide throughout our Bali and Komodo dragon tour. Everything was transparent with zero hidden costs.",
                TourName = "Bali & Komodo Island Expedition",
                Verified = true,
                SortOrder = 0,
                IsActive = true
            }
        };
    }

    public static List<FaqItem> GetFaqs(string siteId)
    {
        return new List<FaqItem>
        {
            new FaqItem
            {
                WebsiteId = siteId,
                Category = "booking",
                Question = "How do I confirm my tour or hotel booking?",
                Answer = "You can instantly reserve online through our portal or mobile app. Upon payment or enquiry approval, you will receive an instant digital booking confirmation voucher via email and WhatsApp.",
                SortOrder = 0,
                IsActive = true
            },
            new FaqItem
            {
                WebsiteId = siteId,
                Category = "cancellation",
                Question = "What is your cancellation and refund policy?",
                Answer = "Most packages and activities offer free cancellation up to 48 hours prior to scheduled departure. Refunds are processed back to your original payment method within 3 to 5 business days.",
                SortOrder = 1,
                IsActive = true
            },
            new FaqItem
            {
                WebsiteId = siteId,
                Category = "visa",
                Question = "Do you assist with tourist visas and documentation?",
                Answer = "Yes! Our in-house visa concierge team assists with document verification, express processing, and status tracking for UAE, Singapore, Thailand, Vietnam, and Schengen visas.",
                SortOrder = 2,
                IsActive = true
            },
            new FaqItem
            {
                WebsiteId = siteId,
                Category = "general",
                Question = "Are vegetarian and Jain meals available on tours?",
                Answer = "Yes, absolutely! We specialize in catering to dietary preferences. Every tour itinerary and hotel stay can be tailored to ensure 100% Pure Vegetarian and Jain dining options.",
                SortOrder = 3,
                IsActive = true
            }
        };
    }

    public static List<Partner> GetPartners(string siteId)
    {
        return new List<Partner>
        {
            new Partner
            {
                WebsiteId = siteId,
                Name = "Emirates Airlines",
                Category = "airline",
                LogoUrl = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&q=80",
                WebsiteUrl = "https://www.emirates.com",
                SortOrder = 0,
                IsActive = true
            },
            new Partner
            {
                WebsiteId = siteId,
                Name = "Singapore Airlines",
                Category = "airline",
                LogoUrl = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&q=80",
                WebsiteUrl = "https://www.singaporeair.com",
                SortOrder = 1,
                IsActive = true
            },
            new Partner
            {
                WebsiteId = siteId,
                Name = "Marriott Bonvoy",
                Category = "hotel",
                LogoUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80",
                WebsiteUrl = "https://www.marriott.com",
                SortOrder = 2,
                IsActive = true
            },
            new Partner
            {
                WebsiteId = siteId,
                Name = "IATA Certified Member",
                Category = "association",
                LogoUrl = "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300&q=80",
                SortOrder = 3,
                IsActive = true
            }
        };
    }

    public static List<StaticPage> GetStaticPages(string siteId)
    {
        var isGujju = siteId.Contains("gujju") || siteId.Contains("website1");
        var companyName = isGujju ? "Gujju Tours" : siteId.Contains("tripgo") ? "TripGo Asia" : "Technoheaven";

        return new List<StaticPage>
        {
            new StaticPage
            {
                WebsiteId = siteId,
                Slug = "about-us",
                Title = $"About {companyName}",
                ContentHtml = $"<p>{companyName} is a premier travel organization committed to delivering unforgettable journeys, world-class hospitality, and authentic local experiences across the globe.</p>",
                MetaTitle = $"About Us | {companyName}",
                MetaDescription = $"Learn more about {companyName}, our heritage, certified travel guides, and dedicated support.",
                IsActive = true
            },
            new StaticPage
            {
                WebsiteId = siteId,
                Slug = "contact-us",
                Title = "Contact Our Travel Specialists",
                ContentHtml = "<p>Our travel specialists and 24/7 concierge are available to assist with your bookings, customized itineraries, and emergencies.</p>",
                MetaTitle = $"Contact Us | {companyName}",
                MetaDescription = "Get in touch with our team via live chat, phone, or WhatsApp.",
                IsActive = true
            },
            new StaticPage
            {
                WebsiteId = siteId,
                Slug = "terms-and-conditions",
                Title = "Terms and Conditions",
                ContentHtml = "<p>By accessing our booking platform, you agree to our terms of service, payment schedules, and cancellation policies.</p>",
                MetaTitle = $"Terms & Conditions | {companyName}",
                MetaDescription = "Review our booking terms and user agreement.",
                IsActive = true
            },
            new StaticPage
            {
                WebsiteId = siteId,
                Slug = "privacy-policy",
                Title = "Privacy Policy",
                ContentHtml = "<p>Your privacy is important to us. We protect your personal data with 256-bit SSL encryption and do not share your information with unauthorized third parties.</p>",
                MetaTitle = $"Privacy Policy | {companyName}",
                MetaDescription = "How we collect, safeguard, and use your travel information.",
                IsActive = true
            }
        };
    }
}
