using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class BuildPackageDuration
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("nights")]
    [JsonPropertyName("nights")]
    public int Nights { get; set; }

    [BsonElement("days")]
    [JsonPropertyName("days")]
    public int Days { get; set; }

    [BsonElement("label")]
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [BsonElement("priceMultiplier")]
    [JsonPropertyName("priceMultiplier")]
    public double PriceMultiplier { get; set; } = 1.0;
}

[BsonIgnoreExtraElements]
public class BuildPackageFlight
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "Economy";

    [BsonElement("airline")]
    [JsonPropertyName("airline")]
    public string Airline { get; set; } = string.Empty;

    [BsonElement("baggage")]
    [JsonPropertyName("baggage")]
    public string Baggage { get; set; } = string.Empty;

    [BsonElement("meals")]
    [JsonPropertyName("meals")]
    public string Meals { get; set; } = string.Empty;

    [BsonElement("pricePerPerson")]
    [JsonPropertyName("pricePerPerson")]
    public double PricePerPerson { get; set; }

    [BsonElement("netPricePerPerson")]
    [JsonPropertyName("netPricePerPerson")]
    public double? NetPricePerPerson { get; set; }

    [BsonElement("image")]
    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class BuildPackageHotel
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("tierName")]
    [JsonPropertyName("tierName")]
    public string TierName { get; set; } = string.Empty;

    [BsonElement("starRating")]
    [JsonPropertyName("starRating")]
    public int StarRating { get; set; } = 4;

    [BsonElement("hotelName")]
    [JsonPropertyName("hotelName")]
    public string HotelName { get; set; } = string.Empty;

    [BsonElement("highlights")]
    [JsonPropertyName("highlights")]
    public string Highlights { get; set; } = string.Empty;

    [BsonElement("inclusions")]
    [JsonPropertyName("inclusions")]
    public List<string> Inclusions { get; set; } = new();

    [BsonElement("pricePerPerson")]
    [JsonPropertyName("pricePerPerson")]
    public double PricePerPerson { get; set; }

    [BsonElement("netPricePerPerson")]
    [JsonPropertyName("netPricePerPerson")]
    public double? NetPricePerPerson { get; set; }

    [BsonElement("image")]
    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class BuildPackageActivity
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("duration")]
    [JsonPropertyName("duration")]
    public string Duration { get; set; } = string.Empty;

    [BsonElement("description")]
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("pricePerPerson")]
    [JsonPropertyName("pricePerPerson")]
    public double PricePerPerson { get; set; }

    [BsonElement("netPricePerPerson")]
    [JsonPropertyName("netPricePerPerson")]
    public double? NetPricePerPerson { get; set; }

    [BsonElement("image")]
    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [BsonElement("isRecommended")]
    [JsonPropertyName("isRecommended")]
    public bool IsRecommended { get; set; }
}

[BsonIgnoreExtraElements]
public class BuildPackageTransfer
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("vehicleClass")]
    [JsonPropertyName("vehicleClass")]
    public string VehicleClass { get; set; } = string.Empty;

    [BsonElement("capacity")]
    [JsonPropertyName("capacity")]
    public string Capacity { get; set; } = string.Empty;

    [BsonElement("luggage")]
    [JsonPropertyName("luggage")]
    public string Luggage { get; set; } = string.Empty;

    [BsonElement("priceTotal")]
    [JsonPropertyName("priceTotal")]
    public double PriceTotal { get; set; }

    [BsonElement("netPriceTotal")]
    [JsonPropertyName("netPriceTotal")]
    public double? NetPriceTotal { get; set; }

    [BsonElement("image")]
    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class BuildPackageVisa
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("processingTime")]
    [JsonPropertyName("processingTime")]
    public string ProcessingTime { get; set; } = string.Empty;

    [BsonElement("validity")]
    [JsonPropertyName("validity")]
    public string Validity { get; set; } = string.Empty;

    [BsonElement("pricePerPerson")]
    [JsonPropertyName("pricePerPerson")]
    public double PricePerPerson { get; set; }

    [BsonElement("netPricePerPerson")]
    [JsonPropertyName("netPricePerPerson")]
    public double? NetPricePerPerson { get; set; }

    [BsonElement("image")]
    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [BsonElement("isRequired")]
    [JsonPropertyName("isRequired")]
    public bool IsRequired { get; set; }
}

