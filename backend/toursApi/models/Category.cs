using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

/// <summary>
/// Universal taxonomy category entry per website database.
/// Manages property types, activity styles, package themes, cuisines, and vehicle classes.
/// </summary>
[BsonIgnoreExtraElements]
public class Category
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
    public string Module { get; set; } = "hotels"; // "hotels", "activities", "packages", "flights", "transfers", "visas", "restaurants", "buildpackage"

    [BsonElement("slug")]
    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public Dictionary<string, string> Name { get; set; } = new();

    [BsonElement("icon")]
    [JsonPropertyName("icon")]
    public string Icon { get; set; } = "layers-outline";

    [BsonElement("order")]
    [JsonPropertyName("order")]
    public int Order { get; set; } = 100;

    [BsonElement("enabled")]
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    [BsonElement("parentSlug")]
    [JsonPropertyName("parentSlug")]
    public string? ParentSlug { get; set; }

    [BsonIgnore]
    [JsonPropertyName("metadata")]
    public Dictionary<string, object>? Metadata { get; set; }

    [BsonElement("metadata")]
    [JsonIgnore]
    public BsonDocument? BsonMetadata
    {
        get
        {
            if (Metadata == null) return null;
            var doc = new BsonDocument();
            foreach (var kvp in Metadata)
            {
                if (kvp.Value is System.Text.Json.JsonElement je)
                {
                    switch (je.ValueKind)
                    {
                        case System.Text.Json.JsonValueKind.String:
                            doc[kvp.Key] = je.GetString();
                            break;
                        case System.Text.Json.JsonValueKind.Number:
                            if (je.TryGetInt64(out var l)) doc[kvp.Key] = l;
                            else if (je.TryGetDouble(out var d)) doc[kvp.Key] = d;
                            break;
                        case System.Text.Json.JsonValueKind.True:
                            doc[kvp.Key] = true;
                            break;
                        case System.Text.Json.JsonValueKind.False:
                            doc[kvp.Key] = false;
                            break;
                        default:
                            doc[kvp.Key] = je.ToString();
                            break;
                    }
                }
                else if (kvp.Value is string s) doc[kvp.Key] = s;
                else if (kvp.Value is bool b) doc[kvp.Key] = b;
                else if (kvp.Value is int i) doc[kvp.Key] = i;
                else if (kvp.Value is double db) doc[kvp.Key] = db;
                else if (kvp.Value != null) doc[kvp.Key] = kvp.Value.ToString();
            }
            return doc;
        }
        set
        {
            if (value == null)
            {
                Metadata = null;
                return;
            }
            Metadata = new Dictionary<string, object>();
            foreach (var elem in value)
            {
                Metadata[elem.Name] = BsonTypeMapper.MapToDotNetValue(elem.Value);
            }
        }
    }
}

