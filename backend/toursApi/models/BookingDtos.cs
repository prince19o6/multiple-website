using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ToursApi.Models;

/// <summary>
/// Payload submitted by Web or App client to book a tour experience.
/// Server re-verifies tour rate, currency, and availability directly from the database.
/// </summary>
public class BookingCreateDto
{
    public int TourId { get; set; }
    public string? ItemId { get; set; }
    public string? Slug { get; set; }
    public string? Module { get; set; }
    public string? TourSlug { get; set; }
    public string? TourName { get; set; }
    public string? Title { get; set; }
    public string? TourImage { get; set; }
    public string? Image { get; set; }
    public string? ImageUrl { get; set; }
    public string? Currency { get; set; }
    public string? Location { get; set; }
    public string? Destination { get; set; }
    public string? Service { get; set; }
    public string? ServiceType { get; set; }
    public string? Category { get; set; }
    public string? Option { get; set; }
    public string? FlightNumber { get; set; }
    public string? Airline { get; set; }
    public string? DepartureTime { get; set; }
    public double? UnitPrice { get; set; }
    public double? OriginalPrice { get; set; }
    public double? Subtotal { get; set; }
    public double? Taxes { get; set; }
    public double? TotalPrice { get; set; }
    public double? AmountPaid { get; set; }
    public double? AmountDue { get; set; }
    public string? Duration { get; set; }
    public int? Nights { get; set; }
    public int? Rooms { get; set; }

    [Required(ErrorMessage = "Guest contact name is required")]
    public string GuestName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Valid email address is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required")]
    public string Phone { get; set; } = string.Empty;

    public DateTime? TravelDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public int? Adults { get; set; }
    public int? Children { get; set; }
    public int? Infants { get; set; }
    public int Travelers { get; set; } = 1;

    public string? PaymentMethod { get; set; } // "card", "upi", "paypal", "pay_on_arrival"
    public string? PaymentOption { get; set; } // "full" or "payLater"
    public string? PaymentPlan { get; set; }
    public string? PaymentStatus { get; set; }
    public string? PaymentReference { get; set; }
    public string? SpecialRequest { get; set; }
    public string? SpecialRequests { get; set; }

    public string? Source { get; set; } // "web" or "app"
    public string? UserId { get; set; }
    public string? Website { get; set; }
    public string? WebsiteId { get; set; }
    public string? IdempotencyKey { get; set; }

    public string? PromoCode { get; set; }
    public string? CouponCode { get; set; }
    public double? DiscountAmount { get; set; }
    public List<string>? AddOns { get; set; }
    public double? AddOnsTotal { get; set; }

    public List<BookingTravelerDto>? TravelersList { get; set; }
}

/// <summary>
/// DTO representing an individual traveler/passenger in a booking payload.
/// </summary>
public class BookingTravelerDto
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Type { get; set; } = "Adult"; // "Adult" or "Child"
    public int? Age { get; set; }
    public string? Gender { get; set; } // "Male", "Female", "Other"
    public string? PassportOrId { get; set; }
    public string? PassportNumber { get; set; }
    public string? PassportExpiry { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Nationality { get; set; }
}

/// <summary>
/// Payload to validate promotional discount coupon.
/// </summary>
public class CouponValidateDto
{
    [Required]
    public string Code { get; set; } = string.Empty;
    public int TourId { get; set; }
    public int Travelers { get; set; } = 1;
    public double Subtotal { get; set; }
    public string? WebsiteId { get; set; }
}

/// <summary>
/// Server response for validated promotional discount coupon.
/// </summary>
public class CouponValidationResultDto
{
    public bool IsValid { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double DiscountPercent { get; set; }
    public double DiscountAmount { get; set; }
    public double NewTotal { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Status update submitted by administrator.
/// </summary>
public class BookingUpdateDto
{
    public string? Status { get; set; }
    public string? PaymentStatus { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// Guest lookup payload to find a specific reservation by reference + email.
/// </summary>
public class BookingGuestLookupDto
{
    [Required]
    public string Reference { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Payment payload to confirm a pending booking.
/// </summary>
public class BookingPaymentDto
{
    public string Method { get; set; } = "card";
    public string? TransactionId { get; set; }
    public string? CardLast4 { get; set; }
}

/// <summary>
/// Payload to claim anonymous or guest bookings into an authenticated customer profile.
/// </summary>
public class BookingClaimDto
{
    public string? Email { get; set; }
    public List<string>? References { get; set; }
}

/// <summary>
/// Report returned by safe, idempotent migration tool.
/// </summary>
public class BookingMigrationResultDto
{
    public string WebsiteId { get; set; } = string.Empty;
    public int TotalScanned { get; set; }
    public int NeedsMigration { get; set; }
    public int Migrated { get; set; }
    public int AlreadyUpToDate { get; set; }
    public bool DryRun { get; set; }
    public List<string> SampleUpdatedReferences { get; set; } = new();
}

/// <summary>
/// Payload to calculate server-verified live pricing quote before checkout submission.
/// </summary>
public class BookingQuoteRequestDto
{
    public string? Service { get; set; }
    public string? ServiceType { get; set; }
    public string? Module { get; set; }
    public string? ItemId { get; set; }
    public string? Id { get; set; }
    public string? Slug { get; set; }
    public int? TourId { get; set; }
    public string? Option { get; set; }
    public string? FlightNumber { get; set; }
    public DateTime? TravelDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? Nights { get; set; }
    public int? Rooms { get; set; }
    public int? Adults { get; set; }
    public int? Children { get; set; }
    public int? Infants { get; set; }
    public int? Travelers { get; set; }
    public string? PromoCode { get; set; }
    public string? CouponCode { get; set; }
    public string? PaymentOption { get; set; }
    public string? Currency { get; set; }
}

/// <summary>
/// Server response providing authoritative recalculation breakdown for checkout display.
/// </summary>
public class BookingQuoteResponseDto
{
    public bool Success { get; set; } = true;
    public string Title { get; set; } = string.Empty;
    public string Service { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public double UnitPrice { get; set; }
    public double ChildPrice { get; set; }
    public double Subtotal { get; set; }
    public double Discount { get; set; }
    public double TaxRate { get; set; }
    public double Taxes { get; set; }
    public double Total { get; set; }
    public double AdvanceDue { get; set; }
    public double BalanceDue { get; set; }
    public string Currency { get; set; } = "INR";
    public string? PromoMessage { get; set; }
    public Dictionary<string, double> Breakdown { get; set; } = new();
}