using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

[BsonIgnoreExtraElements]
public class VisaFaq
{
    [BsonElement("question")]
    public string Question { get; set; } = string.Empty;

    [BsonElement("answer")]
    public string Answer { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class Visa
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int VisaNumericId { get; set; }

    [BsonElement("visaId")]
    public string? VisaId { get; set; }

    [BsonElement("websiteId")]
    public string WebsiteId { get; set; } = "gujjutours";

    [BsonElement("website")]
    public string? Website { get; set; }

    [BsonElement("country")]
    public string Country { get; set; } = string.Empty;

    [BsonElement("countryCode")]
    public string CountryCode { get; set; } = string.Empty;

    [BsonElement("countrySlug")]
    public string CountrySlug { get; set; } = string.Empty;

    [BsonElement("flag")]
    public string Flag { get; set; } = "🌐";

    [BsonElement("continent")]
    public string Continent { get; set; } = "Asia";

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("visaType")]
    public string VisaType { get; set; } = "tourist"; // tourist, express, business, transit, multiple-entry

    [BsonElement("visaTypeLabel")]
    public string VisaTypeLabel { get; set; } = "Tourist eVisa";

    [BsonElement("validity")]
    public string Validity { get; set; } = "60 Days from Date of Issue";

    [BsonElement("stayDuration")]
    public string StayDuration { get; set; } = "30 Days";

    [BsonElement("processingTime")]
    public string ProcessingTime { get; set; } = "3-4 Working Days";

    [BsonElement("entryType")]
    public string EntryType { get; set; } = "Single Entry";

    [BsonElement("fastTrackAvailable")]
    public bool FastTrackAvailable { get; set; }

    [BsonElement("price")]
    public double Price { get; set; }

    [BsonElement("originalPrice")]
    public double? OriginalPrice { get; set; }

    [BsonElement("netPrice")]
    public double? NetPrice { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "INR";

    [BsonElement("image")]
    public string Image { get; set; } = "/seed-images/visas/visa-tourist.svg";

    [BsonElement("coverImage")]
    [JsonPropertyName("coverImage")]
    public string CoverImage { get => Image; set => Image = value; }

    [BsonElement("documentsRequired")]
    public List<string> DocumentsRequired { get; set; } = new();

    [BsonElement("approvalRate")]
    public double ApprovalRate { get; set; } = 99.4;

    [BsonElement("rating")]
    public double Rating { get; set; } = 4.9;

    [BsonElement("reviews")]
    public int Reviews { get; set; } = 150;

    [BsonElement("featured")]
    public bool Featured { get; set; }

    [BsonElement("isDemo")]
    public bool IsDemo { get; set; } = true;

    [BsonElement("status")]
    public string Status { get; set; } = "Active";

    [BsonElement("overview")]
    public string Overview { get; set; } = string.Empty;

    [BsonElement("faqs")]
    public List<VisaFaq> Faqs { get; set; } = new();

    [BsonElement("submissionSteps")]
    public List<string> SubmissionSteps { get; set; } = new();

    [BsonElement("createdAt")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
}

