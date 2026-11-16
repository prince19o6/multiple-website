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



    [HttpPost("cleanup-corrupted")]
    public async Task<IActionResult> CleanupCorrupted()
    {
        if (!SeedToolsAllowed()) return StatusCode(StatusCodes.Status403Forbidden, new { success = false, error = "Seeding not allowed." });
        try
        {
            var toursCollection = _database.GetCollection<Tour>("tours");
            var filter = Builders<Tour>.Filter.Or(
                Builders<Tour>.Filter.Eq(t => t.Slug, "nandarkha"),
                Builders<Tour>.Filter.Regex(t => t.Name, new MongoDB.Bson.BsonRegularExpression("nandarkha", "i")),
                Builders<Tour>.Filter.Lte(t => t.TourNumericId, 0)
            );
            var res = await toursCollection.DeleteManyAsync(filter);
            return Ok(new
            {
                success = true,
                websiteId = _websiteContext.CurrentWebsiteId,
                database = _database.DatabaseNamespace.DatabaseName,
                deletedCount = res.DeletedCount
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



    /// <summary>
    /// Idempotent import of generated module seeds (categories, hotels, etc.) from `seed/{siteId}/`.
    /// </summary>
    [HttpPost("modules")]
    public async Task<IActionResult> SeedModules()
    {
        if (!SeedToolsAllowed()) return NotFound();

        try
        {
            var siteId = _websiteContext.CurrentWebsiteId.ToLowerInvariant();
            var categoriesCollection = _database.GetCollection<Category>("categories");
            var hotelsCollection = _database.GetCollection<Hotel>("hotels");

            int categoriesSeeded = 0;
            int hotelsSeeded = 0;

            // Base seed path
            var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
            var seedBaseDir = Path.Combine(env.ContentRootPath, "..", "..", "seed", siteId);
            if (!Directory.Exists(seedBaseDir))
            {
                seedBaseDir = Path.Combine(env.ContentRootPath, "seed", siteId);
            }

            // 1. Categories
            var categoriesFile = Path.Combine(seedBaseDir, "categories.json");
            if (System.IO.File.Exists(categoriesFile))
            {
                var json = await System.IO.File.ReadAllTextAsync(categoriesFile);
                var cats = System.Text.Json.JsonSerializer.Deserialize<List<Category>>(json, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (cats != null)
                {
                    foreach (var cat in cats)
                    {
                        cat.WebsiteId = siteId;
                        cat.Module = cat.Module.ToLowerInvariant();
                        cat.Slug = cat.Slug.ToLowerInvariant();
                        var filter = Builders<Category>.Filter.And(
                            Builders<Category>.Filter.Eq(c => c.Module, cat.Module),
                            Builders<Category>.Filter.Eq(c => c.Slug, cat.Slug)
                        );
                        var existingCat = await categoriesCollection.Find(filter).FirstOrDefaultAsync();
                        if (existingCat != null)
                        {
                            cat.Id = existingCat.Id;
                        }
                        else if (string.IsNullOrWhiteSpace(cat.Id) || !MongoDB.Bson.ObjectId.TryParse(cat.Id, out _))
                        {
                            cat.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        await categoriesCollection.ReplaceOneAsync(filter, cat, new ReplaceOptions { IsUpsert = true });
                        categoriesSeeded++;
                    }
                }
            }

            // 2. Hotels
            var hotelsFile = Path.Combine(seedBaseDir, "hotels.json");
            if (System.IO.File.Exists(hotelsFile))
            {
                var json = await System.IO.File.ReadAllTextAsync(hotelsFile);
                var hotelList = System.Text.Json.JsonSerializer.Deserialize<List<Hotel>>(json, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (hotelList != null)
                {
                    foreach (var h in hotelList)
                    {
                        h.WebsiteId = siteId;
                        h.Slug = h.Slug.ToLowerInvariant();
                        var filter = Builders<Hotel>.Filter.Eq(x => x.Slug, h.Slug);
                        var existingH = await hotelsCollection.Find(filter).FirstOrDefaultAsync();
                        if (existingH != null)
                        {
                            h.Id = existingH.Id;
                        }
                        else if (string.IsNullOrWhiteSpace(h.Id) || !MongoDB.Bson.ObjectId.TryParse(h.Id, out _))
                        {
                            h.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        await hotelsCollection.ReplaceOneAsync(filter, h, new ReplaceOptions { IsUpsert = true });
                        hotelsSeeded++;
                    }
                }
            }

            // 3. Activities / Tours
            var activitiesCollection = _database.GetCollection<Tour>("tours");
            int activitiesSeeded = 0;
            var activitiesFile = Path.Combine(seedBaseDir, "activities.json");
            if (System.IO.File.Exists(activitiesFile))
            {
                var json = await System.IO.File.ReadAllTextAsync(activitiesFile);
                var activityList = System.Text.Json.JsonSerializer.Deserialize<List<Tour>>(json, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (activityList != null)
                {
                    foreach (var act in activityList)
                    {
                        act.WebsiteId = siteId;
                        act.Slug = act.Slug.ToLowerInvariant();
                        var filter = Builders<Tour>.Filter.Or(
                            Builders<Tour>.Filter.Eq(x => x.Slug, act.Slug),
                            Builders<Tour>.Filter.Eq(x => x.TourNumericId, act.TourNumericId)
                        );
                        var existingAct = await activitiesCollection.Find(filter).FirstOrDefaultAsync();
                        if (existingAct != null)
                        {
                            act.Id = existingAct.Id;
                        }
                        else if (string.IsNullOrWhiteSpace(act.Id) || !MongoDB.Bson.ObjectId.TryParse(act.Id, out _))
                        {
                            act.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        await activitiesCollection.ReplaceOneAsync(filter, act, new ReplaceOptions { IsUpsert = true });
                        activitiesSeeded++;
                    }
                }
            }

            // 4. Packages / Holidays
            var packagesCollection = _database.GetCollection<Package>("packages");
            int packagesSeeded = 0;
            var packagesFile = Path.Combine(seedBaseDir, "packages.json");
            if (System.IO.File.Exists(packagesFile))
            {
                var json = await System.IO.File.ReadAllTextAsync(packagesFile);
                var packageList = System.Text.Json.JsonSerializer.Deserialize<List<Package>>(json, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (packageList != null)
                {
                    foreach (var pkg in packageList)
                    {
                        pkg.WebsiteId = siteId;
                        pkg.Slug = pkg.Slug.ToLowerInvariant();
                        var filter = Builders<Package>.Filter.Or(
                            Builders<Package>.Filter.Eq(x => x.Slug, pkg.Slug),
                            Builders<Package>.Filter.Eq(x => x.PackageNumericId, pkg.PackageNumericId)
                        );
                        var existingPkg = await packagesCollection.Find(filter).FirstOrDefaultAsync();
                        if (existingPkg != null)
                        {
                            pkg.Id = existingPkg.Id;
                        }
                        else if (string.IsNullOrWhiteSpace(pkg.Id) || !MongoDB.Bson.ObjectId.TryParse(pkg.Id, out _))
                        {
                            pkg.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        await packagesCollection.ReplaceOneAsync(filter, pkg, new ReplaceOptions { IsUpsert = true });
                        packagesSeeded++;
                    }
                }
            }

            // 5. Flights
            var flightsCollection = _database.GetCollection<Flight>("flights");
            int flightsSeeded = 0;
            var flightsFile = Path.Combine(seedBaseDir, "flights.json");
            if (System.IO.File.Exists(flightsFile))
            {
                var json = await System.IO.File.ReadAllTextAsync(flightsFile);
                var flightList = System.Text.Json.JsonSerializer.Deserialize<List<Flight>>(json, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (flightList != null)
                {
                    foreach (var fl in flightList)
                    {
                        fl.WebsiteId = siteId;
                        fl.Slug = fl.Slug.ToLowerInvariant();
                        var filter = Builders<Flight>.Filter.Or(
                            Builders<Flight>.Filter.Eq(x => x.Slug, fl.Slug),
                            Builders<Flight>.Filter.Eq(x => x.FlightNumericId, fl.FlightNumericId)
                        );
                        var existingFl = await flightsCollection.Find(filter).FirstOrDefaultAsync();
                        if (existingFl != null)
                        {
                            fl.Id = existingFl.Id;
                        }
                        else if (string.IsNullOrWhiteSpace(fl.Id) || !MongoDB.Bson.ObjectId.TryParse(fl.Id, out _))
                        {
                            fl.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        await flightsCollection.ReplaceOneAsync(filter, fl, new ReplaceOptions { IsUpsert = true });
                        flightsSeeded++;
                    }
                }
            }

            // 6. Transfers
            var transfersCollection = _database.GetCollection<Transfer>("transfers");
            int transfersSeeded = 0;
            var transfersFile = Path.Combine(seedBaseDir, "transfers.json");
            if (System.IO.File.Exists(transfersFile))
            {
                var json = await System.IO.File.ReadAllTextAsync(transfersFile);
                var transferList = System.Text.Json.JsonSerializer.Deserialize<List<Transfer>>(json, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (transferList != null)
                {
                    foreach (var tr in transferList)
                    {
                        tr.WebsiteId = siteId;
                        tr.Slug = tr.Slug.ToLowerInvariant();
                        var filter = Builders<Transfer>.Filter.Or(
                            Builders<Transfer>.Filter.Eq(x => x.Slug, tr.Slug),
                            Builders<Transfer>.Filter.Eq(x => x.TransferNumericId, tr.TransferNumericId)
                        );
                        var existingTr = await transfersCollection.Find(filter).FirstOrDefaultAsync();
                        if (existingTr != null)
                        {
                            tr.Id = existingTr.Id;
                        }
                        else if (string.IsNullOrWhiteSpace(tr.Id) || !MongoDB.Bson.ObjectId.TryParse(tr.Id, out _))
                        {
                            tr.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        await transfersCollection.ReplaceOneAsync(filter, tr, new ReplaceOptions { IsUpsert = true });
                        transfersSeeded++;
                    }
                }
            }

            // 7. Visas
            var visasCollection = _database.GetCollection<Visa>("visas");
            int visasSeeded = 0;
            var visasFile = Path.Combine(seedBaseDir, "visas.json");
            if (System.IO.File.Exists(visasFile))
            {
                var json = await System.IO.File.ReadAllTextAsync(visasFile);
                var visaList = System.Text.Json.JsonSerializer.Deserialize<List<Visa>>(json, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (visaList != null)
                {
                    foreach (var vi in visaList)
                    {
                        vi.WebsiteId = siteId;
                        vi.Slug = vi.Slug.ToLowerInvariant();
                        var filter = Builders<Visa>.Filter.Or(
                            Builders<Visa>.Filter.Eq(x => x.Slug, vi.Slug),
                            Builders<Visa>.Filter.Eq(x => x.VisaNumericId, vi.VisaNumericId)
                        );
                        var existingVi = await visasCollection.Find(filter).FirstOrDefaultAsync();
                        if (existingVi != null)
                        {
                            vi.Id = existingVi.Id;
                        }
                        else if (string.IsNullOrWhiteSpace(vi.Id) || !MongoDB.Bson.ObjectId.TryParse(vi.Id, out _))
                        {
                            vi.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        await visasCollection.ReplaceOneAsync(filter, vi, new ReplaceOptions { IsUpsert = true });
                        visasSeeded++;
                    }
                }
            }

            // 8. Restaurants
            var restaurantsCollection = _database.GetCollection<Restaurant>("restaurants");
            int restaurantsSeeded = 0;
            var restaurantsFile = Path.Combine(seedBaseDir, "restaurants.json");
            if (System.IO.File.Exists(restaurantsFile))
            {
                var json = await System.IO.File.ReadAllTextAsync(restaurantsFile);
                var restaurantList = System.Text.Json.JsonSerializer.Deserialize<List<Restaurant>>(json, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (restaurantList != null)
                {
                    foreach (var res in restaurantList)
                    {
                        res.WebsiteId = siteId;
                        res.Slug = res.Slug.ToLowerInvariant();
                        var filter = Builders<Restaurant>.Filter.Or(
                            Builders<Restaurant>.Filter.Eq(x => x.Slug, res.Slug),
                            Builders<Restaurant>.Filter.Eq(x => x.RestaurantNumericId, res.RestaurantNumericId)
                        );
                        var existingRes = await restaurantsCollection.Find(filter).FirstOrDefaultAsync();
                        if (existingRes != null)
                        {
                            res.Id = existingRes.Id;
                        }
                        else if (string.IsNullOrWhiteSpace(res.Id) || !MongoDB.Bson.ObjectId.TryParse(res.Id, out _))
                        {
                            res.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        await restaurantsCollection.ReplaceOneAsync(filter, res, new ReplaceOptions { IsUpsert = true });
                        restaurantsSeeded++;
                    }
                }
            }

            // 9. Build Package Destination Options
            var buildPackageCollection = _database.GetCollection<BuildPackageOption>("buildPackageOptions");
            int buildPackageSeeded = 0;
            var buildPackageFile = Path.Combine(seedBaseDir, "build-package-options.json");
            if (System.IO.File.Exists(buildPackageFile))
            {
                var json = await System.IO.File.ReadAllTextAsync(buildPackageFile);
                var bpList = System.Text.Json.JsonSerializer.Deserialize<List<BuildPackageOption>>(json, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (bpList != null)
                {
                    foreach (var bp in bpList)
                    {
                        bp.WebsiteId = siteId;
                        bp.DestinationSlug = bp.DestinationSlug.ToLowerInvariant();
                        var filter = Builders<BuildPackageOption>.Filter.Or(
                            Builders<BuildPackageOption>.Filter.Eq(x => x.DestinationSlug, bp.DestinationSlug),
                            Builders<BuildPackageOption>.Filter.Eq(x => x.DestinationNumericId, bp.DestinationNumericId)
                        );
                        var existingBp = await buildPackageCollection.Find(filter).FirstOrDefaultAsync();
                        if (existingBp != null)
                        {
                            bp.Id = existingBp.Id;
                        }
                        else if (string.IsNullOrWhiteSpace(bp.Id) || !MongoDB.Bson.ObjectId.TryParse(bp.Id, out _))
                        {
                            bp.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        await buildPackageCollection.ReplaceOneAsync(filter, bp, new ReplaceOptions { IsUpsert = true });
                        buildPackageSeeded++;
                    }
                }
            }

            await DatabaseIndexInitializer.EnsureIndexesForDatabaseAsync(_database);

            return Ok(new
            {
                success = true,
                websiteId = siteId,
                database = _database.DatabaseNamespace.DatabaseName,
                categoriesSeeded,
                hotelsSeeded,
                activitiesSeeded,
                packagesSeeded,
                flightsSeeded,
                transfersSeeded,
                visasSeeded,
                restaurantsSeeded,
                buildPackageSeeded,
                totalHotels = await hotelsCollection.CountDocumentsAsync(Builders<Hotel>.Filter.Empty),
                totalActivities = await activitiesCollection.CountDocumentsAsync(Builders<Tour>.Filter.Empty),
                totalPackages = await packagesCollection.CountDocumentsAsync(Builders<Package>.Filter.Empty),
                totalFlights = await flightsCollection.CountDocumentsAsync(Builders<Flight>.Filter.Empty),
                totalTransfers = await transfersCollection.CountDocumentsAsync(Builders<Transfer>.Filter.Empty),
                totalVisas = await visasCollection.CountDocumentsAsync(Builders<Visa>.Filter.Empty),
                totalRestaurants = await restaurantsCollection.CountDocumentsAsync(Builders<Restaurant>.Filter.Empty),
                totalBuildPackage = await buildPackageCollection.CountDocumentsAsync(Builders<BuildPackageOption>.Filter.Empty),
                totalCategories = await categoriesCollection.CountDocumentsAsync(Builders<Category>.Filter.Empty)
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }



    /// <summary>
    /// Purge all demo/dummy data across modules for the active website database.
    /// </summary>
    [HttpDelete("demo")]
    public async Task<IActionResult> DeleteDemoData()
    {
        if (!SeedToolsAllowed()) return NotFound();

        try
        {
            var siteId = _websiteContext.CurrentWebsiteId.ToLowerInvariant();
            var hotelsCollection = _database.GetCollection<Hotel>("hotels");
            var categoriesCollection = _database.GetCollection<Category>("categories");
            var buildPackageCollection = _database.GetCollection<BuildPackageOption>("buildPackageOptions");

            var hotelResult = await hotelsCollection.DeleteManyAsync(h => h.IsDemo == true);
            var categoryResult = await categoriesCollection.DeleteManyAsync(Builders<Category>.Filter.Eq("metadata.isDemo", true));
            var buildPackageResult = await buildPackageCollection.DeleteManyAsync(b => b.IsDemo == true);

            return Ok(new
            {
                success = true,
                message = $"Successfully purged demo data for '{siteId}'.",
                hotelsDeleted = hotelResult.DeletedCount,
                categoriesDeleted = categoryResult.DeletedCount,
                buildPackageDeleted = buildPackageResult.DeletedCount
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }


}