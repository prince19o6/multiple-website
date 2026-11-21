using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class StaticPageSection
{
    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("subtitle")]
    [JsonPropertyName("subtitle")]
    public string? Subtitle { get; set; }

    [BsonElement("body")]
    [JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty;

    [BsonElement("imageUrl")]
    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [BsonElement("order")]
    [JsonPropertyName("order")]
    public int Order { get; set; } = 0;
}

[BsonIgnoreExtraElements]
public class StaticPage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("slug")]
    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty; // "about-us", "contact-us", "privacy-policy", "terms-and-conditions", "cookie-policy"

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("contentHtml")]
    [JsonPropertyName("contentHtml")]
    public string ContentHtml { get; set; } = string.Empty;

    [BsonElement("metaTitle")]
    [JsonPropertyName("metaTitle")]
    public string? MetaTitle { get; set; }

    [BsonElement("metaDescription")]
    [JsonPropertyName("metaDescription")]
    public string? MetaDescription { get; set; }

    [BsonElement("sections")]
    [JsonPropertyName("sections")]
    public List<StaticPageSection> Sections { get; set; } = new();

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