[BsonIgnoreExtraElements]
public class BuildPackageMealPlan
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("pricePerPerson")]
    [JsonPropertyName("pricePerPerson")]
    public double PricePerPerson { get; set; }

    [BsonElement("netPricePerPerson")]
    [JsonPropertyName("netPricePerPerson")]
    public double? NetPricePerPerson { get; set; }
}

[BsonIgnoreExtraElements]
public class BuildPackageOption
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int DestinationNumericId { get; set; }

    [BsonElement("destinationId")]
    [JsonPropertyName("destinationId")]
    public string? DestinationId { get; set; }

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = "gujjutours";

    [BsonElement("website")]
    [JsonPropertyName("website")]
    public string? Website { get; set; }

    [BsonElement("destinationSlug")]
    [JsonPropertyName("destinationSlug")]
    public string DestinationSlug { get; set; } = string.Empty;

    [BsonElement("destinationName")]
    [JsonPropertyName("destinationName")]
    public string DestinationName { get; set; } = string.Empty;

    [BsonElement("country")]
    [JsonPropertyName("country")]
    public string Country { get; set; } = string.Empty;

    [BsonElement("flag")]
    [JsonPropertyName("flag")]
    public string Flag { get; set; } = string.Empty;

    [BsonElement("tagline")]
    [JsonPropertyName("tagline")]
    public string Tagline { get; set; } = string.Empty;

    [BsonElement("badge")]
    [JsonPropertyName("badge")]
    public string Badge { get; set; } = string.Empty;

    [BsonElement("overview")]
    [JsonPropertyName("overview")]
    public string Overview { get; set; } = string.Empty;

    [BsonElement("heroImage")]
    [JsonPropertyName("heroImage")]
    public string HeroImage { get; set; } = string.Empty;

    [BsonElement("image")]
    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [BsonElement("images")]
    [JsonPropertyName("images")]
    public List<string> Images { get; set; } = new();

    [BsonElement("popular")]
    [JsonPropertyName("popular")]
    public bool Popular { get; set; }

    [BsonElement("featured")]
    [JsonPropertyName("featured")]
    public bool Featured { get; set; }

    [BsonElement("rating")]
    [JsonPropertyName("rating")]
    public double Rating { get; set; } = 4.8;

    [BsonElement("reviews")]
    [JsonPropertyName("reviews")]
    public int Reviews { get; set; } = 150;

    [BsonElement("startingPrice")]
    [JsonPropertyName("startingPrice")]
    public double StartingPrice { get; set; }

    [BsonElement("netStartingPrice")]
    [JsonPropertyName("netStartingPrice")]
    public double? NetStartingPrice { get; set; }

    [BsonElement("currency")]
    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("currencySymbol")]
    [JsonPropertyName("currencySymbol")]
    public string CurrencySymbol { get; set; } = "₹";

    [BsonElement("durations")]
    [JsonPropertyName("durations")]
    public List<BuildPackageDuration> Durations { get; set; } = new();

    [BsonElement("flightOptions")]
    [JsonPropertyName("flightOptions")]
    public List<BuildPackageFlight> FlightOptions { get; set; } = new();

    [BsonElement("hotelTiers")]
    [JsonPropertyName("hotelTiers")]
    public List<BuildPackageHotel> HotelTiers { get; set; } = new();

    [BsonElement("activityOptions")]
    [JsonPropertyName("activityOptions")]
    public List<BuildPackageActivity> ActivityOptions { get; set; } = new();

    [BsonElement("transferOptions")]
    [JsonPropertyName("transferOptions")]
    public List<BuildPackageTransfer> TransferOptions { get; set; } = new();

    [BsonElement("visaOptions")]
    [JsonPropertyName("visaOptions")]
    public List<BuildPackageVisa> VisaOptions { get; set; } = new();

    [BsonElement("mealPlans")]
    [JsonPropertyName("mealPlans")]
    public List<BuildPackageMealPlan> MealPlans { get; set; } = new();

    [BsonElement("customInclusions")]
    [JsonPropertyName("customInclusions")]
    public List<string> CustomInclusions { get; set; } = new();

    [BsonElement("customExclusions")]
    [JsonPropertyName("customExclusions")]
    public List<string> CustomExclusions { get; set; } = new();

    [BsonElement("isDemo")]
    [JsonPropertyName("isDemo")]
    public bool IsDemo { get; set; } = true;

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = "Active";

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

