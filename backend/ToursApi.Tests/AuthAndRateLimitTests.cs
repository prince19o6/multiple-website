using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Moq;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;
using Xunit;

namespace ToursApi.Tests;

public class AuthAndRateLimitTests
{
    private readonly WebsiteConfig _site;
    private readonly Mock<IUserRepository> _mockUserRepo;
    private readonly Mock<IBookingRepository> _mockBookingRepo;
    private readonly Mock<IUserCodeGenerator> _mockCodeGenerator;
    private readonly Mock<IEmailOutboxService> _mockOutboxService;
    private readonly Mock<IEmailTemplateRenderer> _mockTemplateRenderer;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<IWebsiteContext> _mockWebsiteContext;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly Mock<ILogger<AuthService>> _mockLogger;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly AuthService _authService;

    public AuthAndRateLimitTests()
    {
        _site = WebsiteRegistry.Resolve("gujjutours")!;
        _mockUserRepo = new Mock<IUserRepository>();
        _mockBookingRepo = new Mock<IBookingRepository>();
        _mockCodeGenerator = new Mock<IUserCodeGenerator>();
        _mockOutboxService = new Mock<IEmailOutboxService>();
        _mockTemplateRenderer = new Mock<IEmailTemplateRenderer>();
        _mockEmailService = new Mock<IEmailService>();
        _mockWebsiteContext = new Mock<IWebsiteContext>();
        _mockConfig = new Mock<IConfiguration>();
        _mockLogger = new Mock<ILogger<AuthService>>();
        _passwordHasher = new PasswordHasher<User>();

        _mockWebsiteContext.Setup(c => c.CurrentSite).Returns(_site);
        _mockWebsiteContext.Setup(c => c.CurrentWebsiteId).Returns(_site.WebsiteId);

        _mockConfig.Setup(c => c.GetSection("Jwt:ExpiryMinutes").Value).Returns("60");
        _mockConfig.Setup(c => c.GetSection("Jwt:RefreshExpiryDays").Value).Returns("30");

        _authService = new AuthService(
            _mockUserRepo.Object,
            _mockBookingRepo.Object,
            _mockCodeGenerator.Object,
            _mockOutboxService.Object,
            _mockTemplateRenderer.Object,
            _mockWebsiteContext.Object,
            _mockConfig.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public void PasswordHasher_HashesAndVerifiesPasswordCorrectly()
    {
        var user = new User { Email = "test@example.com" };
        var password = "SecurePassword123!";

        var hash = _passwordHasher.HashPassword(user, password);
        Assert.NotNull(hash);
        Assert.NotEmpty(hash);
        Assert.NotEqual(password, hash);

        var verifySuccess = _passwordHasher.VerifyHashedPassword(user, hash, password);
        Assert.Equal(PasswordVerificationResult.Success, verifySuccess);

        var verifyFail = _passwordHasher.VerifyHashedPassword(user, hash, "WrongPassword456!");
        Assert.Equal(PasswordVerificationResult.Failed, verifyFail);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsJwtWithCorrectWebsiteIdClaim()
    {
        // Arrange
        var user = new User
        {
            Id = "user-abc-123",
            Email = "traveller@gujjutours.com",
            Name = "Aarav Patel",
            Role = "User",
            WebsiteId = _site.WebsiteId,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, "MySecretPass!99");

        _mockUserRepo.Setup(r => r.GetByEmailAsync("traveller@gujjutours.com")).ReturnsAsync(user);

        var loginDto = new LoginDto
        {
            Email = "traveller@gujjutours.com",
            Password = "MySecretPass!99"
        };

        // Act
        var result = await _authService.LoginAsync(loginDto, "www.gujjutours.com");

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.NotEmpty(result.Data.Token);
        Assert.Equal("traveller@gujjutours.com", result.Data.User.Email);

        // Inspect the generated JWT claims
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result.Data.Token);

        Assert.Equal(_site.JwtIssuer, jwt.Issuer);
        Assert.Contains(jwt.Audiences, aud => aud == _site.JwtAudience);
        var idClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid" || c.Type.EndsWith("nameidentifier"));
        Assert.NotNull(idClaim);
        Assert.Equal("user-abc-123", idClaim.Value);
        Assert.Equal(_site.WebsiteId, jwt.Claims.First(c => c.Type == "websiteId").Value);
        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role" || c.Type.EndsWith("role"));
        Assert.NotNull(roleClaim);
        Assert.Equal("User", roleClaim.Value);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_FailsWithUnauthorized()
    {
        // Arrange
        var user = new User
        {
            Id = "user-abc-123",
            Email = "traveller@gujjutours.com",
            Name = "Aarav Patel",
            Role = "User",
            WebsiteId = _site.WebsiteId
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, "CorrectPassword!");

        _mockUserRepo.Setup(r => r.GetByEmailAsync("traveller@gujjutours.com")).ReturnsAsync(user);

        var loginDto = new LoginDto
        {
            Email = "traveller@gujjutours.com",
            Password = "WrongPasswordIncorrect"
        };

        // Act
        var result = await _authService.LoginAsync(loginDto, "www.gujjutours.com");

        // Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.Contains("Invalid email or password", result.Error);
    }

    [Fact]
    public void RateLimiterService_BlocksRequestsExceedingMaxLimit()
    {
        // Arrange
        var rateLimiter = new RateLimiterService();
        var clientIp = "192.168.1.100";
        var siteId = "gujjutours";
        var action = "login";
        int maxRequests = 5;

        // Act & Assert: First 5 requests must succeed
        for (int i = 0; i < maxRequests; i++)
        {
            var allowed = rateLimiter.IsAllowed(siteId, clientIp, action, maxRequests: maxRequests, windowSeconds: 60);
            Assert.True(allowed, $"Request {i + 1} should be allowed within limit");
        }

        // 6th request must be blocked
        var blocked = rateLimiter.IsAllowed(siteId, clientIp, action, maxRequests: maxRequests, windowSeconds: 60);
        Assert.False(blocked, "Request exceeding maxRequests must be blocked");

        // Reset for this IP
        rateLimiter.Reset(siteId, clientIp);
        var allowedAfterReset = rateLimiter.IsAllowed(siteId, clientIp, action, maxRequests: maxRequests, windowSeconds: 60);
        Assert.True(allowedAfterReset, "Request after rate-limiter reset should succeed");
    }

    [Fact]
    public void RateLimiterService_IsIsolatedByWebsiteId()
    {
        var rateLimiter = new RateLimiterService();
        var clientIp = "203.0.113.42";
        var action = "register";
        int maxRequests = 2;

        // Exhaust quota on Site A (gujjutours)
        Assert.True(rateLimiter.IsAllowed("gujjutours", clientIp, action, maxRequests, 60));
        Assert.True(rateLimiter.IsAllowed("gujjutours", clientIp, action, maxRequests, 60));
        Assert.False(rateLimiter.IsAllowed("gujjutours", clientIp, action, maxRequests, 60));

        // Same IP on Site B (tripgoasia) must still be allowed because quota is per-tenant!
        Assert.True(rateLimiter.IsAllowed("tripgoasia", clientIp, action, maxRequests, 60),
            "Rate limiter should isolate tenant request counts");
    }
}
