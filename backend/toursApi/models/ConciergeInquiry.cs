using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

/// <summary>
/// Lead / inquiry registered via in-app concierge or web chat.
/// Stored in the active tenant database under 'concierge_inquiries'.
/// </summary>
[BsonIgnoreExtraElements]
public class ConciergeInquiry
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("tourId")]
    [JsonPropertyName("tourId")]
    public int? TourId { get; set; }

    [BsonElement("tourName")]
    [JsonPropertyName("tourName")]
    public string? TourName { get; set; }

    [BsonElement("guestName")]
    [JsonPropertyName("guestName")]
    public string GuestName { get; set; } = string.Empty;

    [BsonElement("email")]
    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [BsonElement("phone")]
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [BsonElement("category")]
    [JsonPropertyName("category")]
    public string Category { get; set; } = "general"; // general, dietary, booking, custom_itinerary, visa

    [BsonElement("message")]
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("specialistName")]
    [JsonPropertyName("specialistName")]
    public string SpecialistName { get; set; } = string.Empty;

    [BsonElement("specialistReply")]
    [JsonPropertyName("specialistReply")]
    public string SpecialistReply { get; set; } = string.Empty;

    [BsonElement("source")]
    [JsonPropertyName("source")]
    public string Source { get; set; } = "app";

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = "answered"; // answered, followup_required, closed

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
