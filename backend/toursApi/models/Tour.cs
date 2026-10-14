using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

/// <summary>
/// Multi-tenant Tour package entity.
/// Supports rich catalog fields, category grouping, departure schedules,
/// pricing tiers, itineraries, and SEO slugs.
/// </summary>
[BsonIgnoreExtraElements]
public class Tour
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int TourNumericId { get; set; }

    [BsonElement("website")]
    public string Website { get; set; } = "website1";

    [BsonElement("websiteId")]
    public string? WebsiteId { get; set; }

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("title")]
    public string? Title { get; set; }

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; set; } = "Adventure";

    [BsonElement("destination")]
    public string Destination { get; set; } = string.Empty;

    [BsonElement("location")]
    public string Location { get; set; } = string.Empty;

    [BsonElement("country")]
    public string Country { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("shortDescription")]
    public string? ShortDescription { get; set; }

    [BsonElement("fullDescription")]
    public string? FullDescription { get; set; }

    [BsonElement("price")]
    public double Price { get; set; }

    [BsonElement("originalPrice")]
    public double? OriginalPrice { get; set; }

    [BsonElement("discountedPrice")]
    public double? DiscountedPrice { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "USD";

    [BsonElement("duration")]
    public string Duration { get; set; } = string.Empty;

    [BsonElement("durationDays")]
    public int DurationDays { get; set; } = 3;

    [BsonElement("durationNights")]
    public int DurationNights { get; set; } = 2;

    [BsonElement("difficulty")]
    public string Difficulty { get; set; } = "Moderate";

    [BsonElement("rating")]
    public double Rating { get; set; } = 4.8;

    [BsonElement("reviews")]
    public int Reviews { get; set; } = 0;

    [BsonElement("reviewCount")]
    public int? ReviewCount { get; set; }

    [BsonElement("image")]
    public string Image { get; set; } = string.Empty;

    [BsonElement("gallery")]
    public List<string> Gallery { get; set; } = new();

    [BsonElement("groupSize")]
    public string GroupSize { get; set; } = "8-12 people";

    [BsonElement("bestTime")]
    public string BestTime { get; set; } = "Year-round";

    [BsonElement("language")]
    public string Language { get; set; } = "English";

    [BsonElement("highlights")]
    public List<string> Highlights { get; set; } = new();

    [BsonElement("included")]
    public List<string> Included { get; set; } = new();

    [BsonElement("excluded")]
    public List<string> Excluded { get; set; } = new();

    [BsonElement("availableDates")]
    public List<string> AvailableDates { get; set; } = new();

    [BsonElement("featured")]
    public bool Featured { get; set; } = false;

    [BsonElement("popular")]
    public bool Popular { get; set; } = false;

    [BsonElement("status")]
    public string Status { get; set; } = "Active";

    [BsonElement("itinerary")]
    public List<ItineraryDay> Itinerary { get; set; } = new();

    [BsonElement("guestReviews")]
    public List<GuestReview> GuestReviews { get; set; } = new();

    [BsonElement("createdAt")]
    public DateTime? CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class ItineraryDay
{
    [BsonElement("day")]
    public int Day { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class GuestReview
{
    [BsonElement("author")]
    public string Author { get; set; } = string.Empty;

    [BsonElement("rating")]
    public int Rating { get; set; } = 5;

    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("date")]
    public string? Date { get; set; }

    [BsonElement("avatar")]
    public string? Avatar { get; set; }
}