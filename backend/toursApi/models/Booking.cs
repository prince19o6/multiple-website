using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

/// <summary>
/// Authoritative booking status constants enforced across all websites.
/// </summary>
public static class BookingStatus
{
    public const string Pending = "pending";
    public const string Confirmed = "confirmed";
    public const string Rejected = "rejected";
    public const string Expired = "expired";
    public const string Cancelled = "cancelled";
    public const string Completed = "completed";

    public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
    {
        Pending,
        Confirmed,
        Rejected,
        Expired,
        Cancelled,
        Completed
    };

    public static readonly HashSet<string> FinalStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        Rejected,
        Expired,
        Cancelled,
        Completed
    };
}

/// <summary>
/// Universal booking item snapshot capturing full immutable details of a service item
/// (hotel, activity, package, flight, transfer, visa, restaurant) at the time of reservation.
/// </summary>
[BsonIgnoreExtraElements]
public class BookingItemSnapshot
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("serviceType")]
    [JsonPropertyName("serviceType")]
    public string ServiceType { get; set; } = "hotel"; // "hotel", "activity", "package", "flight", "transfer", "visa", "restaurant", "custom"

    [BsonElement("serviceId")]
    [JsonPropertyName("serviceId")]
    public string ServiceId { get; set; } = string.Empty;

    [BsonElement("slug")]
    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("imageUrl")]
    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [BsonElement("destination")]
    [JsonPropertyName("destination")]
    public string Destination { get; set; } = string.Empty;

    [BsonElement("startDate")]
    [JsonPropertyName("startDate")]
    public string StartDate { get; set; } = string.Empty;

    [BsonElement("endDate")]
    [JsonPropertyName("endDate")]
    public string? EndDate { get; set; }

    [BsonElement("adults")]
    [JsonPropertyName("adults")]
    public int Adults { get; set; } = 2;

    [BsonElement("children")]
    [JsonPropertyName("children")]
    public int Children { get; set; } = 0;

    [BsonElement("roomsCount")]
    [JsonPropertyName("roomsCount")]
    public int RoomsCount { get; set; } = 1;

    [BsonElement("selectionName")]
    [JsonPropertyName("selectionName")]
    public string? SelectionName { get; set; } // e.g., "Deluxe Room", "Toyota Camry Sedan"

    [BsonElement("basePrice")]
    [JsonPropertyName("basePrice")]
    public double BasePrice { get; set; }

    [BsonElement("taxes")]
    [JsonPropertyName("taxes")]
    public double Taxes { get; set; }

    [BsonElement("totalAmount")]
    [JsonPropertyName("totalAmount")]
    public double TotalAmount { get; set; }

    [BsonElement("currency")]
    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";
}

/// <summary>
/// Sub-document capturing a complete, immutable snapshot of the tour at the time of booking.
/// Guarantees that the booking displays full details even if the catalog tour is modified or deleted.
/// </summary>
[BsonIgnoreExtraElements]
public class TourSnapshot
{
    [BsonElement("tourId")]
    [JsonPropertyName("tourId")]
    public int TourId { get; set; }

    [BsonElement("slug")]
    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("coverImage")]
    [JsonPropertyName("coverImage")]
    public string CoverImage { get; set; } = string.Empty;

    [BsonElement("destination")]
    [JsonPropertyName("destination")]
    public string Destination { get; set; } = string.Empty;

    [BsonElement("category")]
    [JsonPropertyName("category")]
    public string Category { get; set; } = "Adventure";

    [BsonElement("duration")]
    [JsonPropertyName("duration")]
    public string Duration { get; set; } = string.Empty;

    [BsonElement("pricePerPerson")]
    [JsonPropertyName("pricePerPerson")]
    public double PricePerPerson { get; set; }

    [BsonElement("currency")]
    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [BsonElement("itinerarySummary")]
    [JsonPropertyName("itinerarySummary")]
    public List<ItineraryDaySummary> ItinerarySummary { get; set; } = new();

    [BsonElement("includedSummary")]
    [JsonPropertyName("includedSummary")]
    public List<string> IncludedSummary { get; set; } = new();

    [BsonElement("excludedSummary")]
    [JsonPropertyName("excludedSummary")]
    public List<string> ExcludedSummary { get; set; } = new();
}

[BsonIgnoreExtraElements]
public class ItineraryDaySummary
{
    [BsonElement("day")]
    [JsonPropertyName("day")]
    public int Day { get; set; }

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// Individual traveler/passenger entry within a reservation.
/// </summary>
[BsonIgnoreExtraElements]
public class BookingTraveler
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "Adult"; // "Adult" or "Child"

    [BsonElement("age")]
    [JsonPropertyName("age")]
    public int? Age { get; set; }

