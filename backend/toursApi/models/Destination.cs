using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class Destination
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    // The frontend slug/key used to scope per-site data (e.g. "website1").
    [BsonElement("website")]
    public string Website { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    // Full-size image URL shown in the destinations grid.
    [BsonElement("image")]
    public string Image { get; set; } = string.Empty;

    // Number of tours available at this destination (for display only).
    [BsonElement("tours")]
    public int Tours { get; set; } = 0;

    // Optional display ordering — lower numbers appear first.
    [BsonElement("sortOrder")]
    public int SortOrder { get; set; } = 0;

    [BsonElement("country")]
    public string? Country { get; set; }

    [BsonElement("createdAt")]
    public DateTime? CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}
