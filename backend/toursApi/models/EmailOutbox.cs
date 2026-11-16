using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

public static class EmailOutboxStatus
{
    public const string Queued = "Queued";
    public const string Processing = "Processing";
    public const string Sent = "Sent";
    public const string Failed = "Failed";
}

public static class EmailTemplateNames
{
    // Customer templates
    public const string CustomerBookingReceived = "customer_booking_received";
    public const string CustomerBookingConfirmed = "customer_booking_confirmed";
    public const string CustomerBookingRejected = "customer_booking_rejected";
    public const string CustomerBookingCancelled = "customer_booking_cancelled";
    public const string CustomerBookingExpired = "customer_booking_expired";
    public const string CustomerCancellationRequestReceived = "customer_cancellation_request_received";
    public const string CustomerTripReminder = "customer_trip_reminder";

    // Admin templates
    public const string AdminNewBookingAlert = "admin_new_booking_alert";
    public const string AdminCancellationRequestAlert = "admin_cancellation_request_alert";
    public const string AdminDailyDigest = "admin_daily_digest";
}

/// <summary>
/// Persistent email outbox entity stored per website database to guarantee reliable,
/// non-blocking, asynchronous transactional delivery with automatic exponential backoff.
/// </summary>
[BsonIgnoreExtraElements]
public class EmailOutbox
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("recipientEmail")]
    [JsonPropertyName("recipientEmail")]
    public string RecipientEmail { get; set; } = string.Empty;

    [BsonElement("recipientName")]
    [JsonPropertyName("recipientName")]
    public string RecipientName { get; set; } = string.Empty;

    [BsonElement("subject")]
    [JsonPropertyName("subject")]
    public string Subject { get; set; } = string.Empty;

    [BsonElement("template")]
    [JsonPropertyName("template")]
    public string Template { get; set; } = string.Empty;

    [BsonElement("payloadJson")]
    [JsonPropertyName("payloadJson")]
    public string PayloadJson { get; set; } = "{}";

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = EmailOutboxStatus.Queued;

    [BsonElement("attempts")]
    [JsonPropertyName("attempts")]
    public int Attempts { get; set; } = 0;

    [BsonElement("maxAttempts")]
    [JsonPropertyName("maxAttempts")]
    public int MaxAttempts { get; set; } = 5;

    [BsonElement("nextAttemptAt")]
    [JsonPropertyName("nextAttemptAt")]
    public DateTime NextAttemptAt { get; set; } = DateTime.UtcNow;

    [BsonElement("lastError")]
    [JsonPropertyName("lastError")]
    public string? LastError { get; set; }

    [BsonElement("sentAt")]
    [JsonPropertyName("sentAt")]
    public DateTime? SentAt { get; set; }

    [BsonElement("bookingId")]
    [JsonPropertyName("bookingId")]
    public string? BookingId { get; set; }

    [BsonElement("bookingReference")]
    [JsonPropertyName("bookingReference")]
    public string? BookingReference { get; set; }

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
