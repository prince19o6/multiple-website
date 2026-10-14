using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
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

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var clientIp = GetClientIp();
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[DEBUG] POST /register - Hostname: {Hostname}, WebsiteId: {WebsiteId}, IP: {IP}",
            hostname, websiteId, clientIp);

        if (!_rateLimiter.IsAllowed(websiteId, clientIp, "register", maxRequests: 10, windowSeconds: 60))
        {
            _logger.LogWarning("[DEBUG] POST /register - Rate limit exceeded for website: {WebsiteId}, IP: {IP}", websiteId, clientIp);
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { success = false, error = "Too many registration attempts. Please wait a minute before trying again." });
        }

        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => JsonNamingPolicy.CamelCase.ConvertName(kvp.Key.Replace("$.", "")),
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );
            var firstError = errors.Values.SelectMany(v => v).FirstOrDefault() ?? "Invalid registration data";
            return BadRequest(new { success = false, error = firstError, errors });
        }

        var (success, error, data) = await _authService.RegisterAsync(dto, hostname);
        if (!success)
        {
            _logger.LogInformation("[DEBUG] POST /register - Failed, Reason: {Error}", error);
            if (error?.Contains("already exists", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Conflict(new
                {
                    success = false,
                    error,
                    errors = new Dictionary<string, string[]>
                    {
                        { "email", new[] { error } }
                    }
                });
            }

            return BadRequest(new { success = false, error });
        }

        _logger.LogInformation("[DEBUG] POST /register - Status: 200 OK, User: {UserId}", data?.User?.Id);
        return Ok(new { success = true, data });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var clientIp = GetClientIp();
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[DEBUG] POST /login - Hostname: {Hostname}, WebsiteId: {WebsiteId}, IP: {IP}",
            hostname, websiteId, clientIp);

        // Higher limit in Development (100 req/min) to avoid accidental developer lockouts
        var maxLoginAttempts = _environment.IsDevelopment() ? 100 : 20;

        if (!_rateLimiter.IsAllowed(websiteId, clientIp, "login", maxRequests: maxLoginAttempts, windowSeconds: 60))
        {
            _logger.LogWarning("[DEBUG] POST /login - Rate limit exceeded for IP: {IP}", clientIp);
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { success = false, error = "Too many login attempts. Please wait a minute and try again." });
        }

        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { success = false, error = "Email and password are required" });
        }

        var (success, error, data) = await _authService.LoginAsync(dto, clientIp);
        if (!success)
        {
            _logger.LogInformation("[DEBUG] POST /login - Status: 401 Unauthorized, Reason: {Error}", error);
            return Unauthorized(new { success = false, error });
        }

        _logger.LogInformation("[DEBUG] POST /login - Status: 200 OK, User: {UserId}, Role: {Role}",
            data?.User?.Id, data?.User?.Role);
        return Ok(new { success = true, data });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
    {
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[DEBUG] POST /refresh - Hostname: {Hostname}, WebsiteId: {WebsiteId}",
            hostname, websiteId);

        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            return BadRequest(new { success = false, error = "Refresh token is required" });
        }

        var (success, error, data) = await _authService.RefreshTokenAsync(dto.RefreshToken);
        if (!success)
        {
            _logger.LogInformation("[DEBUG] POST /refresh - Status: 401 Unauthorized, Reason: {Error}", error);
            return Unauthorized(new { success = false, error });
        }

        _logger.LogInformation("[DEBUG] POST /refresh - Status: 200 OK");
        return Ok(new { success = true, data });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutDto? dto)
    {
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[DEBUG] POST /logout - Hostname: {Hostname}, WebsiteId: {WebsiteId}",
            hostname, websiteId);

        await _authService.LogoutAsync(dto?.RefreshToken);

        _logger.LogInformation("[DEBUG] POST /logout - Status: 200 OK");
        return Ok(new { success = true, message = "Successfully logged out" });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[DEBUG] POST /forgot-password - Hostname: {Hostname}, WebsiteId: {WebsiteId}",
            hostname, websiteId);

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { success = false, error = "Email is required" });
        }

        var (success, message) = await _authService.ForgotPasswordAsync(dto.Email, hostname);
        return Ok(new { success, message });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var hostname = GetHostnameHeader();
        var websiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[DEBUG] POST /reset-password - Hostname: {Hostname}, WebsiteId: {WebsiteId}",
            hostname, websiteId);

        if (!ModelState.IsValid)
        {
            var firstError = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .FirstOrDefault()
                ?? "Invalid reset data";
            return BadRequest(new { success = false, error = firstError });
        }

        var (success, error) = await _authService.ResetPasswordAsync(dto.Token, dto.NewPassword);
        if (!success)
        {
            _logger.LogInformation("[DEBUG] POST /reset-password - Status: 400 Bad Request, Reason: {Error}", error);
            return BadRequest(new { success = false, error });
        }

        _logger.LogInformation("[DEBUG] POST /reset-password - Status: 200 OK");
        return Ok(new { success = true, message = "Password has been successfully reset. Please log in with your new password." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var hostname = GetHostnameHeader();
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;

        _logger.LogInformation("[DEBUG] GET /me - Hostname: {Hostname}, WebsiteId: {WebsiteId}",
            hostname, currentWebsiteId);

        var tokenWebsiteId = User.FindFirst("websiteId")?.Value;
        if (!string.Equals(tokenWebsiteId, currentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("[DEBUG] GET /me - Forbidden: Token website '{TokenSite}' does not match request website '{RequestSite}'",
                tokenWebsiteId, currentWebsiteId);
            return StatusCode(StatusCodes.Status403Forbidden,
                new { success = false, error = "Access denied: session belongs to a different website" });
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { success = false, error = "Invalid user token" });
        }

        var (success, error, data) = await _authService.GetMeAsync(userId);
        if (!success)
        {
            return NotFound(new { success = false, error });
        }

        _logger.LogInformation("[DEBUG] GET /me - Status: 200 OK, User: {UserId}", data?.Id);
        return Ok(new { success = true, data });
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
}

public class ResetLockoutDto
{
    public required string Email { get; set; }
}
