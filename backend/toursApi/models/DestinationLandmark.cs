using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models
{
    [BsonIgnoreExtraElements]
    public class DestinationLandmark
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("siteId")]
        public string SiteId { get; set; } = string.Empty;

        [BsonElement("tourId")]
        public int? TourId { get; set; }

        [BsonElement("tourName")]
        public string? TourName { get; set; }

        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("subtitle")]
        public string Subtitle { get; set; } = string.Empty;

        [BsonElement("category")]
        public string Category { get; set; } = "Heritage & Culture";

        [BsonElement("latitude")]
        public double Latitude { get; set; }

        [BsonElement("longitude")]
        public double Longitude { get; set; }

        [BsonElement("city")]
        public string City { get; set; } = string.Empty;

        [BsonElement("region")]
        public string Region { get; set; } = string.Empty;

        [BsonElement("rating")]
        public double Rating { get; set; } = 4.8;

        [BsonElement("reviewCount")]
        public int ReviewCount { get; set; } = 120;

        [BsonElement("imageUrl")]
        public string ImageUrl { get; set; } = string.Empty;

        [BsonElement("gallery")]
        public List<string> Gallery { get; set; } = new();

        [BsonElement("openingHours")]
        public string OpeningHours { get; set; } = "Open Daily 6:00 AM - 9:00 PM";

        [BsonElement("bestTimeToVisit")]
        public string BestTimeToVisit { get; set; } = "October to March";

        [BsonElement("insiderTip")]
        public string InsiderTip { get; set; } = string.Empty;

        [BsonElement("approximateVisitDuration")]
        public string ApproximateVisitDuration { get; set; } = "2 - 3 Hours";

        [BsonElement("admissionFee")]
        public string AdmissionFee { get; set; } = "Free Entry";

        [BsonElement("isFeatured")]
        public bool IsFeatured { get; set; } = true;

        [BsonElement("tags")]
        public List<string> Tags { get; set; } = new();

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
