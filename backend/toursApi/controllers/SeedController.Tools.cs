using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers;

public partial class SeedController
{
    private bool SeedToolsAllowed()
    {
        var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        return env.IsDevelopment() || config.GetValue("Seed:Enabled", false);
    }

    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        if (!SeedToolsAllowed()) return NotFound();

        try
        {
            var toursCollection = _database.GetCollection<Tour>("tours");
            var destinationsCollection = _database.GetCollection<Destination>("destinations");
            var bookingsCollection = _database.GetCollection<Booking>("bookings");
            var usersCollection = _database.GetCollection<User>("users");

            var tourCount = await toursCollection.CountDocumentsAsync(Builders<Tour>.Filter.Empty);
            var destinationCount = await destinationsCollection.CountDocumentsAsync(Builders<Destination>.Filter.Empty);
            var bookingCount = await bookingsCollection.CountDocumentsAsync(Builders<Booking>.Filter.Empty);
            var userCount = await usersCollection.CountDocumentsAsync(Builders<User>.Filter.Empty);

            return Ok(new
            {
                success = true,
                websiteId = _websiteContext.CurrentWebsiteId,
                database = _database.DatabaseNamespace.DatabaseName,
                counts = new
                {
                    tours = tourCount,
                    destinations = destinationCount,
                    bookings = bookingCount,
                    users = userCount
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("bookings")]
    public async Task<IActionResult> GetSeedBookings()
    {
        if (!SeedToolsAllowed()) return NotFound();
        try
        {
            var bookingsCollection = _database.GetCollection<Booking>("bookings");
            var bookings = await bookingsCollection.Find(Builders<Booking>.Filter.Empty).ToListAsync();
            return Ok(new
            {
                success = true,
                websiteId = _websiteContext.CurrentWebsiteId,
                database = _database.DatabaseNamespace.DatabaseName,
                count = bookings.Count,
                data = bookings
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("tours")]
    public async Task<IActionResult> SeedTours([FromBody] List<Tour>? incomingTours)
    {
        if (!SeedToolsAllowed()) return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Seeding not allowed." });

        try
        {
            var toursCollection = _database.GetCollection<Tour>("tours");
            var siteId = _websiteContext.CurrentWebsiteId;
            var toursToProcess = new List<Tour>();

            if (incomingTours != null && incomingTours.Count > 0)
            {
                toursToProcess.AddRange(incomingTours);
            }
            else
            {
                toursToProcess.AddRange(GetToursForSite(siteId));
            }

            if (toursToProcess.Count == 0)
            {
                return BadRequest(new { success = false, error = "No tours provided or found for this site." });
            }

            int upsertedCount = 0;
            var replaceOptions = new ReplaceOptions { IsUpsert = true };

            foreach (var tour in toursToProcess)
            {
                if (string.IsNullOrWhiteSpace(tour.Slug))
                {
                    tour.Slug = Regex.Replace(tour.Name.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
                }

                tour.Website = siteId;
                tour.WebsiteId = siteId;

                var filter = Builders<Tour>.Filter.Eq(t => t.Slug, tour.Slug);
                var existing = await toursCollection.Find(filter).FirstOrDefaultAsync();

                if (existing != null && !string.IsNullOrEmpty(existing.Id))
                {
                    tour.Id = existing.Id;
                    if (tour.TourNumericId == 0) tour.TourNumericId = existing.TourNumericId;
                    if (!tour.CreatedAt.HasValue) tour.CreatedAt = existing.CreatedAt;
                }
                else if (string.IsNullOrWhiteSpace(tour.Id))
                {
                    tour.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                }

                tour.UpdatedAt = DateTime.UtcNow;
                if (!tour.CreatedAt.HasValue) tour.CreatedAt = DateTime.UtcNow;

                await toursCollection.ReplaceOneAsync(filter, tour, replaceOptions);
                upsertedCount++;
            }

            await DatabaseIndexInitializer.EnsureIndexesForDatabaseAsync(_database);

            return Ok(new
            {
                success = true,
                websiteId = siteId,
                database = _database.DatabaseNamespace.DatabaseName,
                message = $"Successfully upserted {upsertedCount} tours into '{_database.DatabaseNamespace.DatabaseName}'.",
                processedCount = upsertedCount
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpGet("category-counts")]
    public async Task<IActionResult> CategoryCounts()
    {
        try
        {
            var toursCollection = _database.GetCollection<Tour>("tours");
            var allTours = await toursCollection
                .Find(Builders<Tour>.Filter.Empty)
                .Project(t => new { t.Category, t.Featured, t.Popular })
                .ToListAsync();

            var byCat = allTours
                .GroupBy(t => string.IsNullOrEmpty(t.Category) ? "Uncategorized" : t.Category)
                .ToDictionary(cg => cg.Key, cg => cg.Count());

            byCat["Total"] = allTours.Count;
            byCat["Featured"] = allTours.Count(t => t.Featured);
            byCat["Popular"] = allTours.Count(t => t.Popular);

            return Ok(new
            {
                success = true,
                websiteId = _websiteContext.CurrentWebsiteId,
                database = _database.DatabaseNamespace.DatabaseName,
                totalTours = allTours.Count,
                categories = byCat
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("admin")]
    public async Task<IActionResult> SeedAdmin()
    {
        if (!SeedToolsAllowed()) return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Seeding not allowed." });

        try
        {
            var siteId = _websiteContext.CurrentWebsiteId;
            var usersCollection = _database.GetCollection<User>("users");
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
            var adminEmail = $"admin@{siteId}.com";
            var adminName = siteId switch
            {
                "tripgoasia" => "TripGo Asia Admin",
                "technoheaven" => "Technoheaven Admin",
                _ => "Gujju Tours Admin"
            };

            var existing = await usersCollection.Find(u => u.Email == adminEmail).FirstOrDefaultAsync();
            if (existing != null)
            {
                existing.Role = "Admin";
                existing.Status = "active";
                existing.IsDisabled = false;
                existing.FailedLoginAttempts = 0;
                existing.LockoutEndUtc = null;
                existing.PasswordHash = hasher.HashPassword(existing, "Admin@12345");
                existing.UpdatedAt = DateTime.UtcNow;
                await usersCollection.ReplaceOneAsync(u => u.Id == existing.Id, existing);

                return Ok(new
                {
                    success = true,
                    message = $"Admin account '{adminEmail}' reset to default password for '{siteId}'.",
                    user = new { existing.Id, existing.Email, existing.Role, existing.WebsiteId }
                });
            }

            var newAdmin = new User
            {
                Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                WebsiteId = siteId,
                Name = adminName,
                Email = adminEmail,
                Role = "Admin",
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            newAdmin.PasswordHash = hasher.HashPassword(newAdmin, "Admin@12345");
            await usersCollection.InsertOneAsync(newAdmin);

            return Ok(new
            {
                success = true,
                message = $"Admin account '{adminEmail}' created for '{siteId}'.",
                user = new { newAdmin.Id, newAdmin.Email, newAdmin.Role, newAdmin.WebsiteId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    [HttpPost("destinations")]
    public async Task<IActionResult> SeedDestinations()
    {
        if (!SeedToolsAllowed()) return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Seeding not allowed." });

        try
        {
            var siteId = _websiteContext.CurrentWebsiteId;
            var destinationsCollection = _database.GetCollection<Destination>("destinations");
            var dests = GetDestinationsForSite(siteId);

            int count = 0;
            foreach (var d in dests)
            {
                var existing = await destinationsCollection.Find(x => x.Name == d.Name).FirstOrDefaultAsync();
                if (existing == null)
                {
                    d.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                    d.Website = siteId;
                    d.CreatedAt = DateTime.UtcNow;
                    d.UpdatedAt = DateTime.UtcNow;
                    await destinationsCollection.InsertOneAsync(d);
                    count++;
                }
            }

            return Ok(new
            {
                success = true,
                message = $"Seeded {count} new destinations for '{siteId}'.",
                totalDestinations = await destinationsCollection.CountDocumentsAsync(Builders<Destination>.Filter.Empty)
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }
}