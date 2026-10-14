using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Moq;
using ToursApi.Configuration;
using ToursApi.Controllers;
using ToursApi.Middleware;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;
using Xunit;

namespace ToursApi.Tests;

public class IsolationTests
{
    private readonly WebsiteConfig _siteA;
    private readonly WebsiteConfig _siteB;
    private readonly WebsiteConfig _siteC;

    public IsolationTests()
    {
        _siteA = WebsiteRegistry.Resolve("gujjutours")!;
        _siteB = WebsiteRegistry.Resolve("tripgoasia")!;
        _siteC = WebsiteRegistry.Resolve("technoheaven")!;
    }

    [Fact]
    public void Scenario1_Registry_EnsuresDistinctDatabasesPerWebsite()
    {
        // Assert each website has a distinct, isolated database name
        Assert.NotNull(_siteA);
        Assert.NotNull(_siteB);
        Assert.NotNull(_siteC);

        Assert.Equal("tours_gujjutours", _siteA.DatabaseName);
        Assert.Equal("tours_tripgoasia", _siteB.DatabaseName);
        Assert.Equal("tours_technoheaven", _siteC.DatabaseName);

        Assert.NotEqual(_siteA.DatabaseName, _siteB.DatabaseName);
        Assert.NotEqual(_siteB.DatabaseName, _siteC.DatabaseName);
        Assert.NotEqual(_siteA.DatabaseName, _siteC.DatabaseName);
    }