    [BsonElement("gender")]
    [JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [BsonElement("passportOrId")]
    [JsonPropertyName("passportOrId")]
    public string? PassportOrId { get; set; }

    [BsonElement("passportNumber")]
    [JsonPropertyName("passportNumber")]
    public string? PassportNumber { get; set; }

    [BsonElement("passportExpiry")]
    [JsonPropertyName("passportExpiry")]
    public string? PassportExpiry { get; set; }

    [BsonElement("dateOfBirth")]
    [JsonPropertyName("dateOfBirth")]
    public string? DateOfBirth { get; set; }

    [BsonElement("nationality")]
    [JsonPropertyName("nationality")]
    public string? Nationality { get; set; }
}

[BsonIgnoreExtraElements]
public class BookingPriceBreakdown
{
    [BsonElement("subtotal")]
    [JsonPropertyName("subtotal")]
    public double Subtotal { get; set; }

    [BsonElement("discount")]
    [JsonPropertyName("discount")]
    public double Discount { get; set; }

    [BsonElement("taxes")]
    [JsonPropertyName("taxes")]
    public double Taxes { get; set; }

    [BsonElement("addOnsTotal")]
    [JsonPropertyName("addOnsTotal")]
    public double AddOnsTotal { get; set; }

    [BsonElement("total")]
    [JsonPropertyName("total")]
    public double Total { get; set; }
}

/// <summary>
/// Audit trail tracking operational lifecycle status transitions.
/// </summary>
[BsonIgnoreExtraElements]
public class BookingStatusHistoryItem
{
    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [BsonElement("previousStatus")]
    [JsonPropertyName("previousStatus")]
    public string? PreviousStatus { get; set; }

    [BsonElement("changedAt")]
    [JsonPropertyName("changedAt")]
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("action")]
    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty; // e.g., "create", "confirm", "reject", "cancel", "expire", "complete"

    [BsonElement("reason")]
    [JsonPropertyName("reason")]
    public string? Reason { get; set; }

    [BsonElement("note")]
    [JsonPropertyName("note")]
    public string? Note { get; set; }

    [BsonElement("actorRole")]
    [JsonPropertyName("actorRole")]
    public string ActorRole { get; set; } = "customer"; // "admin", "customer", "system"

    [BsonElement("actorId")]
    [JsonPropertyName("actorId")]
    public string? ActorId { get; set; }

    [BsonElement("changedBy")]
    [JsonPropertyName("changedBy")]
    public string? ChangedBy { get; set; }
}

/// <summary>
/// Customer-initiated cancellation request details.
/// </summary>
[BsonIgnoreExtraElements]
public class BookingCancellationRequest
{
    [BsonElement("requestedAt")]
    [JsonPropertyName("requestedAt")]
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("reason")]
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [BsonElement("requestedByEmail")]
    [JsonPropertyName("requestedByEmail")]
    public string RequestedByEmail { get; set; } = string.Empty;

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = "pending"; // "pending", "approved", "rejected"

    [BsonElement("reviewedAt")]
    [JsonPropertyName("reviewedAt")]
    public DateTime? ReviewedAt { get; set; }

    [BsonElement("reviewerId")]
    [JsonPropertyName("reviewerId")]
    public string? ReviewerId { get; set; }

    [BsonElement("adminResponseNote")]
    [JsonPropertyName("adminResponseNote")]
    public string? AdminResponseNote { get; set; }
}

