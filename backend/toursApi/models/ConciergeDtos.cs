using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ToursApi.Models;

public class ConciergeInquiryCreateDto
{
    public int? TourId { get; set; }
    public string? TourName { get; set; }

    [Required(ErrorMessage = "Guest name is required")]
    public string GuestName { get; set; } = string.Empty;

    public string? Email { get; set; }
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Inquiry message is required")]
    public string Message { get; set; } = string.Empty;

    public string? Category { get; set; }
    public string? Source { get; set; }
}

public class ConciergeInquiryResponseDto
{
    public bool Success { get; set; } = true;
    public string InquiryId { get; set; } = string.Empty;
    public string SpecialistName { get; set; } = string.Empty;
    public string SpecialistRole { get; set; } = string.Empty;
    public string Reply { get; set; } = string.Empty;
    public List<string> SuggestedFollowUps { get; set; } = new();
    public string WhatsAppUrl { get; set; } = string.Empty;
    public string SupportPhone { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;
}

public class ConciergeSpecialistProfileDto
{
    public string SpecialistName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public List<string> Languages { get; set; } = new();
    public string WelcomeGreeting { get; set; } = string.Empty;
    public string Status { get; set; } = "online";
    public string TypicalReplyTime { get; set; } = "Under 2 minutes";
    public string WhatsAppNumber { get; set; } = string.Empty;
    public string SupportPhone { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;
    public List<string> QuickInquiries { get; set; } = new();
}