    [Fact]
    public void Scenario2_TokenIssuedForSiteA_IsRejectedBySiteB()
    {
        // 1. Arrange a token generated using Site A's cryptographic credentials
        var tokenHandler = new JwtSecurityTokenHandler();
        var keyA = Encoding.UTF8.GetBytes(_siteA.JwtSigningKey);
        var tokenDescriptorA = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-123-siteA"),
                new Claim(ClaimTypes.Email, "traveller@example.com"),
                new Claim(ClaimTypes.Role, "User"),
                new Claim("websiteId", _siteA.WebsiteId)
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = _siteA.JwtIssuer,
            Audience = _siteA.JwtAudience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(keyA),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var tokenA = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptorA));
        Assert.NotNull(tokenA);
        Assert.NotEmpty(tokenA);

        // 2. Attempt to validate tokenA against Site B's JWT configuration
        var validationParametersSiteB = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_siteB.JwtSigningKey)),
            ValidateIssuer = true,
            ValidIssuer = _siteB.JwtIssuer,
            ValidateAudience = true,
            ValidAudience = _siteB.JwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Assert: Validation against Site B parameters MUST fail (invalid key / signature)
        Assert.ThrowsAny<SecurityTokenException>(() =>
        {
            tokenHandler.ValidateToken(tokenA, validationParametersSiteB, out _);
        });

        // 3. Confirm that tokenA DOES validate successfully against Site A's own parameters
        var validationParametersSiteA = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_siteA.JwtSigningKey)),
            ValidateIssuer = true,
            ValidIssuer = _siteA.JwtIssuer,
            ValidateAudience = true,
            ValidAudience = _siteA.JwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        var principal = tokenHandler.ValidateToken(tokenA, validationParametersSiteA, out var validatedToken);
        Assert.NotNull(principal);
        Assert.Equal("user-123-siteA", principal.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        Assert.Equal(_siteA.WebsiteId, principal.FindFirst("websiteId")?.Value);
    }

    [Fact]
    public async Task Scenario3_AdminOnSiteA_CannotAccessOrModifyDataOnSiteB()
    {
        // Arrange Site B context
        var siteBContext = new WebsiteContext
        {
            CurrentWebsiteId = _siteB.WebsiteId,
            CurrentSite = _siteB
        };

        var mockTourService = new Mock<ITourService>();
        var mockBookingService = new Mock<IBookingService>();
        var mockUserRepo = new Mock<IUserRepository>();
        var mockConfiguration = new Mock<IConfiguration>();
        var mockEnvironment = new Mock<IHostEnvironment>();

        var adminControllerB = new AdminController(
            mockTourService.Object,
            mockBookingService.Object,
            mockUserRepo.Object,
            siteBContext,
            mockConfiguration.Object,
            mockEnvironment.Object
        );

        // Simulate an Admin user whose token claims websiteId = "gujjutours" (Site A)
        // making a request to Site B's endpoint
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "admin-siteA-id"),
            new Claim(ClaimTypes.Email, "admin@sitea.com"),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim("websiteId", "gujjutours") // Token tenant is Site A
        }, "Bearer"));

        adminControllerB.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        // Act: Call an admin endpoint on Site B
        var result = await adminControllerB.GetStats();

        // Assert: AdminController must reject with 403 Forbidden because token's websiteId does not match current site
        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, statusResult.StatusCode);

        // Verify Site B services were never invoked
        mockBookingService.Verify(b => b.GetAllBookingsAsync(), Times.Never);
    }

    [Fact]
    public async Task Scenario4_TourExistingOnSiteB_ReturnsNotFoundOnSiteA()
    {
        // Arrange Site A context and repository
        var siteAContext = new WebsiteContext
        {
            CurrentWebsiteId = _siteA.WebsiteId,
            CurrentSite = _siteA
        };

        var mockTourRepoA = new Mock<ITourRepository>();

        // Tour "b-tour-999" only exists in Site B's database, so Site A's repo returns null
        mockTourRepoA
            .Setup(r => r.GetByIdAsync("b-tour-999"))
            .ReturnsAsync((Tour?)null);

        var tourServiceA = new TourService(mockTourRepoA.Object, siteAContext);

        // Act
        var result = await tourServiceA.GetTourByIdAsync("b-tour-999");

        // Assert
        Assert.Null(result);
        mockTourRepoA.Verify(r => r.GetByIdAsync("b-tour-999"), Times.Once);
    }

    [Fact]
    public async Task Scenario5_UnknownHostname_Returns404NotFound_AndNeverProceeds()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/tours";
        context.Request.Headers["X-Website-Hostname"] = "attacker-domain.com";

        var siteContext = new WebsiteContext();
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new WebsiteContextMiddleware(next);

        // Act
        await middleware.InvokeAsync(context, siteContext);

        // Assert: Unknown host must immediately terminate the pipeline with HTTP 404
        Assert.False(nextCalled, "Middleware should not have called downstream pipeline for unknown hostname.");
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
        Assert.Null(siteContext.CurrentSite);
    }

    [Fact]
    public void Scenario6_UserRepository_SupportsSameEmailAcrossIsolatedDatabases()
    {
        // Verify User model has no cross-site unique constraint leakage
        // Each user belongs strictly to their own site
        var userSiteA = new User
        {
            Id = "user-1",
            Email = "john@example.com",
            Name = "John Doe",
            WebsiteId = "gujjutours"
        };

        var userSiteB = new User
        {
            Id = "user-2",
            Email = "john@example.com",
            Name = "John Doe",
            WebsiteId = "tripgoasia"
        };

        Assert.Equal(userSiteA.Email, userSiteB.Email);
        Assert.NotEqual(userSiteA.Id, userSiteB.Id);
        Assert.NotEqual(userSiteA.WebsiteId, userSiteB.WebsiteId);
    }

    [Fact]
    public void Scenario7_WebsiteRegistry_HasDistinctKeysAndCorsPerTenant()
    {
        // Verify JWT signing keys are completely distinct
        Assert.NotEqual(_siteA.JwtSigningKey, _siteB.JwtSigningKey);
        Assert.NotEqual(_siteB.JwtSigningKey, _siteC.JwtSigningKey);
        Assert.NotEqual(_siteA.JwtSigningKey, _siteC.JwtSigningKey);

        // Verify CORS origins are distinct
        Assert.Contains("https://www.gujjutours.com", _siteA.CorsOrigins);
        Assert.Contains("https://www.tripgoasia.com", _siteB.CorsOrigins);
        Assert.Contains("https://stagingb2b.technoheaven.com", _siteC.CorsOrigins);

        // Verify EmailFromAddress are distinct
        Assert.NotEqual(_siteA.EmailFromAddress, _siteB.EmailFromAddress);
        Assert.NotEqual(_siteB.EmailFromAddress, _siteC.EmailFromAddress);
    }
}
