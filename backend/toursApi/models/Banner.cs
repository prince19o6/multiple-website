using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class Banner
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
    public string Module { get; set; } = "home"; // "home", "hotels", "tours", "packages", "flights", "transfers", "visas", "restaurants"

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("subtitle")]
    [JsonPropertyName("subtitle")]
    public string? Subtitle { get; set; }

    [BsonElement("tagline")]
    [JsonPropertyName("tagline")]
    public string? Tagline { get; set; }

    [BsonElement("badge")]
    [JsonPropertyName("badge")]
    public string? Badge { get; set; }

    [BsonElement("imageUrl")]
    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [BsonElement("ctaText")]
    [JsonPropertyName("ctaText")]
    public string? CtaText { get; set; }

    [BsonElement("ctaLink")]
    [JsonPropertyName("ctaLink")]
    public string? CtaLink { get; set; }

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
