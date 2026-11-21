using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class Activity
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int ActivityNumericId { get; set; }

    [BsonElement("tenantId")]
    [JsonPropertyName("tenantId")]
    public string TenantId { get; set; } = "gujjutours";

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId
    {
        get => TenantId;
        set => TenantId = value;
    }

    [BsonElement("website")]
    [JsonPropertyName("website")]
    public string Website
    {
        get => TenantId;
        set => TenantId = value;
    }

    [BsonElement("slug")]
    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name
    {
        get => Title;
        set => Title = value;
    }

    [BsonElement("description")]
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("shortDescription")]
    [JsonPropertyName("shortDescription")]
    public string? ShortDescription { get; set; }

    [BsonElement("fullDescription")]
    [JsonPropertyName("fullDescription")]
    public string? FullDescription { get; set; }

    [BsonElement("images")]
    [JsonPropertyName("images")]
    public List<string> Images { get; set; } = new();

    [BsonElement("image")]
    [JsonPropertyName("image")]
    public string Image
    {
        get => Images.Count > 0 ? Images[0] : string.Empty;
        set { if (Images.Count > 0) Images[0] = value; else Images.Add(value); }
    }

    [BsonElement("gallery")]
    [JsonPropertyName("gallery")]
    public List<string> Gallery
    {
        get => Images;
        set => Images = value;
    }

    [BsonElement("price")]
    [JsonPropertyName("price")]
    public double Price { get; set; }

    [BsonElement("originalPrice")]
    [JsonPropertyName("originalPrice")]
    public double? OriginalPrice { get; set; }

    [BsonElement("currency")]
    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("rating")]
    [JsonPropertyName("rating")]
    public double Rating { get; set; } = 4.8;

    [BsonElement("reviews")]
    [JsonPropertyName("reviews")]
    public int Reviews { get; set; } = 42;

    [BsonElement("reviewCount")]
    [JsonPropertyName("reviewCount")]
    public int? ReviewCount
    {
        get => Reviews;
        set { if (value.HasValue) Reviews = value.Value; }
    }

    [BsonElement("category")]
    [JsonPropertyName("category")]
    public string Category { get; set; } = "Sightseeing";

    [BsonElement("categorySlug")]
    [JsonPropertyName("categorySlug")]
    public string? CategorySlug { get; set; }

    [BsonElement("location")]
    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    [BsonElement("destination")]
    [JsonPropertyName("destination")]
    public string Destination
    {
        get => Location;
        set => Location = value;
    }

    [BsonElement("city")]
    [JsonPropertyName("city")]
    public string? City { get; set; }

    [BsonElement("country")]
    [JsonPropertyName("country")]
    public string? Country { get; set; }

    [BsonElement("duration")]
    [JsonPropertyName("duration")]
    public string Duration { get; set; } = "4 Hours";

    [BsonElement("highlights")]
    [JsonPropertyName("highlights")]
    public List<string> Highlights { get; set; } = new();

    [BsonElement("itinerary")]
    [JsonPropertyName("itinerary")]
    public List<ItineraryDay> Itinerary { get; set; } = new();

    [BsonElement("inclusions")]
    [JsonPropertyName("inclusions")]
    public List<string> Inclusions { get; set; } = new();

    [BsonElement("included")]
    [JsonPropertyName("included")]
    public List<string> Included
    {
        get => Inclusions;
        set => Inclusions = value;
    }

    [BsonElement("exclusions")]
    [JsonPropertyName("exclusions")]
    public List<string> Exclusions { get; set; } = new();

    [BsonElement("excluded")]
    [JsonPropertyName("excluded")]
    public List<string> Excluded
    {
        get => Exclusions;
        set => Exclusions = value;
    }

    [BsonElement("isActive")]
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("featured")]
    [JsonPropertyName("featured")]
    public bool Featured { get; set; } = false;

    [BsonElement("popular")]
    [JsonPropertyName("popular")]
    public bool Popular { get; set; } = false;

    [BsonElement("dietaryFeatures")]
    [JsonPropertyName("dietaryFeatures")]
    public HotelDietaryFeatures? DietaryFeatures { get; set; }

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
}
