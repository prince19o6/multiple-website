using System;
using System.Collections.Generic;
using System.Linq;
using ToursApi.Models;

namespace ToursApi.Configuration;

public static class SeedDataCatalog
{
    public static List<Destination> Website1Destinations() => new()
    {
        new Destination { Website = "website1", Name = "Paris, France", Image = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=500&fit=crop", Tours = 1, SortOrder = 0 },
        new Destination { Website = "website1", Name = "Tokyo, Japan", Image = "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&h=500&fit=crop", Tours = 1, SortOrder = 1 },
        new Destination { Website = "website1", Name = "New York, USA", Image = "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=500&fit=crop", Tours = 1, SortOrder = 2 },
    };

    public static List<Destination> Website2Destinations() => new()
    {
        new Destination { Website = "website2", Name = "Patagonia, Chile", Image = "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=600&h=500&fit=crop", Tours = 1, SortOrder = 0 },
        new Destination { Website = "website2", Name = "Amazon Rainforest, Brazil", Image = "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=500&fit=crop", Tours = 1, SortOrder = 1 },
        new Destination { Website = "website2", Name = "Everest Region, Nepal", Image = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&h=500&fit=crop", Tours = 1, SortOrder = 2 },
    };

    public static List<Destination> Website3Destinations() => new()
    {
        new Destination { Website = "website3", Name = "Maldives", Image = "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=500&fit=crop", Tours = 1, SortOrder = 0 },
        new Destination { Website = "website3", Name = "Bali, Indonesia", Image = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=500&fit=crop", Tours = 1, SortOrder = 1 },
        new Destination { Website = "website3", Name = "Santorini, Greece", Image = "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=500&fit=crop", Tours = 1, SortOrder = 2 },
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
        if (raw.Contains("website3") || raw.Contains("technoheaven") || raw.Contains("holidayparadise"))
            return Website3Tours();
        if (raw.Contains("website2") || raw.Contains("tripgoasia") || raw.Contains("adventureworld"))
            return Website2Tours();
        return Website1Tours();
    }

    public static List<Destination> GetDestinations(string? websiteId)
    {
        var raw = (websiteId ?? "").Trim().ToLowerInvariant();
        if (raw.Contains("website3") || raw.Contains("technoheaven") || raw.Contains("holidayparadise"))
            return Website3Destinations();
        if (raw.Contains("website2") || raw.Contains("tripgoasia") || raw.Contains("adventureworld"))
            return Website2Destinations();
        return Website1Destinations();
    }
}
