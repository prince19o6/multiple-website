using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

public class RegisterDto
{
    [Required(ErrorMessage = "Full name is required")]
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 80 characters")]
    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    // Backward-compatible alias for existing callers
    [JsonPropertyName("name")]
    public string Name
    {
        get => !string.IsNullOrEmpty(FullName) ? FullName : _name;
        set
        {
            _name = value;
            if (string.IsNullOrEmpty(FullName)) FullName = value;
        }
    }
    private string _name = string.Empty;

    [Required(ErrorMessage = "Email address is required")]
    [EmailAddress(ErrorMessage = "Please provide a valid email address")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phoneCountryCode")]
    public string PhoneCountryCode { get; set; } = "+91";

    [Required(ErrorMessage = "Phone number is required")]
    [StringLength(20, MinimumLength = 6, ErrorMessage = "Please provide a valid phone number")]
    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long")]
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("dietaryPreference")]
    public string DietaryPreference { get; set; } = "None"; // None | PureVeg | Jain | Swaminarayan | Halal

    [JsonPropertyName("preferredCurrency")]
    public string PreferredCurrency { get; set; } = "INR";

    [JsonPropertyName("marketingOptIn")]
    public bool MarketingOptIn { get; set; } = false;

    [Required(ErrorMessage = "You must accept the terms and conditions to register")]
    [JsonPropertyName("termsAccepted")]
    public bool TermsAccepted { get; set; } = false;
}

public class LoginDto
{
    [Required(ErrorMessage = "Email address is required")]
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    [JsonPropertyName("deviceInfo")]
    public string? DeviceInfo { get; set; }
}

public class RefreshTokenDto
{
    [Required(ErrorMessage = "RefreshToken is required")]
    [JsonPropertyName("refreshToken")]
    public string RefreshToken { get; set; } = string.Empty;

    [JsonPropertyName("deviceInfo")]
    public string? DeviceInfo { get; set; }
}

public class LogoutDto
{
    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; set; }
}

public class VerifyEmailDto
{
    [Required(ErrorMessage = "Verification token is required")]
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;
}

public class ResendVerificationDto
{
    [Required(ErrorMessage = "Email address is required")]
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
}

public class ForgotPasswordDto
{
    [Required(ErrorMessage = "Email address is required")]
    [EmailAddress(ErrorMessage = "Invalid email address format")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    [Required(ErrorMessage = "Token is required")]
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long")]
    [JsonPropertyName("newPassword")]
    public string NewPassword { get; set; } = string.Empty;

    // Backward-compatible alias
    [JsonPropertyName("password")]
    public string Password
    {
        get => NewPassword;
        set => NewPassword = value;
    }
}

public class ChangePasswordDto
{
    [Required(ErrorMessage = "Current password is required")]
    [JsonPropertyName("currentPassword")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required")]
    [MinLength(8, ErrorMessage = "New password must be at least 8 characters long")]
    [JsonPropertyName("newPassword")]
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateProfileDto
{
    [StringLength(80, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 80 characters")]
    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    [JsonPropertyName("name")]
    public string? Name
    {
        get => FullName;
        set { if (value != null) FullName = value; }
    }

    [JsonPropertyName("phoneCountryCode")]
    public string? PhoneCountryCode { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("dietaryPreference")]
    public string? DietaryPreference { get; set; }

    [JsonPropertyName("preferredCurrency")]
    public string? PreferredCurrency { get; set; }

    [JsonPropertyName("marketingOptIn")]
    public bool? MarketingOptIn { get; set; }
}

public class UserProfileDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("userCode")]
    public string UserCode { get; set; } = string.Empty;

    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name
    {
        get => FullName;
        set => FullName = value;
    }

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phoneCountryCode")]
    public string PhoneCountryCode { get; set; } = "+91";

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("role")]
    public string Role { get; set; } = "Customer";

    [JsonPropertyName("isEmailVerified")]
    public bool IsEmailVerified { get; set; } = false;

    [JsonPropertyName("dietaryPreference")]
    public string DietaryPreference { get; set; } = "None";

    [JsonPropertyName("preferredCurrency")]
    public string PreferredCurrency { get; set; } = "INR";

    [JsonPropertyName("marketingOptIn")]
    public bool MarketingOptIn { get; set; } = false;

    [JsonPropertyName("websiteId")]
    public string WebsiteId { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("lastLoginAt")]
    public DateTime? LastLoginAt { get; set; }
}

public class AuthResponseDto
{
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("accessToken")]
    public string AccessToken
    {
        get => Token;
        set => Token = value;
    }

    [JsonPropertyName("refreshToken")]
    public string RefreshToken { get; set; } = string.Empty;

    [JsonPropertyName("user")]
    public UserProfileDto User { get; set; } = new();

    [JsonPropertyName("expiresAt")]
    public DateTime ExpiresAt { get; set; }
}
