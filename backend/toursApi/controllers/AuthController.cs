using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/auth")]
[Route("api/auth/v1")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebsiteContext _websiteContext;
    private readonly IRateLimiterService _rateLimiter;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        IWebsiteContext websiteContext,
        IRateLimiterService rateLimiter,
        IWebHostEnvironment environment,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _websiteContext = websiteContext;
        _rateLimiter = rateLimiter;
        _environment = environment;
        _logger = logger;
    }

    // ─── 1. Register ────────────────────────────────────────────────────────────
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var clientIp = GetClientIp();
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;
        var userAgent = Request.Headers.UserAgent.ToString();

        _logger.LogInformation("[AUTH] POST /register - Hostname: {Hostname}, WebsiteId: {WebsiteId}, IP: {IP}",
            hostname, websiteId, clientIp);

        // Rate limiting on registration
        if (!_rateLimiter.IsAllowed(websiteId, clientIp, "register", maxRequests: 10, windowSeconds: 60))
        {
            _logger.LogWarning("[AUTH] POST /register - Rate limit exceeded for site {WebsiteId}, IP: {IP}", websiteId, clientIp);
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { success = false, error = "Too many registration attempts. Please wait a minute before trying again." });
        }

        if (!ModelState.IsValid)
        {
            var errors = ExtractModelStateErrors();
            var firstError = errors.Values.SelectMany(v => v).FirstOrDefault() ?? "Invalid registration data";
            return BadRequest(new { success = false, error = firstError, errors });
        }

        var (success, error, data) = await _authService.RegisterAsync(dto, clientIp, hostname, userAgent);
        if (!success)
        {
            if (error?.Contains("already exists", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Conflict(new
                {
                    success = false,
                    error = "An account with this email address already exists on this website. Please sign in or use forgot password.",
                    errors = new Dictionary<string, string[]>
                    {
                        { "email", new[] { "An account with this email address already exists." } }
                    }
                });
            }

            return BadRequest(new { success = false, error });
        }

        _logger.LogInformation("[AUTH] Registration succeeded for user: {UserId} on tenant {WebsiteId}", data?.User?.Id, websiteId);
        return StatusCode(StatusCodes.Status201Created, new { success = true, data });
    }

    // ─── 2. Login ───────────────────────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var clientIp = GetClientIp();
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;
        var deviceInfo = dto.DeviceInfo ?? Request.Headers.UserAgent.ToString();

        _logger.LogInformation("[AUTH] POST /login - Hostname: {Hostname}, WebsiteId: {WebsiteId}, IP: {IP}",
            hostname, websiteId, clientIp);

        var maxLoginAttempts = _environment.IsDevelopment() ? 100 : 20;
        if (!_rateLimiter.IsAllowed(websiteId, clientIp, "login", maxRequests: maxLoginAttempts, windowSeconds: 60))
        {
            _logger.LogWarning("[AUTH] POST /login - Rate limit exceeded for IP: {IP}", clientIp);
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { success = false, error = "Too many login attempts. Please wait a minute and try again." });
        }

        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { success = false, error = "Email and password are required" });
        }

        var (success, error, data) = await _authService.LoginAsync(dto, clientIp, deviceInfo);
        if (!success)
        {
            if (error?.Contains("locked", StringComparison.OrdinalIgnoreCase) == true)
            {
                return StatusCode(StatusCodes.Status423Locked, new { success = false, error });
            }
            return Unauthorized(new { success = false, error });
        }

        _logger.LogInformation("[AUTH] Login succeeded for user: {UserId}", data?.User?.Id);
        return Ok(new { success = true, data });
    }

    // ─── 3. Refresh Token ───────────────────────────────────────────────────────
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
    {
        var clientIp = GetClientIp();
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;
        var deviceInfo = dto.DeviceInfo ?? Request.Headers.UserAgent.ToString();

        _logger.LogInformation("[AUTH] POST /refresh - Hostname: {Hostname}, WebsiteId: {WebsiteId}", hostname, websiteId);

        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            return BadRequest(new { success = false, error = "Refresh token is required" });
        }

        var (success, error, data) = await _authService.RefreshTokenAsync(dto.RefreshToken, clientIp, deviceInfo);
        if (!success)
        {
            return Unauthorized(new { success = false, error });
        }

        return Ok(new { success = true, data });
    }

    // ─── 4. Logout ──────────────────────────────────────────────────────────────
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutDto? dto)
    {
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[AUTH] POST /logout - Hostname: {Hostname}, WebsiteId: {WebsiteId}", hostname, websiteId);

        await _authService.LogoutAsync(dto?.RefreshToken);
        return Ok(new { success = true, message = "Successfully logged out" });
    }

    // ─── 5. Verify Email (POST confirmation) ────────────────────────────────────
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
    {
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[AUTH] POST /verify-email - WebsiteId: {WebsiteId}", websiteId);

        if (string.IsNullOrWhiteSpace(dto.Token))
        {
            return BadRequest(new { success = false, error = "Verification token is required" });
        }

        var (success, error) = await _authService.VerifyEmailAsync(dto.Token);
        if (!success)
        {
            return BadRequest(new { success = false, error });
        }

        return Ok(new { success = true, message = "Your email address has been successfully verified. Your account is active and past bookings have been linked." });
    }

    // ─── 6. Resend Verification Email ───────────────────────────────────────────
    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationDto dto)
    {
        var clientIp = GetClientIp();
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        // Rate limit: max 3 per hour per email + IP
        var rateKey = $"resend_verif_{dto.Email?.Trim().ToLowerInvariant()}_{clientIp}";
        if (!_rateLimiter.IsAllowed(websiteId, rateKey, "resend-verification", maxRequests: 3, windowSeconds: 3600))
        {
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { success = false, error = "Too many verification requests. Please wait an hour before requesting another email." });
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { success = false, error = "Email is required" });
        }

        var (success, message) = await _authService.ResendVerificationAsync(dto.Email, hostname);
        return Ok(new { success, message });
    }

    // ─── 7. Forgot Password ─────────────────────────────────────────────────────
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var clientIp = GetClientIp();
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        // Rate limit: max 5 per 15 minutes per IP
        if (!_rateLimiter.IsAllowed(websiteId, clientIp, "forgot-password", maxRequests: 5, windowSeconds: 900))
        {
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { success = false, error = "Too many password reset requests. Please wait a few minutes before trying again." });
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { success = false, error = "Email is required" });
        }

        var (success, message) = await _authService.ForgotPasswordAsync(dto.Email, hostname);
        return Ok(new { success, message });
    }

    // ─── 8. Reset Password (POST confirmation) ──────────────────────────────────
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[AUTH] POST /reset-password - Hostname: {Hostname}, WebsiteId: {WebsiteId}", hostname, websiteId);

        if (!ModelState.IsValid)
        {
            var errors = ExtractModelStateErrors();
            var firstError = errors.Values.SelectMany(v => v).FirstOrDefault() ?? "Invalid password reset data";
            return BadRequest(new { success = false, error = firstError, errors });
        }

        var (success, error) = await _authService.ResetPasswordAsync(dto.Token, dto.NewPassword);
        if (!success)
        {
            return BadRequest(new { success = false, error });
        }

        return Ok(new { success = true, message = "Password has been successfully reset. Please log in with your new password." });
    }

    // ─── 9. Current User Profile ────────────────────────────────────────────────
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;
        var tokenWebsiteId = User.FindFirst("websiteId")?.Value ?? User.FindFirst("siteId")?.Value;

        if (!string.Equals(tokenWebsiteId, currentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("[AUTH] GET /me - Forbidden: Token website '{TokenSite}' does not match request website '{RequestSite}'",
                tokenWebsiteId, currentWebsiteId);
            return StatusCode(StatusCodes.Status403Forbidden,
                new { success = false, error = "Access denied: session belongs to a different website" });
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { success = false, error = "Invalid user session" });
        }

        var (success, error, data) = await _authService.GetMeAsync(userId);
        if (!success)
        {
            return NotFound(new { success = false, error });
        }

        return Ok(new { success = true, data });
    }

    // ─── 10. Update Profile ─────────────────────────────────────────────────────
    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;
        var tokenWebsiteId = User.FindFirst("websiteId")?.Value ?? User.FindFirst("siteId")?.Value;

        if (!string.Equals(tokenWebsiteId, currentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new { success = false, error = "Access denied: session belongs to a different website" });
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { success = false, error = "Invalid user session" });
        }

        if (!ModelState.IsValid)
        {
            var errors = ExtractModelStateErrors();
            var firstError = errors.Values.SelectMany(v => v).FirstOrDefault() ?? "Invalid profile data";
            return BadRequest(new { success = false, error = firstError, errors });
        }

        var (success, error, data) = await _authService.UpdateProfileAsync(userId, dto);
        if (!success)
        {
            return BadRequest(new { success = false, error });
        }

        return Ok(new { success = true, data });
    }

    // ─── 11. Change Password ────────────────────────────────────────────────────
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;
        var tokenWebsiteId = User.FindFirst("websiteId")?.Value ?? User.FindFirst("siteId")?.Value;

        if (!string.Equals(tokenWebsiteId, currentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new { success = false, error = "Access denied: session belongs to a different website" });
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { success = false, error = "Invalid user session" });
        }

        if (!ModelState.IsValid)
        {
            var errors = ExtractModelStateErrors();
            var firstError = errors.Values.SelectMany(v => v).FirstOrDefault() ?? "Invalid password data";
            return BadRequest(new { success = false, error = firstError, errors });
        }

        var (success, error) = await _authService.ChangePasswordAsync(userId, dto);
        if (!success)
        {
            return BadRequest(new { success = false, error });
        }

        return Ok(new { success = true, message = "Your password has been successfully updated. All other active sessions have been signed out." });
    }

    // ─── 12. Delete Account (Apple App Store / GDPR Compliance) ─────────────────
    [Authorize]
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteAccount()
    {
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;
        var tokenWebsiteId = User.FindFirst("websiteId")?.Value ?? User.FindFirst("siteId")?.Value;

        if (!string.Equals(tokenWebsiteId, currentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status403Forbidden,
                new { success = false, error = "Access denied: session belongs to a different website" });
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { success = false, error = "Invalid user session" });
        }

        var (success, error) = await _authService.DeleteAccountAsync(userId);
        if (!success)
        {
            return BadRequest(new { success = false, error });
        }

        return Ok(new { success = true, message = "Your account has been deleted and all personal data anonymized. Past bookings remain stored for fiscal records." });
    }

    // ─── Development Testing Endpoints ──────────────────────────────────────────
    [HttpPost("dev-reset-lockout")]
    public async Task<IActionResult> DevResetLockout([FromBody] ResetLockoutDto dto)
    {
        if (!_environment.IsDevelopment())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Only available in Development mode" });
        }

        var (success, error) = await _authService.ResetLockoutAsync(dto.Email);
        if (!success)
        {
            return BadRequest(new { success = false, error });
        }

        return Ok(new { success = true, message = $"Lockout reset for {dto.Email}" });
    }

    [HttpPost("dev-reset-ratelimit")]
    public IActionResult DevResetRateLimit()
    {
        if (!_environment.IsDevelopment())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Only available in Development mode" });
        }

        var clientIp = GetClientIp();
        var websiteId = _websiteContext.CurrentWebsiteId;
        _rateLimiter.Reset(websiteId, clientIp);

        return Ok(new { success = true, message = $"Rate limit counters cleared for IP {clientIp} on site {websiteId}" });
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────
    private string GetClientIp()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded) && !string.IsNullOrWhiteSpace(forwarded))
        {
            return forwarded.ToString().Split(',')[0].Trim();
        }
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private string GetHostnameHeader()
    {
        if (Request.Headers.TryGetValue("X-Website-Hostname", out var h) && !string.IsNullOrWhiteSpace(h))
        {
            return h.ToString();
        }
        return Request.Host.Host;
    }

    private Dictionary<string, string[]> ExtractModelStateErrors()
    {
        return ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(
                kvp => JsonNamingPolicy.CamelCase.ConvertName(kvp.Key.Replace("$.", "")),
                kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
            );
    }
}

public class ResetLockoutDto
{
    public required string Email { get; set; }
}
