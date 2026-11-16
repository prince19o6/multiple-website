using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace ToursApi.Models
{
    public class AudioStory
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [BsonElement("tourId")]
        public string? TourId { get; set; }

        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("subtitle")]
        public string Subtitle { get; set; } = string.Empty;

        [BsonElement("category")]
        public string Category { get; set; } = "history"; // history, architecture, legends, nature

        [BsonElement("durationSeconds")]
        public int DurationSeconds { get; set; } = 180;

        [BsonElement("audioUrl")]
        public string AudioUrl { get; set; } = string.Empty;

        [BsonElement("coverImage")]
        public string CoverImage { get; set; } = string.Empty;

        [BsonElement("transcript")]
        public string Transcript { get; set; } = string.Empty;

        [BsonElement("narratorName")]
        public string NarratorName { get; set; } = string.Empty;

        [BsonElement("language")]
        public string Language { get; set; } = "en";

        [BsonElement("landmarkName")]
        public string? LandmarkName { get; set; }

        [BsonElement("latitude")]
        public double Latitude { get; set; }

        [BsonElement("longitude")]
        public double Longitude { get; set; }

        [BsonElement("playCount")]
        public int PlayCount { get; set; } = 0;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
