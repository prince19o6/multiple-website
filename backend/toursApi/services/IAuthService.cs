using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Services;

public interface IAuthService
{
    Task<(bool Success, string? Error, AuthResponseDto? Data)> RegisterAsync(
        RegisterDto dto, string hostname);

    Task<(bool Success, string? Error, AuthResponseDto? Data)> LoginAsync(
        LoginDto dto, string ipAddress);

    Task<(bool Success, string? Error, AuthResponseDto? Data)> RefreshTokenAsync(
        string refreshToken);

    Task<(bool Success, string? Error)> LogoutAsync(
        string? refreshToken);

    Task<(bool Success, string Message)> ForgotPasswordAsync(
        string email, string hostname);

    Task<(bool Success, string? Error)> ResetPasswordAsync(
        string rawToken, string newPassword);

    Task<(bool Success, string? Error, UserProfileDto? Data)> GetMeAsync(
        string userId);

    Task<(bool Success, string? Error)> ResetLockoutAsync(
        string email);
}
