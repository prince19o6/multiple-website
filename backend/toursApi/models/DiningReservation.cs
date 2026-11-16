using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    /// <summary>
    /// Dining table reservation or special tasting banquet request.
    /// Stored in the active tenant database under 'dining_reservations'.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class DiningReservation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [JsonPropertyName("_id")]
        public string? Id { get; set; }

        [BsonElement("websiteId")]
        [JsonPropertyName("websiteId")]
        public string WebsiteId { get; set; } = string.Empty;

        [BsonElement("reservationReference")]
        [JsonPropertyName("reservationReference")]
        public string ReservationReference { get; set; } = string.Empty;

        [BsonElement("diningSpotId")]
        [JsonPropertyName("diningSpotId")]
        public string DiningSpotId { get; set; } = string.Empty;

        [BsonElement("diningSpotName")]
        [JsonPropertyName("diningSpotName")]
        public string DiningSpotName { get; set; } = string.Empty;

        [BsonElement("destinationId")]
        [JsonPropertyName("destinationId")]
        public string DestinationId { get; set; } = string.Empty;

        [BsonElement("guestName")]
        [JsonPropertyName("guestName")]
        public string GuestName { get; set; } = string.Empty;

        [BsonElement("phoneNumber")]
        [JsonPropertyName("phoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

        [BsonElement("email")]
        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [BsonElement("partySize")]
        [JsonPropertyName("partySize")]
        public int PartySize { get; set; } = 2;

        [BsonElement("reservationDate")]
        [JsonPropertyName("reservationDate")]
        public string ReservationDate { get; set; } = string.Empty;

        [BsonElement("timeSlot")]
        [JsonPropertyName("timeSlot")]
        public string TimeSlot { get; set; } = string.Empty;

        [BsonElement("dietaryRequests")]
        [JsonPropertyName("dietaryRequests")]
        public List<string> DietaryRequests { get; set; } = new();

        [BsonElement("specialNotes")]
        [JsonPropertyName("specialNotes")]
        public string? SpecialNotes { get; set; }

        [BsonElement("status")]
        [JsonPropertyName("status")]
        public string Status { get; set; } = "Confirmed"; // Confirmed, PendingReview, Cancelled

        [BsonElement("createdAt")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
