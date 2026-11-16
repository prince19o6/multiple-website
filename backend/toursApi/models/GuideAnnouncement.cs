using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    [BsonIgnoreExtraElements]
    public class GuideAnnouncement
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
        public string? TourId { get; set; }

        [BsonElement("title")]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("message")]
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [BsonElement("priority")]
        [JsonPropertyName("priority")]
        public string Priority { get; set; } = "Normal";

        [BsonElement("sentBy")]
        [JsonPropertyName("sentBy")]
        public string SentBy { get; set; } = "Tour Director";

        [BsonElement("createdAt")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
