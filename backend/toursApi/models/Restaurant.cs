using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class Restaurant
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int RestaurantNumericId { get; set; }

    [BsonElement("restaurantId")]
    public string? RestaurantId { get; set; }

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

    [BsonElement("cuisine")]
    public string Cuisine { get; set; } = "indian";

    [BsonElement("cuisineLabel")]
    public string CuisineLabel { get; set; } = "Indian Cuisine";

    [BsonElement("city")]
    public string City { get; set; } = string.Empty;

    [BsonElement("country")]
    public string Country { get; set; } = string.Empty;

    [BsonElement("address")]
    public string Address { get; set; } = string.Empty;

    [BsonElement("priceRange")]
    public string PriceRange { get; set; } = "$$";

    [BsonElement("costForTwo")]
    public double CostForTwo { get; set; }

    [BsonElement("netCost")]
    public double? NetCost { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("rating")]
    public double Rating { get; set; } = 4.5;

    [BsonElement("reviews")]
    public int Reviews { get; set; } = 120;

    [BsonElement("isNew")]
    public bool IsNew { get; set; }

    [BsonElement("featured")]
    public bool Featured { get; set; }

    [BsonElement("popular")]
    public bool Popular { get; set; }

    [BsonElement("isPureVeg")]
    public bool IsPureVeg { get; set; }

    [BsonElement("isJainAvailable")]
    public bool IsJainAvailable { get; set; }

    [BsonElement("isHalalCertified")]
    public bool IsHalalCertified { get; set; }

    [BsonElement("isVeganFriendly")]
    public bool IsVeganFriendly { get; set; }

    [BsonElement("dietaryTags")]
    public List<string> DietaryTags { get; set; } = new();

    [BsonElement("timings")]
    public string Timings { get; set; } = "11:30 AM - 11:30 PM";

    [BsonElement("image")]
    public string Image { get; set; } = "/seed-images/restaurants/dining-indian.svg";

    [BsonElement("coverImage")]
    [JsonPropertyName("coverImage")]
    public string CoverImage { get => Image; set => Image = value; }

    [BsonElement("imageUrl")]
    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get => Image; set => Image = value; }

    [BsonElement("gallery")]
    [JsonPropertyName("gallery")]
    public List<string> Gallery { get => Images; set => Images = value; }

    [BsonElement("images")]
    public List<string> Images { get; set; } = new();

    [BsonElement("specialties")]
    public List<string> Specialties { get; set; } = new();

    [BsonElement("overview")]
    public string Overview { get; set; } = string.Empty;

    [BsonElement("isDemo")]
    public bool IsDemo { get; set; } = true;

    [BsonElement("status")]
    public string Status { get; set; } = "Active";

    [BsonElement("createdAt")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
}

