using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class Package
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int PackageNumericId { get; set; }

    [BsonElement("packageId")]
    public string? PackageId { get; set; }

    [BsonElement("websiteId")]
    public string WebsiteId { get; set; } = "gujjutours";

    [BsonElement("website")]
    public string? Website { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; set; } = "Scenic Escapes";

    [BsonElement("categorySlug")]
    public string CategorySlug { get; set; } = "scenic-escapes";

    [BsonElement("destination")]
    public string Destination { get; set; } = string.Empty;

    [BsonElement("country")]
    public string Country { get; set; } = string.Empty;

    [BsonElement("city")]
    public string City { get; set; } = string.Empty;

    [BsonElement("citiesCovered")]
    public string CitiesCovered { get; set; } = string.Empty;

    [BsonElement("duration")]
    public string Duration { get; set; } = "5 Days / 4 Nights";

    [BsonElement("durationDays")]
    public int DurationDays { get; set; } = 5;

    [BsonElement("durationNights")]
    public int DurationNights { get; set; } = 4;

    [BsonElement("startingPrice")]
    public double StartingPrice { get; set; }

    [BsonElement("price")]
    public double Price { get; set; }

    [BsonElement("originalPrice")]
    public double? OriginalPrice { get; set; }

    [BsonElement("netPrice")]
    public double? NetPrice { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("rating")]
    public double Rating { get; set; } = 4.8;

    [BsonElement("reviews")]
    public int Reviews { get; set; } = 0;

    [BsonElement("reviewCount")]
    public int ReviewCount { get; set; } = 0;

    [BsonElement("image")]
    public string Image { get; set; } = string.Empty;

    [BsonElement("coverImage")]
    [JsonPropertyName("coverImage")]
    public string CoverImage { get => Image; set => Image = value; }

    [BsonElement("images")]
    public List<string> Images { get; set; } = new();

    [BsonElement("dietaryFeatures")]
    public PackageDietaryFeatures? DietaryFeatures { get; set; }

    [BsonElement("keyInclusions")]
    public List<string> KeyInclusions { get; set; } = new();

    [BsonElement("hotelStays")]
    public List<PackageHotelStay> HotelStays { get; set; } = new();

    [BsonElement("itinerary")]
    public List<PackageItineraryDay> Itinerary { get; set; } = new();

    [BsonElement("inclusions")]
    public List<string> Inclusions { get; set; } = new();

    [BsonElement("exclusions")]
    public List<string> Exclusions { get; set; } = new();

    [BsonElement("departureDates")]
    public List<string> DepartureDates { get; set; } = new();

    [BsonElement("featured")]
    public bool Featured { get; set; } = false;

    [BsonElement("popular")]
    public bool Popular { get; set; } = false;

    [BsonElement("isNew")]
    public bool IsNew { get; set; } = false;

    [BsonElement("isDemo")]
    public bool IsDemo { get; set; } = true;

    [BsonElement("status")]
    public string Status { get; set; } = "Active";

    [BsonElement("createdAt")]
    public DateTime? CreatedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class PackageDietaryFeatures
{
    [BsonElement("pureVeg")]
    public bool PureVeg { get; set; }

    [BsonElement("jainAvailable")]
    public bool JainAvailable { get; set; }

    [BsonElement("halalCertified")]
    public bool HalalCertified { get; set; }
}

[BsonIgnoreExtraElements]
public class PackageHotelStay
{
    [BsonElement("hotelName")]
    public string HotelName { get; set; } = string.Empty;

    [BsonElement("starRating")]
    public int StarRating { get; set; } = 4;

    [BsonElement("nights")]
    public int Nights { get; set; } = 1;

    [BsonElement("city")]
    public string City { get; set; } = string.Empty;

    [BsonElement("roomType")]
    public string RoomType { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class PackageItineraryDay
{
    [BsonElement("day")]
    public int Day { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("meals")]
    public List<string> Meals { get; set; } = new();

    [BsonElement("highlights")]
    public List<string> Highlights { get; set; } = new();
}

