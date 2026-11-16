using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Services;

public interface IAuthService
{
    Task<(bool Success, string? Error, AuthResponseDto? Data)> RegisterAsync(
        RegisterDto dto, string clientIp, string hostname, string? userAgent = null);

    Task<(bool Success, string? Error, AuthResponseDto? Data)> LoginAsync(
        LoginDto dto, string clientIp, string? deviceInfo = null);

    Task<(bool Success, string? Error, AuthResponseDto? Data)> RefreshTokenAsync(
        string rawRefreshToken, string clientIp, string? deviceInfo = null);

    Task<(bool Success, string? Error)> LogoutAsync(string? rawRefreshToken);

    Task<(bool Success, string? Error)> VerifyEmailAsync(string rawToken);

    Task<(bool Success, string Message)> ResendVerificationAsync(string email, string hostname);

    Task<(bool Success, string Message)> ForgotPasswordAsync(string email, string hostname);

    Task<(bool Success, string? Error)> ResetPasswordAsync(string rawToken, string newPassword);

    Task<(bool Success, string? Error, UserProfileDto? Data)> GetMeAsync(string userId);

    Task<(bool Success, string? Error, UserProfileDto? Data)> UpdateProfileAsync(string userId, UpdateProfileDto dto);

    Task<(bool Success, string? Error)> ChangePasswordAsync(string userId, ChangePasswordDto dto);

    Task<(bool Success, string? Error)> DeleteAccountAsync(string userId);

    Task<(bool Success, string? Error)> ResetLockoutAsync(string email);
}
