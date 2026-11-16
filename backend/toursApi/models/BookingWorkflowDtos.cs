using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

public class ConfirmBookingDto
{
    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public class RejectBookingDto
{
    [Required(ErrorMessage = "A rejection reason is required.")]
    [MinLength(3, ErrorMessage = "Rejection reason must be at least 3 characters.")]
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public class CancelBookingDto
{
    [Required(ErrorMessage = "A cancellation reason is required.")]
    [MinLength(3, ErrorMessage = "Cancellation reason must be at least 3 characters.")]
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("note")]
    public string? Note { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }
}

public class BulkActionDto
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one booking ID must be specified.")]
    [JsonPropertyName("bookingIds")]
    public List<string> BookingIds { get; set; } = new();

    [Required]
    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty; // "confirm" or "reject"

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }
}

public class BulkActionResultItem
{
    public string Id { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Message { get; set; }
}

public class BulkActionResultDto
{
    public int Succeeded { get; set; }
    public int Failed { get; set; }
    public List<BulkActionResultItem> Results { get; set; } = new();
}

public class CustomerCancellationRequestDto
{
    [Required(ErrorMessage = "Please provide a reason for the cancellation request.")]
    [MinLength(5, ErrorMessage = "Reason must be at least 5 characters.")]
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }
}

public class ReviewCancellationRequestDto
{
    [JsonPropertyName("approve")]
    public bool Approve { get; set; }

    [JsonPropertyName("adminNote")]
    public string? AdminNote { get; set; }
}

public class VerifyActionTokenResultDto
{
    public bool Valid { get; set; }
    public string? Action { get; set; }
    public string? BookingId { get; set; }
    public string? BookingReference { get; set; }
    public string? TourTitle { get; set; }
    public string? GuestName { get; set; }
    public string? Email { get; set; }
    public double TotalPrice { get; set; }
    public string Currency { get; set; } = "$";
    public string CurrentStatus { get; set; } = string.Empty;
    public DateTime? TravelDate { get; set; }
    public string? Error { get; set; }
}

public class ExecuteActionTokenDto
{
    [Required(ErrorMessage = "Action token is required.")]
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("action")]
    public string? Action { get; set; } // "approve" (or "confirm") or "reject", falls back to token payload action if not provided

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }
}

public class InboxCountsDto
{
    public int Pending { get; set; }
    public int Confirmed { get; set; }
    public int Cancelled { get; set; }
    public int Completed { get; set; }
    public int Rejected { get; set; }
    public int Expired { get; set; }
    public int CancellationRequests { get; set; }
    public int Total { get; set; }
}

public class ResendEmailDto
{
    [JsonPropertyName("template")]
    public string? Template { get; set; }

    [JsonPropertyName("recipientOverride")]
    public string? RecipientOverride { get; set; }
}
