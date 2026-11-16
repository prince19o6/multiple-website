using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

/// <summary>
/// Customer in-app notification stored in the active website database for notification center screens.
/// </summary>
[BsonIgnoreExtraElements]
public class CustomerNotification
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("userId")]
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [BsonElement("userEmail")]
    [JsonPropertyName("userEmail")]
    public string UserEmail { get; set; } = string.Empty;

    [BsonElement("bookingId")]
    [JsonPropertyName("bookingId")]
    public string? BookingId { get; set; }

    [BsonElement("bookingReference")]
    [JsonPropertyName("bookingReference")]
    public string? BookingReference { get; set; }

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("message")]
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "booking_status"; // "booking_status", "cancellation", "reminder"

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [BsonElement("isRead")]
    [JsonPropertyName("isRead")]
    public bool IsRead { get; set; } = false;

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
