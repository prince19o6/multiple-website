using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly ITourService _tourService;
    private readonly IBookingService _bookingService;
    private readonly IUserRepository _userRepository;
    private readonly IWebsiteContext _websiteContext;
    private readonly IMongoDatabaseProvider _databaseProvider;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<AdminController> _logger;
    private readonly PasswordHasher<User> _passwordHasher;

    public AdminController(
        ITourService tourService,
        IBookingService bookingService,
        IUserRepository userRepository,
        IWebsiteContext websiteContext,
        IMongoDatabaseProvider databaseProvider,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger<AdminController> logger)
    {
        _tourService = tourService;
        _bookingService = bookingService;
        _userRepository = userRepository;
        _websiteContext = websiteContext;
        _databaseProvider = databaseProvider;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
        _passwordHasher = new PasswordHasher<User>();
    }

    private bool ValidateTenantAccess(out IActionResult? forbiddenResult)
    {
        var currentWebsiteId = _websiteContext.CurrentWebsiteId;
        var tokenWebsiteId = User.FindFirst("websiteId")?.Value;

        // No SuperAdmin bypass: Admins belong strictly to their own website database
        if (!string.Equals(tokenWebsiteId, currentWebsiteId, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("[DEBUG] Admin Access Forbidden: Token website '{TokenSite}' does not match current tenant '{TenantSite}'",
                tokenWebsiteId, currentWebsiteId);

            forbiddenResult = StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                error = "Access denied: your admin credentials do not belong to this website tenant."
            });
            return false;
        }

        forbiddenResult = null;
        return true;
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> GetStats()
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        var websiteId = _websiteContext.CurrentWebsiteId;

        try
        {
            var tours = (await _tourService.GetAllToursAsync(null, null, null, 1, 1000, null)).ToList();
            var bookings = (await _bookingService.GetAllBookingsAsync()).ToList();
            var users = await _userRepository.GetAllAsync();

            var totalTours = tours.Count;
            var totalBookings = bookings.Count;
            var pendingBookings = bookings.Count(b => string.Equals(b.Status, "pending", StringComparison.OrdinalIgnoreCase));
            var confirmedBookings = bookings.Count(b => string.Equals(b.Status, "confirmed", StringComparison.OrdinalIgnoreCase));
            var completedBookings = bookings.Count(b => string.Equals(b.Status, "completed", StringComparison.OrdinalIgnoreCase));
            var cancelledBookings = bookings.Count(b => string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase));

            var totalRevenue = bookings
                .Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                .Sum(b => b.TotalPrice);

            var totalUsers = users.Count;

            // Real DB calculations for today's bookings, pending approvals, and new users
            var todayUtc = DateTime.UtcNow.Date;
            var todayBookings = bookings.Count(b => (b.CreatedAt ?? DateTime.MinValue) >= todayUtc);
            var pendingApprovals = pendingBookings + bookings.Count(b =>
                b.CancellationRequest != null &&
                string.Equals(b.CancellationRequest.Status, "pending", StringComparison.OrdinalIgnoreCase));
            var newUsers = users.Count(u => u.CreatedAt >= todayUtc);

            // Real revenue breakdown per module
            var revenueByModule = bookings
                .Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                .GroupBy(b => string.IsNullOrWhiteSpace(b.ServiceType) ? "tour" : b.ServiceType.ToLowerInvariant())
                .ToDictionary(g => g.Key, g => Math.Round(g.Sum(b => b.TotalPrice), 2));

            var recentBookings = bookings
                .OrderByDescending(b => b.CreatedAt ?? b.StartDate)
                .Take(6)
                .Select(b => new
                {
                    id = b.Id,
                    reference = b.Reference,
                    guestName = b.GuestName,
                    email = b.Email,
                    tourName = b.TourName,
                    tourId = b.TourId,
                    serviceType = b.ServiceType,
                    totalPrice = b.TotalPrice,
                    status = b.Status,
                    travelers = b.Travelers,
                    startDate = b.StartDate,
                    createdAt = b.CreatedAt
                })
                .ToList();

            return Ok(new
            {
                success = true,
                data = new
                {
                    websiteId,
                    totalTours,
                    totalBookings,
                    pendingBookings,
                    pendingApprovals,
                    todayBookings,
                    confirmedBookings,
                    completedBookings,
                    cancelledBookings,
                    totalRevenue = Math.Round(totalRevenue, 2),
                    totalUsers,
                    newUsers,
                    revenueByModule,
                    recentBookings
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch admin stats for website {WebsiteId}", websiteId);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "Admin,admin,SuperAdmin,superadmin")]
    public async Task<IActionResult> GetAnalytics()
    {
        if (!ValidateTenantAccess(out var forbiddenResult))
        {
            return forbiddenResult!;
        }

        var websiteId = _websiteContext.CurrentWebsiteId;

        try
        {
            var tours = (await _tourService.GetAllToursAsync(null, null, null, 1, 1000, null)).ToList();
            var bookings = (await _bookingService.GetAllBookingsAsync()).ToList();

            var bookingsByStatus = bookings
                .GroupBy(b => string.IsNullOrWhiteSpace(b.Status) ? "pending" : b.Status.ToLowerInvariant())
                .Select(g => new { status = g.Key, count = g.Count(), revenue = Math.Round(g.Sum(b => b.TotalPrice), 2) })
                .ToList();

            var toursByCategory = tours
                .GroupBy(t => string.IsNullOrWhiteSpace(t.Category) ? "General" : t.Category)
                .Select(g => new { category = g.Key, count = g.Count() })
                .OrderByDescending(x => x.count)
                .ToList();

            var tourBookingStats = bookings
                .Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                .GroupBy(b => b.TourName ?? "Tour")
                .Select(g => new
                {
                    name = g.Key,
                    bookingsCount = g.Count(),
                    revenue = Math.Round(g.Sum(b => b.TotalPrice), 2)
                })
                .OrderByDescending(x => x.revenue)
                .Take(5)
                .ToList();

            var revenueOverTime = bookings
                .Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase) && b.CreatedAt.HasValue)
                .GroupBy(b => b.CreatedAt!.Value.ToString("MMM yyyy"))
                .Select(g => new
                {
                    period = g.Key,
                    bookings = g.Count(),
                    revenue = Math.Round(g.Sum(b => b.TotalPrice), 2)
                })
                .ToList();

            var avgBookingValue = bookings.Any(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                ? bookings.Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase)).Average(b => b.TotalPrice)
                : 0;

            return Ok(new
            {
                success = true,
                data = new
                {
                    websiteId,
                    totalRevenue = Math.Round(bookings.Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase)).Sum(b => b.TotalPrice), 2),
                    totalBookings = bookings.Count,
                    avgBookingValue = Math.Round(avgBookingValue, 2),
                    bookingsByStatus,
                    toursByCategory,
                    topTours = tourBookingStats,
                    revenueOverTime
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch admin analytics for website {WebsiteId}", websiteId);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("seed-admin")]
    [HttpPost("create-admin")]
    public async Task<IActionResult> SeedAdmin([FromBody] SeedAdminRequestDto dto)
    {
        var websiteId = _websiteContext.CurrentWebsiteId;

        // Protected bootstrap authorization:
        // Must supply valid X-Admin-Seed-Secret matching site-specific config or env var, OR run in Development
        var configuredSecret = _configuration[$"Websites:{websiteId}:AdminSeedSecret"]
            ?? _configuration[$"ADMIN_SEED_SECRET_{websiteId.ToUpperInvariant()}"]
            ?? _configuration["AdminSeed:Secret"];

        var providedSecret = Request.Headers["X-Admin-Seed-Secret"].ToString();
        if (string.IsNullOrWhiteSpace(providedSecret) && !string.IsNullOrWhiteSpace(dto.Secret))
        {
            providedSecret = dto.Secret;
        }

        var isSecretValid = !string.IsNullOrWhiteSpace(configuredSecret) &&
            !string.IsNullOrWhiteSpace(providedSecret) &&
            string.Equals(providedSecret, configuredSecret, StringComparison.Ordinal);

        if (!isSecretValid && !_environment.IsDevelopment())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                error = "Access denied: invalid seed secret."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { success = false, error = "Email and password are required." });
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        try
        {
            var existingUser = await _userRepository.GetByEmailAsync(normalizedEmail);
            if (existingUser != null)
            {
                existingUser.Role = "Admin";
                existingUser.Status = "active";
                existingUser.IsDisabled = false;
                existingUser.FailedLoginAttempts = 0;
                existingUser.LockoutEndUtc = null;
                existingUser.PasswordHash = _passwordHasher.HashPassword(existingUser, dto.Password);
                if (!string.IsNullOrWhiteSpace(dto.Name))
                {
                    existingUser.Name = dto.Name.Trim();
                }

                await _userRepository.UpdateAsync(existingUser);

                _logger.LogInformation("[DEBUG] Admin user updated: {Email} for tenant {WebsiteId}", normalizedEmail, websiteId);

                return Ok(new
                {
                    success = true,
                    message = $"Admin account updated successfully for website '{websiteId}'.",
                    data = new
                    {
                        id = existingUser.Id,
                        name = existingUser.Name,
                        email = existingUser.Email,
                        role = existingUser.Role,
                        websiteId = existingUser.WebsiteId,
                        status = existingUser.Status
                    }
                });
            }

            var newUser = new User
            {
                WebsiteId = websiteId,
                Name = !string.IsNullOrWhiteSpace(dto.Name) ? dto.Name.Trim() : "Administrator",
                Email = normalizedEmail,
                Phone = dto.Phone,
                Role = "Admin",
                Status = "active",
                IsDisabled = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            newUser.PasswordHash = _passwordHasher.HashPassword(newUser, dto.Password);
            var created = await _userRepository.CreateAsync(newUser);

            _logger.LogInformation("[DEBUG] Admin user created: {Email} for tenant {WebsiteId}", normalizedEmail, websiteId);

            return StatusCode(StatusCodes.Status201Created, new
            {
                success = true,
                message = $"Admin account created successfully for website '{websiteId}'.",
                data = new
                {
                    id = created.Id,
                    name = created.Name,
                    email = created.Email,
                    role = created.Role,
                    websiteId = created.WebsiteId,
                    status = created.Status
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create/seed admin for website {WebsiteId}", websiteId);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("migrate-from-tours70")]
    public async Task<IActionResult> MigrateFromTours70()
    {
        if (!_environment.IsDevelopment())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Only available in Development mode" });
        }

        var websiteId = _websiteContext.CurrentWebsiteId;
        var currentDbName = _websiteContext.DatabaseName;

        try
        {
            var oldDb = _databaseProvider.GetDatabase("tours70");
            var oldUsersColl = oldDb.GetCollection<User>("users");

            // Look for any admin in old database
            var oldAdmins = await oldUsersColl.Find(Builders<User>.Filter.Or(
                Builders<User>.Filter.Eq(u => u.Role, "Admin"),
                Builders<User>.Filter.Eq(u => u.Role, "admin"),
                Builders<User>.Filter.Eq(u => u.Role, "SuperAdmin")
            )).ToListAsync();

            var migratedCount = 0;
            foreach (var oldAdmin in oldAdmins)
            {
                var normalizedEmail = oldAdmin.Email.Trim().ToLowerInvariant();
                var existing = await _userRepository.GetByEmailAsync(normalizedEmail);
                if (existing == null)
                {
                    oldAdmin.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                    oldAdmin.WebsiteId = websiteId;
                    oldAdmin.Role = "Admin";
                    oldAdmin.Status = "active";
                    oldAdmin.IsDisabled = false;
                    oldAdmin.FailedLoginAttempts = 0;
                    oldAdmin.LockoutEndUtc = null;
                    oldAdmin.RefreshTokens = new List<RefreshToken>();

                    await _userRepository.CreateAsync(oldAdmin);
                    migratedCount++;
                }
            }

            _logger.LogInformation("[DEBUG] Migrated {Count} admins from tours70 into {Database}", migratedCount, currentDbName);

            return Ok(new
            {
                success = true,
                message = $"Successfully migrated {migratedCount} admin(s) from tours70 into database '{currentDbName}'.",
                migratedCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to migrate admins from tours70 into database {Database}", currentDbName);
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }
}

public class SeedAdminRequestDto
{
    public required string Email { get; set; }
    public required string Password { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Secret { get; set; }
}
