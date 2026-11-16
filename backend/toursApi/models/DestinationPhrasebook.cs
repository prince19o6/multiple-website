using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models
{
    public class DestinationPhrasebook
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("websiteId")]
        public string WebsiteId { get; set; } = string.Empty;

        [BsonElement("languageName")]
        public string LanguageName { get; set; } = string.Empty;

        [BsonElement("nativeLanguageName")]
        public string NativeLanguageName { get; set; } = string.Empty;

        [BsonElement("regionDescription")]
        public string RegionDescription { get; set; } = string.Empty;

        [BsonElement("bargainingTip")]
        public string BargainingTip { get; set; } = string.Empty;

        [BsonElement("etiquetteTip")]
        public string EtiquetteTip { get; set; } = string.Empty;

        [BsonElement("phrases")]
        public List<PhraseItemDto> Phrases { get; set; } = new();

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
