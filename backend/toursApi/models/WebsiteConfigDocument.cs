// models/WebsiteConfigDocument.cs
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ToursApi.Models;

// One document per hostname, holding the ENTIRE per-site config that
// used to live in config/website1.js / website2.js / website3.js on
// the frontend (hero copy, theme, packages, testimonials, footer,
// everything). Stored as a raw BsonDocument rather than a strict typed
// class because that static shape has 30+ nested sections and changes
// over time — modeling every field in C# would mean editing this file
// every time a new homepage section gets added on the frontend. The
// frontend still owns interpreting/using the shape; this is just
// flexible storage for it.
public class WebsiteConfigDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    // e.g. "holidayparadise.com" — matches WebsiteRegistry.Hostname.
    public required string Hostname { get; set; }

    // The full config object, stored as-is.
    public required BsonDocument Config { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}