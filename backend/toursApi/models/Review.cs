using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class Review
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("module")]
    [JsonPropertyName("module")]
    public string Module { get; set; } = "all";

    [BsonElement("targetId")]
    [JsonPropertyName("targetId")]
    public string? TargetId { get; set; }

    [BsonElement("author")]
    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    [BsonElement("location")]
    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [BsonElement("avatar")]
    [JsonPropertyName("avatar")]
    public string? Avatar { get; set; }

    [BsonElement("rating")]
    [JsonPropertyName("rating")]
    public double Rating { get; set; } = 5.0;

    [BsonElement("comment")]
    [JsonPropertyName("comment")]
    public string Comment { get; set; } = string.Empty;

    [BsonElement("tourName")]
    [JsonPropertyName("tourName")]
    public string? TourName { get; set; }

    [BsonElement("verified")]
    [JsonPropertyName("verified")]
    public bool Verified { get; set; } = true;

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
