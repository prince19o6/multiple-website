using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class Booking
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("reference")]
    [JsonPropertyName("reference")]
    public string Reference { get; set; } = string.Empty;

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("userId")]
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [BsonElement("tourId")]
    public int TourId { get; set; }

    [BsonElement("tourName")]
    public string TourName { get; set; } = string.Empty;

    [BsonElement("tourImage")]
    [JsonPropertyName("tourImage")]
    public string? TourImage { get; set; }

    [BsonElement("currency")]
    [JsonPropertyName("currency")]
    public string? Currency { get; set; }

    [BsonElement("location")]
    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [BsonElement("guestName")]
    public string GuestName { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("travelers")]
    public int Travelers { get; set; }

    [BsonElement("startDate")]
    public DateTime StartDate { get; set; }

    [BsonElement("endDate")]
    public DateTime EndDate { get; set; }

    [BsonElement("totalPrice")]
    public double TotalPrice { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "pending";

    [BsonElement("paymentMethod")]
    [JsonPropertyName("paymentMethod")]
    public string? PaymentMethod { get; set; }

    [BsonElement("paymentStatus")]
    [JsonPropertyName("paymentStatus")]
    public string PaymentStatus { get; set; } = "unpaid";

    [BsonElement("paymentReference")]
    [JsonPropertyName("paymentReference")]
    public string? PaymentReference { get; set; }

    [BsonElement("paidAt")]
    [JsonPropertyName("paidAt")]
    public DateTime? PaidAt { get; set; }

    [BsonElement("createdAt")]
    public DateTime? CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}