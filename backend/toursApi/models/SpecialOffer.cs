using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class SpecialOffer
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

    [BsonElement("code")]
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("discountPercent")]
    [JsonPropertyName("discountPercent")]
    public double DiscountPercent { get; set; } = 0;

    [BsonElement("discountAmount")]
    [JsonPropertyName("discountAmount")]
    public double? DiscountAmount { get; set; }

    [BsonElement("imageUrl")]
    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [BsonElement("badge")]
    [JsonPropertyName("badge")]
    public string? Badge { get; set; }

    [BsonElement("expiryDate")]
    [JsonPropertyName("expiryDate")]
    public DateTime? ExpiryDate { get; set; }

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
