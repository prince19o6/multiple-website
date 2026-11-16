using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class Transfer
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int TransferNumericId { get; set; }

    [BsonElement("transferId")]
    public string? TransferId { get; set; }

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

    [BsonElement("transferType")]
    public string TransferType { get; set; } = "airport";

    [BsonElement("transferTypeLabel")]
    public string TransferTypeLabel { get; set; } = "Airport Transfer";

    [BsonElement("vehicleType")]
    public string VehicleType { get; set; } = "Sedan";

    [BsonElement("vehicleLabel")]
    public string VehicleLabel { get; set; } = "Comfort Executive Sedan";

    [BsonElement("vehicleModel")]
    public string VehicleModel { get; set; } = "Toyota Etios or equivalent";

    [BsonElement("maxPassengers")]
    public int MaxPassengers { get; set; } = 3;

    [BsonElement("maxLuggage")]
    public int MaxLuggage { get; set; } = 2;

    [BsonElement("airConditioned")]
    public bool AirConditioned { get; set; } = true;

    [BsonElement("pickupLocation")]
    public string PickupLocation { get; set; } = string.Empty;

    [BsonElement("dropoffLocation")]
    public string DropoffLocation { get; set; } = string.Empty;

    [BsonElement("city")]
    public string City { get; set; } = string.Empty;

    [BsonElement("country")]
    public string Country { get; set; } = string.Empty;

    [BsonElement("durationMinutes")]
    public int DurationMinutes { get; set; } = 45;

    [BsonElement("estimatedDuration")]
    public string EstimatedDuration { get; set; } = "45 Mins";

    [BsonElement("price")]
    public double Price { get; set; }

    [BsonElement("originalPrice")]
    public double? OriginalPrice { get; set; }

    [BsonElement("netPrice")]
    public double? NetPrice { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("image")]
    public string Image { get; set; } = "/seed-images/transfers/transfer-sedan.svg";

    [BsonElement("coverImage")]
    [JsonPropertyName("coverImage")]
    public string CoverImage { get => Image; set => Image = value; }

    [BsonElement("freeCancellation")]
    public bool FreeCancellation { get; set; } = true;

    [BsonElement("meetAndGreet")]
    public bool MeetAndGreet { get; set; } = true;

    [BsonElement("flightMonitoring")]
    public bool FlightMonitoring { get; set; } = true;

    [BsonElement("tollIncluded")]
    public bool TollIncluded { get; set; } = true;

    [BsonElement("rating")]
    public double Rating { get; set; } = 4.8;

    [BsonElement("reviews")]
    public int Reviews { get; set; } = 120;

    [BsonElement("featured")]
    public bool Featured { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "Active";

    [BsonElement("createdAt")]
    public DateTime? CreatedAt { get; set; }
}

