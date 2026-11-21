using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class HotelDestination
{
    [BsonElement("cityId")]
    [JsonPropertyName("cityId")]
    public string CityId { get; set; } = string.Empty;

    [BsonElement("cityName")]
    [JsonPropertyName("cityName")]
    public string CityName { get; set; } = string.Empty;

    [BsonElement("country")]
    [JsonPropertyName("country")]
    public string Country { get; set; } = string.Empty;

    [BsonElement("address")]
    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [BsonElement("latitude")]
    [JsonPropertyName("latitude")]
    public double? Latitude { get; set; }

    [BsonElement("longitude")]
    [JsonPropertyName("longitude")]
    public double? Longitude { get; set; }
}

[BsonIgnoreExtraElements]
public class HotelDietaryFeatures
{
    [BsonElement("pureVeg")]
    [JsonPropertyName("pureVeg")]
    public bool PureVeg { get; set; } = false;

    [BsonElement("jainAvailable")]
    [JsonPropertyName("jainAvailable")]
    public bool JainAvailable { get; set; } = false;

    [BsonElement("halalCertified")]
    [JsonPropertyName("halalCertified")]
    public bool HalalCertified { get; set; } = false;
}

[BsonIgnoreExtraElements]
public class HotelRoomOption
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("bedConfiguration")]
    [JsonPropertyName("bedConfiguration")]
    public string BedConfiguration { get; set; } = "1 King Bed";

    [BsonElement("maxAdults")]
    [JsonPropertyName("maxAdults")]
    public int MaxAdults { get; set; } = 2;

    [BsonElement("maxChildren")]
    [JsonPropertyName("maxChildren")]
    public int MaxChildren { get; set; } = 1;

    [BsonElement("areaSqm")]
    [JsonPropertyName("areaSqm")]
    public int AreaSqm { get; set; } = 32;

    [BsonElement("pricePerNight")]
    [JsonPropertyName("pricePerNight")]
    public double PricePerNight { get; set; }

    [BsonElement("netPricePerNight")]
    [JsonPropertyName("netPricePerNight")]
    public double? NetPricePerNight { get; set; } // For B2B / Technoheaven

    [BsonElement("freeBreakfast")]
    [JsonPropertyName("freeBreakfast")]
    public bool FreeBreakfast { get; set; } = true;

    [BsonElement("cancellationPolicy")]
    [JsonPropertyName("cancellationPolicy")]
    public string CancellationPolicy { get; set; } = "Free cancellation up to 48 hours before check-in";

    [BsonElement("inventory")]
    [JsonPropertyName("inventory")]
    public int Inventory { get; set; } = 10;

    [BsonElement("features")]
    [JsonPropertyName("features")]
    public List<string> Features { get; set; } = new();

    [BsonElement("images")]
    [JsonPropertyName("images")]
    public List<string> Images { get; set; } = new();

    [BsonElement("coverImage")]
    [JsonPropertyName("coverImage")]
    public string CoverImage
    {
        get => Images.Count > 0 ? Images[0] : string.Empty;
        set { if (Images.Count > 0) Images[0] = value; else Images.Add(value); }
    }

    [BsonElement("imageUrl")]
    [JsonPropertyName("imageUrl")]
    public string ImageUrl
    {
        get => CoverImage;
        set => CoverImage = value;
    }
}

[BsonIgnoreExtraElements]
public class HotelPolicies
{
    [BsonElement("checkInTime")]
    [JsonPropertyName("checkInTime")]
    public string CheckInTime { get; set; } = "14:00";

    [BsonElement("checkOutTime")]
    [JsonPropertyName("checkOutTime")]
    public string CheckOutTime { get; set; } = "11:00";

    [BsonElement("cancellation")]
    [JsonPropertyName("cancellation")]
    public string Cancellation { get; set; } = "Free cancellation up to 48 hours prior to check-in.";
}

/// <summary>
/// Full hotel entity stored in MongoDB under `hotels` collection per website database.
/// </summary>
[BsonIgnoreExtraElements]
public class Hotel
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("slug")]
    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [BsonElement("propertyType")]
    [JsonPropertyName("propertyType")]
    public string PropertyType { get; set; } = "Hotel"; // "Hotel", "Aparthotel", "Apartment", "Hostel", "Villa", "Resort", "Boutique"

    [BsonElement("collections")]
    [JsonPropertyName("collections")]
    public List<string> Collections { get; set; } = new(); // "hill-stations", "beach-stays", "pilgrimage", "luxury-stays", "budget-stays", "family-stays"

    [BsonElement("destination")]
    [JsonPropertyName("destination")]
    public HotelDestination Destination { get; set; } = new();

    [BsonElement("starRating")]
    [JsonPropertyName("starRating")]
    public int StarRating { get; set; } = 4;

    [BsonElement("rating")]
    [JsonPropertyName("rating")]
    public double Rating { get; set; } = 4.5;

    [BsonElement("reviewCount")]
    [JsonPropertyName("reviewCount")]
    public int ReviewCount { get; set; } = 250;

    [BsonElement("pricePerNight")]
    [JsonPropertyName("pricePerNight")]
    public double PricePerNight { get; set; }

    [BsonElement("compareAtPrice")]
    [JsonPropertyName("compareAtPrice")]
    public double? CompareAtPrice { get; set; }

    [BsonElement("netPricePerNight")]
    [JsonPropertyName("netPricePerNight")]
    public double? NetPricePerNight { get; set; } // B2B Net Cost for Technoheaven

    [BsonElement("currency")]
    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("images")]
    [JsonPropertyName("images")]
    public List<string> Images { get; set; } = new();

    [BsonElement("coverImage")]
    [JsonPropertyName("coverImage")]
    public string CoverImage
    {
        get => Images.Count > 0 ? Images[0] : string.Empty;
        set { if (Images.Count > 0) Images[0] = value; else Images.Add(value); }
    }

    [BsonElement("imageUrl")]
    [JsonPropertyName("imageUrl")]
    public string ImageUrl
    {
        get => CoverImage;
        set => CoverImage = value;
    }

    [BsonElement("amenities")]
    [JsonPropertyName("amenities")]
    public List<string> Amenities { get; set; } = new();

    [BsonElement("dietaryFeatures")]
    [JsonPropertyName("dietaryFeatures")]
    public HotelDietaryFeatures DietaryFeatures { get; set; } = new();

    [BsonElement("rooms")]
    [JsonPropertyName("rooms")]
    public List<HotelRoomOption> Rooms { get; set; } = new();

    [BsonElement("policies")]
    [JsonPropertyName("policies")]
    public HotelPolicies Policies { get; set; } = new();

    [BsonElement("featured")]
    [JsonPropertyName("featured")]
    public bool Featured { get; set; } = false;

    [BsonElement("popular")]
    [JsonPropertyName("popular")]
    public bool Popular { get; set; } = false;

    [BsonElement("isNew")]
    [JsonPropertyName("isNew")]
    public bool IsNew { get; set; } = false;

    [BsonElement("isDemo")]
    [JsonPropertyName("isDemo")]
    public bool IsDemo { get; set; } = true;

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