/// <summary>
/// Multi-tenant Booking entity stored in the resolved website database.
/// Includes full immutable tour snapshot, unguessable reference, source tracking,
/// verified server price breakdown, idempotency token, action token security, and status history.
/// </summary>
[BsonIgnoreExtraElements]
public class Booking
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [BsonElement("reference")]
    [JsonPropertyName("reference")]
    public string Reference { get; set; } = string.Empty;

    [BsonElement("websiteId")]
    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [BsonElement("source")]
    [JsonPropertyName("source")]
    public string Source { get; set; } = "web"; // "web" or "app"

    [BsonElement("userId")]
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [BsonElement("userCode")]
    [JsonPropertyName("userCode")]
    public string? UserCode { get; set; }

    [BsonElement("idempotencyKey")]
    [JsonPropertyName("idempotencyKey")]
    public string? IdempotencyKey { get; set; }

    // ─── Contact Details ────────────────────────────────────────────────────────
    [BsonElement("guestName")]
    [JsonPropertyName("guestName")]
    public string GuestName { get; set; } = string.Empty;

    [BsonElement("email")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("phone")]
    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    // ─── Multi-Service & Item Snapshots ─────────────────────────────────────────
    [BsonElement("serviceType")]
    [JsonPropertyName("serviceType")]
    public string ServiceType { get; set; } = "tour"; // "hotel", "activity", "package", "flight", "transfer", "visa", "restaurant", "custom"

    [BsonElement("items")]
    [JsonPropertyName("items")]
    public List<BookingItemSnapshot> Items { get; set; } = new();

    // ─── Tour Snapshot ──────────────────────────────────────────────────────────
    [BsonElement("snapshot")]
    [JsonPropertyName("snapshot")]
    public TourSnapshot Snapshot { get; set; } = new();

    // Flat backwards-compatible properties for legacy web & mobile clients
    [BsonElement("tourId")]
    [JsonPropertyName("tourId")]
    public int TourId { get; set; }

    [BsonElement("tourSlug")]
    [JsonPropertyName("tourSlug")]
    public string? TourSlug { get; set; }

    [BsonElement("tourName")]
    [JsonPropertyName("tourName")]
    public string TourName { get; set; } = string.Empty;

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [BsonElement("tourImage")]
    [JsonPropertyName("tourImage")]
    public string? TourImage { get; set; }

    [BsonElement("currency")]
    [JsonPropertyName("currency")]
    public string? Currency { get; set; }

    [BsonElement("location")]
    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [BsonElement("destination")]
    [JsonPropertyName("destination")]
    public string? Destination { get; set; }

    [BsonElement("unitPrice")]
    [JsonPropertyName("unitPrice")]
    public double? UnitPrice { get; set; }

    [BsonElement("originalPrice")]
    [JsonPropertyName("originalPrice")]
    public double? OriginalPrice { get; set; }

    [BsonElement("duration")]
    [JsonPropertyName("duration")]
    public string? Duration { get; set; }

    // ─── Dates & Guests ─────────────────────────────────────────────────────────
    [BsonElement("travelDate")]
    [JsonPropertyName("travelDate")]
    public DateTime TravelDate { get; set; }

    [BsonElement("startDate")]
    [JsonPropertyName("startDate")]
    public DateTime StartDate { get; set; }

    [BsonElement("endDate")]
    [JsonPropertyName("endDate")]
    public DateTime EndDate { get; set; }

    [BsonElement("adults")]
    [JsonPropertyName("adults")]
    public int Adults { get; set; } = 1;

    [BsonElement("children")]
    [JsonPropertyName("children")]
    public int Children { get; set; } = 0;

    [BsonElement("travelers")]
    [JsonPropertyName("travelers")]
    public int Travelers { get; set; } = 1;

    [BsonElement("travelersList")]
    [JsonPropertyName("travelersList")]
    public List<BookingTraveler> TravelersList { get; set; } = new();

    // ─── Price & Payment ────────────────────────────────────────────────────────
    [BsonElement("priceBreakdown")]
    [JsonPropertyName("priceBreakdown")]
    public BookingPriceBreakdown PriceBreakdown { get; set; } = new();

    [BsonElement("totalPrice")]
    [JsonPropertyName("totalPrice")]
    public double TotalPrice { get; set; }

    [BsonElement("amountPaid")]
    [JsonPropertyName("amountPaid")]
    public double? AmountPaid { get; set; }

    [BsonElement("amountDue")]
    [JsonPropertyName("amountDue")]
    public double? AmountDue { get; set; }

    /// <summary>
    /// Current workflow status: pending, confirmed, rejected, expired, cancelled, completed.
    /// </summary>
    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = BookingStatus.Pending;

    [BsonElement("paymentMethod")]
    [JsonPropertyName("paymentMethod")]
    public string? PaymentMethod { get; set; }

    [BsonElement("paymentStatus")]
    [JsonPropertyName("paymentStatus")]
    public string PaymentStatus { get; set; } = "unpaid"; // unpaid, paid, refunded

    [BsonElement("paymentReference")]
    [JsonPropertyName("paymentReference")]
    public string? PaymentReference { get; set; }

    [BsonElement("paidAt")]
    [JsonPropertyName("paidAt")]
    public DateTime? PaidAt { get; set; }

    [BsonElement("specialRequest")]
    [JsonPropertyName("specialRequest")]
    public string? SpecialRequest { get; set; }

    [BsonElement("promoCode")]
    [JsonPropertyName("promoCode")]
    public string? PromoCode { get; set; }

    [BsonElement("discountAmount")]
    [JsonPropertyName("discountAmount")]
    public double? DiscountAmount { get; set; }

    [BsonElement("addOns")]
    [JsonPropertyName("addOns")]
    public List<string> AddOns { get; set; } = new();

    [BsonElement("addOnsTotal")]
    [JsonPropertyName("addOnsTotal")]
    public double? AddOnsTotal { get; set; }

    // ─── Cancellation Request ───────────────────────────────────────────────────
    [BsonElement("cancellationRequest")]
    [JsonPropertyName("cancellationRequest")]
    public BookingCancellationRequest? CancellationRequest { get; set; }

    // ─── Single-Use Action Token Tracking ───────────────────────────────────────
    [BsonElement("usedActionTokens")]
    [JsonPropertyName("usedActionTokens")]
    public List<string> UsedActionTokens { get; set; } = new();

    [BsonElement("lastActionTokenGeneratedAt")]
    [JsonPropertyName("lastActionTokenGeneratedAt")]
    public DateTime? LastActionTokenGeneratedAt { get; set; }

    // ─── Audit Trail & Timestamps ───────────────────────────────────────────────
    [BsonElement("statusHistory")]
    [JsonPropertyName("statusHistory")]
    public List<BookingStatusHistoryItem> StatusHistory { get; set; } = new();

    [BsonElement("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}