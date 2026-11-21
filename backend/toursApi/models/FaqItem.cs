using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class FaqItem
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("category")]
    [JsonPropertyName("category")]
    public string Category { get; set; } = "general"; // "general", "booking", "cancellation", "visa", "payment"

    [BsonElement("question")]
    [JsonPropertyName("question")]
    public string Question { get; set; } = string.Empty;

    [BsonElement("answer")]
    [JsonPropertyName("answer")]
    public string Answer { get; set; } = string.Empty;

    [BsonElement("sortOrder")]
    [JsonPropertyName("sortOrder")]
    public int SortOrder { get; set; } = 0;

    [BsonElement("isActive")]
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
