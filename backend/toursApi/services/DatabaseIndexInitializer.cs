using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Services;

public static class DatabaseIndexInitializer
{
    private static readonly HashSet<string> _initializedDatabases = new(StringComparer.OrdinalIgnoreCase);
    private static readonly object _lock = new();

    public static async Task EnsureIndexesForDatabaseAsync(IMongoDatabase database)
    {
        var dbName = database.DatabaseNamespace.DatabaseName;

        lock (_lock)
        {
            if (!_initializedDatabases.Add(dbName))
            {
                return;
            }
        }

        try
        {
            var tours = database.GetCollection<Tour>("tours");
            var bookings = database.GetCollection<Booking>("bookings");
            var users = database.GetCollection<User>("users");
            var destinations = database.GetCollection<Destination>("destinations");
            var websiteConfigs = database.GetCollection<WebsiteConfigDocument>("websiteConfigs");
            var categories = database.GetCollection<Category>("categories");
            var hotels = database.GetCollection<Hotel>("hotels");

            // Categories indexes
            await categories.Indexes.CreateOneAsync(new CreateIndexModel<Category>(
                Builders<Category>.IndexKeys.Ascending(c => c.Module).Ascending(c => c.Slug),
                new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_categories_module_slug_unique" }
            ));

            await categories.Indexes.CreateOneAsync(new CreateIndexModel<Category>(
                Builders<Category>.IndexKeys.Ascending(c => c.Module).Ascending(c => c.Order),
                new CreateIndexOptions { Name = "idx_categories_module_order" }
            ));

            // Hotels indexes
            await hotels.Indexes.CreateOneAsync(new CreateIndexModel<Hotel>(
                Builders<Hotel>.IndexKeys.Ascending(h => h.Slug),
                new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_hotels_slug_unique" }
            ));

            await hotels.Indexes.CreateOneAsync(new CreateIndexModel<Hotel>(
                Builders<Hotel>.IndexKeys.Ascending(h => h.PropertyType),
                new CreateIndexOptions { Name = "idx_hotels_property_type" }
            ));

            await hotels.Indexes.CreateOneAsync(new CreateIndexModel<Hotel>(
                Builders<Hotel>.IndexKeys.Ascending(h => h.Collections),
                new CreateIndexOptions { Name = "idx_hotels_collections" }
            ));

            await hotels.Indexes.CreateOneAsync(new CreateIndexModel<Hotel>(
                Builders<Hotel>.IndexKeys.Ascending(h => h.Destination.CityName),
                new CreateIndexOptions { Name = "idx_hotels_destination_city" }
            ));

            await hotels.Indexes.CreateOneAsync(new CreateIndexModel<Hotel>(
                Builders<Hotel>.IndexKeys.Ascending(h => h.PricePerNight),
                new CreateIndexOptions { Name = "idx_hotels_price" }
            ));

            await hotels.Indexes.CreateOneAsync(new CreateIndexModel<Hotel>(
                Builders<Hotel>.IndexKeys.Ascending(h => h.StarRating),
                new CreateIndexOptions { Name = "idx_hotels_star_rating" }
            ));

            await hotels.Indexes.CreateOneAsync(new CreateIndexModel<Hotel>(
                Builders<Hotel>.IndexKeys.Ascending(h => h.Status).Ascending(h => h.Featured),
                new CreateIndexOptions { Name = "idx_hotels_status_featured" }
            ));

            // Packages indexes
            var packages = database.GetCollection<Package>("packages");
            try
            {
                await packages.Indexes.CreateOneAsync(new CreateIndexModel<Package>(
                    Builders<Package>.IndexKeys.Ascending(p => p.Slug),
                    new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_packages_slug_unique" }
                ));
                await packages.Indexes.CreateOneAsync(new CreateIndexModel<Package>(
                    Builders<Package>.IndexKeys.Ascending(p => p.Destination),
                    new CreateIndexOptions { Name = "idx_packages_destination" }
                ));
                await packages.Indexes.CreateOneAsync(new CreateIndexModel<Package>(
                    Builders<Package>.IndexKeys.Ascending(p => p.Status).Ascending(p => p.Featured),
                    new CreateIndexOptions { Name = "idx_packages_status_featured" }
                ));
            }
            catch { /* Index exists */ }

            // Flights indexes
            var flights = database.GetCollection<Flight>("flights");
            try
            {
                await flights.Indexes.CreateOneAsync(new CreateIndexModel<Flight>(
                    Builders<Flight>.IndexKeys.Ascending(f => f.Slug),
                    new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_flights_slug_unique" }
                ));
                await flights.Indexes.CreateOneAsync(new CreateIndexModel<Flight>(
                    Builders<Flight>.IndexKeys.Ascending(f => f.Airline),
                    new CreateIndexOptions { Name = "idx_flights_airline" }
                ));
                await flights.Indexes.CreateOneAsync(new CreateIndexModel<Flight>(
                    Builders<Flight>.IndexKeys.Ascending(f => f.Status).Ascending(f => f.Featured),
                    new CreateIndexOptions { Name = "idx_flights_status_featured" }
                ));
            }
            catch { /* Index exists */ }

            // Transfers indexes
            var transfers = database.GetCollection<Transfer>("transfers");
            try
            {
                await transfers.Indexes.CreateOneAsync(new CreateIndexModel<Transfer>(
                    Builders<Transfer>.IndexKeys.Ascending(t => t.Slug),
                    new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_transfers_slug_unique" }
                ));
                await transfers.Indexes.CreateOneAsync(new CreateIndexModel<Transfer>(
                    Builders<Transfer>.IndexKeys.Ascending(t => t.Status).Ascending(t => t.Featured),
                    new CreateIndexOptions { Name = "idx_transfers_status_featured" }
                ));
            }
            catch { /* Index exists */ }

            // Visas indexes
            var visas = database.GetCollection<Visa>("visas");
            try
            {
                await visas.Indexes.CreateOneAsync(new CreateIndexModel<Visa>(
                    Builders<Visa>.IndexKeys.Ascending(v => v.Slug),
                    new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_visas_slug_unique" }
                ));
                await visas.Indexes.CreateOneAsync(new CreateIndexModel<Visa>(
                    Builders<Visa>.IndexKeys.Ascending(v => v.Country),
                    new CreateIndexOptions { Name = "idx_visas_country" }
                ));
                await visas.Indexes.CreateOneAsync(new CreateIndexModel<Visa>(
                    Builders<Visa>.IndexKeys.Ascending(v => v.Status).Ascending(v => v.Featured),
                    new CreateIndexOptions { Name = "idx_visas_status_featured" }
                ));
            }
            catch { /* Index exists */ }

            // Restaurants indexes
            var restaurants = database.GetCollection<Restaurant>("restaurants");
            try
            {
                await restaurants.Indexes.CreateOneAsync(new CreateIndexModel<Restaurant>(
                    Builders<Restaurant>.IndexKeys.Ascending(r => r.Slug),
                    new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_restaurants_slug_unique" }
                ));
                await restaurants.Indexes.CreateOneAsync(new CreateIndexModel<Restaurant>(
                    Builders<Restaurant>.IndexKeys.Ascending(r => r.Status).Ascending(r => r.Featured),
                    new CreateIndexOptions { Name = "idx_restaurants_status_featured" }
                ));
            }
            catch { /* Index exists */ }

            // 1. Tours indexes
            // Unique slug index within this database
            await tours.Indexes.CreateOneAsync(new CreateIndexModel<Tour>(
                Builders<Tour>.IndexKeys.Ascending(t => t.Slug),
                new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_tours_slug_unique" }
            ));

            await tours.Indexes.CreateOneAsync(new CreateIndexModel<Tour>(
                Builders<Tour>.IndexKeys.Ascending(t => t.Category),
                new CreateIndexOptions { Name = "idx_tours_category" }
            ));

            await tours.Indexes.CreateOneAsync(new CreateIndexModel<Tour>(
                Builders<Tour>.IndexKeys.Ascending(t => t.Featured),
                new CreateIndexOptions { Name = "idx_tours_featured" }
            ));

            await tours.Indexes.CreateOneAsync(new CreateIndexModel<Tour>(
                Builders<Tour>.IndexKeys.Ascending(t => t.Popular),
                new CreateIndexOptions { Name = "idx_tours_popular" }
            ));

            await tours.Indexes.CreateOneAsync(new CreateIndexModel<Tour>(
                Builders<Tour>.IndexKeys.Ascending(t => t.Status),
                new CreateIndexOptions { Name = "idx_tours_status" }
            ));

            await tours.Indexes.CreateOneAsync(new CreateIndexModel<Tour>(
                Builders<Tour>.IndexKeys.Ascending(t => t.TourNumericId),
                new CreateIndexOptions { Name = "idx_tours_numeric_id" }
            ));

            await tours.Indexes.CreateOneAsync(new CreateIndexModel<Tour>(
                Builders<Tour>.IndexKeys.Ascending(t => t.Destination),
                new CreateIndexOptions { Name = "idx_tours_destination" }
            ));

            try
            {
                await tours.Indexes.CreateOneAsync(new CreateIndexModel<Tour>(
                    Builders<Tour>.IndexKeys.Text(t => t.Name).Text(t => t.Description),
                    new CreateIndexOptions { Name = "idx_tours_text_search" }
                ));
            }
            catch
            {
                // In case a text index already exists with different weights/options
            }

            // 2. Bookings indexes
            // Unique reference index within this database
            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.Reference),
                new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_bookings_reference_unique" }
            ));

            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.Email),
                new CreateIndexOptions { Name = "idx_bookings_email" }
            ));

            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.UserId),
                new CreateIndexOptions { Name = "idx_bookings_userId" }
            ));

            // Compound index: owner user ID + creation date
            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.UserId).Descending(b => b.CreatedAt),
                new CreateIndexOptions { Name = "idx_bookings_user_created" }
            ));

            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.Status),
                new CreateIndexOptions { Name = "idx_bookings_status" }
            ));

            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.TravelDate),
                new CreateIndexOptions { Name = "idx_bookings_travelDate" }
            ));

            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.IdempotencyKey),
                new CreateIndexOptions { Sparse = true, Name = "idx_bookings_idempotency_sparse" }
            ));

            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Descending(b => b.CreatedAt),
                new CreateIndexOptions { Name = "idx_bookings_createdAt_desc" }
            ));

            // Compound index: status + createdAt for admin inbox and expiry sweep
            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.Status).Descending(b => b.CreatedAt),
                new CreateIndexOptions { Name = "idx_bookings_status_created" }
            ));

            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.UserId).Descending(b => b.CreatedAt),
                new CreateIndexOptions { Sparse = true, Name = "idx_bookings_userId_createdAt" }
            ));

            // 3. Email Outbox indexes
            var outbox = database.GetCollection<EmailOutbox>("emailOutbox");
            await outbox.Indexes.CreateOneAsync(new CreateIndexModel<EmailOutbox>(
                Builders<EmailOutbox>.IndexKeys.Ascending(o => o.Status).Ascending(o => o.NextAttemptAt),
                new CreateIndexOptions { Name = "idx_email_outbox_status_nextAttempt" }
            ));

            // 4. Notifications indexes
            var notifications = database.GetCollection<CustomerNotification>("notifications");
            await notifications.Indexes.CreateOneAsync(new CreateIndexModel<CustomerNotification>(
                Builders<CustomerNotification>.IndexKeys.Ascending(n => n.UserId).Descending(n => n.CreatedAt),
                new CreateIndexOptions { Name = "idx_notifications_user_created" }
            ));
            await notifications.Indexes.CreateOneAsync(new CreateIndexModel<CustomerNotification>(
                Builders<CustomerNotification>.IndexKeys.Ascending(n => n.UserEmail).Descending(n => n.CreatedAt),
                new CreateIndexOptions { Name = "idx_notifications_email_created" }
            ));

            var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();

            // 5. Users data repair & unique indexes
            try
            {
                // One-time data repair: normalize emails to lowercase and generate UserCode for legacy users
                var existingUsers = await users.Find(Builders<User>.Filter.Empty).ToListAsync();
                var userCodePrefix = siteId switch
                {
                    "tripgoasia" or "tga" => "TGA-U-",
                    "technoheaven" or "th" => "TH-U-",
                    _ => "GT-U-"
                };
                int userSeq = 1;
                foreach (var u in existingUsers)
                {
                    bool needsUpdate = false;
                    var normalizedEmail = u.Email?.Trim().ToLowerInvariant() ?? "";
                    if (!string.IsNullOrEmpty(normalizedEmail) && u.Email != normalizedEmail)
                    {
                        u.Email = normalizedEmail;
                        needsUpdate = true;
                    }
                    if (string.IsNullOrWhiteSpace(u.UserCode))
                    {
                        u.UserCode = $"{userCodePrefix}{userSeq++:D6}";
                        needsUpdate = true;
                    }
                    if (string.IsNullOrWhiteSpace(u.WebsiteId))
                    {
                        u.WebsiteId = siteId;
                        needsUpdate = true;
                    }
                    if (needsUpdate && !string.IsNullOrEmpty(u.Id))
                    {
                        await users.ReplaceOneAsync(x => x.Id == u.Id, u);
                    }
                }
            }
            catch
            {
                // Suppress repair failures if collection locked
            }

            try
            {
                await users.Indexes.CreateOneAsync(new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.Email),
                    new CreateIndexOptions { Unique = true, Name = "idx_users_email_unique" }
                ));
            }
            catch { /* Index already exists or duplicate handled */ }

            try
            {
                await users.Indexes.CreateOneAsync(new CreateIndexModel<User>(
                    Builders<User>.IndexKeys.Ascending(u => u.UserCode),
                    new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_users_usercode_unique" }
                ));
            }
            catch { /* Index already exists or duplicate handled */ }

            // 6. Ensure default Admin user exists for this tenant
            var adminUser = await users.Find(u => u.Role == "Admin").FirstOrDefaultAsync();
            if (adminUser == null)
            {
                var hasher = new PasswordHasher<User>();
                var adminEmail = $"admin@{siteId}.com";
                var adminName = siteId switch
                {
                    "tripgoasia" => "TripGo Asia Admin",
                    "technoheaven" => "Technoheaven Admin",
                    _ => "Gujju Tours Admin"
                };

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
                await users.InsertOneAsync(newAdmin);
            }

            // 6b. Ensure dedicated Apple App Review demo account exists for Gujju Tours
            if (siteId == "gujjutours")
            {
                var reviewUser = await users.Find(u => u.Email == "apple.reviewer@gujjutours.com").FirstOrDefaultAsync();
                if (reviewUser == null)
                {
                    var hasher = new PasswordHasher<User>();
                    var reviewer = new User
                    {
                        Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                        WebsiteId = "gujjutours",
                        Name = "Apple Reviewer",
                        Email = "apple.reviewer@gujjutours.com",
                        Role = "User",
                        Status = "active",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    reviewer.PasswordHash = hasher.HashPassword(reviewer, "AppleReview2026!");
                    await users.InsertOneAsync(reviewer);
                }
            }

            // 7. Ensure destinations exist for this tenant
            var destinationCount = await destinations.CountDocumentsAsync(Builders<Destination>.Filter.Empty);
            if (destinationCount == 0)
            {
                var dests = siteId switch
                {
                    "tripgoasia" => SeedDataCatalog.Website2Destinations(),
                    "technoheaven" => SeedDataCatalog.Website3Destinations(),
                    _ => SeedDataCatalog.Website1Destinations()
                };

                if (dests.Count > 0)
                {
                    foreach (var d in dests)
                    {
                        if (string.IsNullOrEmpty(d.Id))
                        {
                            d.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                        }
                        d.Website = siteId;
                        d.CreatedAt = DateTime.UtcNow;
                        d.UpdatedAt = DateTime.UtcNow;
                    }
                    await destinations.InsertManyAsync(dests);
                }
            }

            lock (_lock)
            {
                _initializedDatabases.Add(dbName);
            }
        }
        catch
        {
            // Suppress if transient connectivity in dev
        }
    }
}
