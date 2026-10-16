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
            if (_initializedDatabases.Contains(dbName))
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

            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Ascending(b => b.Status),
                new CreateIndexOptions { Name = "idx_bookings_status" }
            ));

            await bookings.Indexes.CreateOneAsync(new CreateIndexModel<Booking>(
                Builders<Booking>.IndexKeys.Descending(b => b.CreatedAt),
                new CreateIndexOptions { Name = "idx_bookings_createdAt_desc" }
            ));

            // 3. Users indexes
            // Unique email index within this database
            await users.Indexes.CreateOneAsync(new CreateIndexModel<User>(
                Builders<User>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Unique = true, Name = "idx_users_email_unique" }
            ));

            // 4. Destinations indexes
            await destinations.Indexes.CreateOneAsync(new CreateIndexModel<Destination>(
                Builders<Destination>.IndexKeys.Ascending(d => d.SortOrder),
                new CreateIndexOptions { Name = "idx_destinations_sortOrder" }
            ));

            // 5. WebsiteConfigs indexes
            await websiteConfigs.Indexes.CreateOneAsync(new CreateIndexModel<WebsiteConfigDocument>(
                Builders<WebsiteConfigDocument>.IndexKeys.Ascending(c => c.Hostname),
                new CreateIndexOptions { Unique = true, Name = "idx_website_configs_hostname_unique" }
            ));

            var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();

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
