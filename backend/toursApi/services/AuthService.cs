using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly IWebsiteContext _websiteContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly PasswordHasher<User> _passwordHasher;

    private readonly int _jwtExpiryMinutes;
    private readonly int _refreshExpiryDays;

    public AuthService(
        IUserRepository userRepository,
        IEmailService emailService,
        IWebsiteContext websiteContext,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _emailService = emailService;
        _websiteContext = websiteContext;
        _configuration = configuration;
        _logger = logger;
        _passwordHasher = new PasswordHasher<User>();

        _jwtExpiryMinutes = _configuration.GetValue<int>("Jwt:ExpiryMinutes", 60);
        _refreshExpiryDays = _configuration.GetValue<int>("Jwt:RefreshExpiryDays", 30);
    }

    private WebsiteConfig CurrentSite =>
        _websiteContext.CurrentSite ?? throw new InvalidOperationException("Active website context is not set");

    public async Task<(bool Success, string? Error, AuthResponseDto? Data)> RegisterAsync(
        RegisterDto dto, string hostname)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        _logger.LogInformation("[DEBUG] Register Attempt - Tenant: {WebsiteId}, Email: {Email}",
            CurrentSite.WebsiteId, normalizedEmail);

        // Email uniqueness per website database
        var existing = await _userRepository.GetByEmailAsync(normalizedEmail);
        if (existing != null)
        {
            return (false, "An account with this email already exists on this website", null);
        }

        var user = new User
        {
            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            WebsiteId = CurrentSite.WebsiteId,
            Name = dto.Name.Trim(),
            Email = normalizedEmail,
            Phone = dto.Phone?.Trim(),
            Role = "user",
            Status = "active",
            IsDisabled = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        // Generate tokens with this site's signing key, issuer, and audience
        var (accessToken, expiresAt) = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshTokens.Add(refreshToken);

        var created = await _userRepository.CreateAsync(user);

        var response = new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = expiresAt,
            User = MapToProfile(created)
        };

        return (true, null, response);
    }

    public async Task<(bool Success, string? Error, AuthResponseDto? Data)> LoginAsync(
        LoginDto dto, string ipAddress)
    {
        var site = CurrentSite;
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        _logger.LogInformation("[DEBUG] Login Attempt - Tenant: {WebsiteId}, Database: {Db}, Email: {Email}, IP: {IP}",
            site.WebsiteId, site.DatabaseName, normalizedEmail, ipAddress);

        var user = await _userRepository.GetByEmailAsync(normalizedEmail);

        _logger.LogInformation("[DEBUG] User Lookup: Found={Found}, Disabled={Disabled}, LockedUntil={LockedUntil}",
            user != null, user?.IsDisabled, user?.LockoutEndUtc);

        if (user == null)
        {
            return (false, "Invalid email or password", null);
        }

        if (user.LockoutEndUtc.HasValue && user.LockoutEndUtc.Value > DateTime.UtcNow)
        {
            var remaining = Math.Ceiling((user.LockoutEndUtc.Value - DateTime.UtcNow).TotalMinutes);
            return (false, $"Account temporarily locked due to repeated failed logins. Please try again in {remaining} minute(s).", null);
        }

        var (passwordOk, needsRehash) = VerifyPasswordWithMigration(user, dto.Password);
        _logger.LogInformation("[DEBUG] Password Verification: Passed={Passed}, RehashNeeded={Rehash}",
            passwordOk, needsRehash);

        if (!passwordOk)
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockoutEndUtc = DateTime.UtcNow.AddMinutes(15);
                _logger.LogWarning("[DEBUG] Account locked for 15 minutes due to 5 failed attempts: {Email}", normalizedEmail);
            }
            await _userRepository.UpdateAsync(user);
            return (false, "Invalid email or password", null);
        }

        if (user.IsDisabled || string.Equals(user.Status, "disabled", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Your account has been deactivated. Please contact administrator.", null);
        }

        // Automatic rehash to ASP.NET Core Identity V3 PBKDF2 if old format was used
        if (needsRehash)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
            _logger.LogInformation("[DEBUG] Successfully upgraded password hash to Identity V3 for: {Email}", normalizedEmail);
        }

        user.FailedLoginAttempts = 0;
        user.LockoutEndUtc = null;
        user.RefreshTokens.RemoveAll(rt => rt.IsExpired || rt.IsRevoked);

        var (accessToken, expiresAt) = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshTokens.Add(refreshToken);

        await _userRepository.UpdateAsync(user);

        _logger.LogInformation("[DEBUG] Token Issued - Role: {Role}, Issuer: {Issuer}, Expiry: {Expiry}",
            user.Role, site.JwtIssuer, expiresAt);

        var response = new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = expiresAt,
            User = MapToProfile(user)
        };

        return (true, null, response);
    }

    public async Task<(bool Success, string? Error)> ResetLockoutAsync(string email)
    {
        var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(normalizedEmail);
        if (user == null)
        {
            return (false, "User not found in active website tenant database");
        }

        user.FailedLoginAttempts = 0;
        user.LockoutEndUtc = null;
        await _userRepository.UpdateAsync(user);

        _logger.LogInformation("[DEBUG] Lockout reset successfully for: {Email}", normalizedEmail);
        return (true, null);
    }

    private (bool Success, bool NeedsRehash) VerifyPasswordWithMigration(User user, string providedPassword)
    {
        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            return (false, false);
        }

        // 1. Primary: ASP.NET Core Identity V3 PBKDF2
        try
        {
            var idResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, providedPassword);
            if (idResult == PasswordVerificationResult.Success)
            {
                return (true, false);
            }
            if (idResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                return (true, true);
            }
        }
        catch
        {
            // Not a valid Identity V3 payload, fall through to legacy checks
        }

        // 2. Legacy: BCrypt ($2a$, $2b$, $2y$)
        if (user.PasswordHash.StartsWith("$2a$") || user.PasswordHash.StartsWith("$2b$") || user.PasswordHash.StartsWith("$2y$"))
        {
            try
            {
                if (BCrypt.Net.BCrypt.Verify(providedPassword, user.PasswordHash))
                {
                    return (true, true);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("[DEBUG] BCrypt verification error: {Msg}", ex.Message);
            }
        }

        // 3. Legacy: 64-character SHA-256 hex string
        if (user.PasswordHash.Length == 64 && IsHexString(user.PasswordHash))
        {
            var computedSha = ComputeSha256Hash(providedPassword);
            if (string.Equals(computedSha, user.PasswordHash, StringComparison.OrdinalIgnoreCase))
            {
                return (true, true);
            }
        }

        // 4. Legacy: Plain text fallback (for development/seed edge cases)
        if (string.Equals(user.PasswordHash, providedPassword, StringComparison.Ordinal))
        {
            return (true, true);
        }

        return (false, false);
    }

    private static bool IsHexString(string input)
    {
        return input.All(c => (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'));
    }

    public async Task<(bool Success, string? Error, AuthResponseDto? Data)> RefreshTokenAsync(
        string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return (false, "Refresh token is required", null);
        }

        var user = await _userRepository.GetByRefreshTokenAsync(refreshToken);
        if (user == null)
        {
            return (false, "Invalid or expired refresh token", null);
        }

        var existingToken = user.RefreshTokens.FirstOrDefault(rt => rt.Token == refreshToken);
        if (existingToken == null || !existingToken.IsActive)
        {
            return (false, "Invalid or expired refresh token", null);
        }

        existingToken.RevokedAtUtc = DateTime.UtcNow;

        var (accessToken, expiresAt) = GenerateJwtToken(user);
        var newRefreshToken = GenerateRefreshToken();
        user.RefreshTokens.Add(newRefreshToken);

        await _userRepository.UpdateAsync(user);

        var response = new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = newRefreshToken.Token,
            ExpiresAt = expiresAt,
            User = MapToProfile(user)
        };

        return (true, null, response);
    }

    public async Task<(bool Success, string? Error)> LogoutAsync(string? refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return (true, null);
        }

        var user = await _userRepository.GetByRefreshTokenAsync(refreshToken);
        if (user != null)
        {
            var token = user.RefreshTokens.FirstOrDefault(rt => rt.Token == refreshToken);
            if (token != null)
            {
                token.RevokedAtUtc = DateTime.UtcNow;
                await _userRepository.UpdateAsync(user);
            }
        }

        return (true, null);
    }

    public async Task<(bool Success, string Message)> ForgotPasswordAsync(string email, string hostname)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(normalizedEmail);

        if (user == null)
        {
            return (true, "If an account exists with this email, a password reset link has been sent.");
        }

        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        user.PasswordResetTokenHash = ComputeSha256Hash(rawToken);
        user.PasswordResetExpiresUtc = DateTime.UtcNow.AddHours(2);

        await _userRepository.UpdateAsync(user);

        var resetUrl = $"https://{hostname}/reset-password?token={rawToken}";
        _ = _emailService.SendPasswordResetEmailAsync(user.Email, user.Name, resetUrl, CurrentSite.SiteName);

        return (true, "If an account exists with this email, a password reset link has been sent.");
    }

    public async Task<(bool Success, string? Error)> ResetPasswordAsync(string rawToken, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(rawToken) || string.IsNullOrWhiteSpace(newPassword))
        {
            return (false, "Invalid token or password");
        }

        var tokenHash = ComputeSha256Hash(rawToken);
        var user = await _userRepository.GetByResetTokenHashAsync(tokenHash);

        if (user == null || user.PasswordResetExpiresUtc == null || user.PasswordResetExpiresUtc < DateTime.UtcNow)
        {
            return (false, "Password reset link is invalid or has expired.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetExpiresUtc = null;
        user.FailedLoginAttempts = 0;
        user.LockoutEndUtc = null;

        await _userRepository.UpdateAsync(user);

        return (true, null);
    }

    public async Task<(bool Success, string? Error, UserProfileDto? Data)> GetMeAsync(string userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return (false, "User profile not found", null);
        }

        return (true, null, MapToProfile(user));
    }

    private (string Token, DateTime ExpiresAt) GenerateJwtToken(User user)
    {
        var site = CurrentSite;
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(site.JwtSigningKey);
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtExpiryMinutes);

        // Canonicalize role claim so [Authorize(Roles = "Admin")] always matches
        var canonicalRole = string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase)
            ? "Admin"
            : string.Equals(user.Role, "superadmin", StringComparison.OrdinalIgnoreCase)
                ? "SuperAdmin"
                : user.Role ?? "user";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id ?? ""),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Name ?? "User"),
            new(ClaimTypes.Role, canonicalRole),
            new("role", canonicalRole),
            new("websiteId", site.WebsiteId),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = site.JwtIssuer,
            Audience = site.JwtAudience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return (tokenHandler.WriteToken(token), expiresAt);
    }

    private RefreshToken GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return new RefreshToken
        {
            Token = Convert.ToBase64String(randomBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('='),
            ExpiresUtc = DateTime.UtcNow.AddDays(_refreshExpiryDays),
            CreatedAtUtc = DateTime.UtcNow,
        };
    }

    private static string ComputeSha256Hash(string rawData)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static UserProfileDto MapToProfile(User user)
    {
        return new UserProfileDto
        {
            Id = user.Id ?? "",
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            WebsiteId = user.WebsiteId,
            CreatedAt = user.CreatedAt,
        };
    }
}
