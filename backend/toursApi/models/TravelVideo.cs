using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class TravelVideo
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

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("destination")]
    [JsonPropertyName("destination")]
    public string Destination { get; set; } = string.Empty;

    [BsonElement("videoUrl")]
    [JsonPropertyName("videoUrl")]
    public string VideoUrl { get; set; } = string.Empty;

    [BsonElement("thumbnailUrl")]
    [JsonPropertyName("thumbnailUrl")]
    public string ThumbnailUrl { get; set; } = string.Empty;

    [BsonElement("travelerName")]
    [JsonPropertyName("travelerName")]
    public string? TravelerName { get; set; }

    [BsonElement("viewsCount")]
    [JsonPropertyName("viewsCount")]
    public int ViewsCount { get; set; } = 0;

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
