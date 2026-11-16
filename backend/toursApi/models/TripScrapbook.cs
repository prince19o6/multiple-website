using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models
{
    public class TripScrapbook
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("tripId")]
        public string TripId { get; set; } = string.Empty;

        [BsonElement("websiteId")]
        public string WebsiteId { get; set; } = string.Empty;

        [BsonElement("tourName")]
        public string TourName { get; set; } = string.Empty;

        [BsonElement("destination")]
        public string Destination { get; set; } = string.Empty;

        [BsonElement("travelerName")]
        public string TravelerName { get; set; } = string.Empty;

        [BsonElement("heroCoverImage")]
        public string HeroCoverImage { get; set; } = string.Empty;

        [BsonElement("travelDates")]
        public string TravelDates { get; set; } = string.Empty;

        [BsonElement("inspirationalQuote")]
        public string InspirationalQuote { get; set; } = string.Empty;

        [BsonElement("stats")]
        public ScrapbookStatsDto Stats { get; set; } = new();

        [BsonElement("entries")]
        public List<JournalEntryDto> Entries { get; set; } = new();

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
