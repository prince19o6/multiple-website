using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/seed")]
public partial class SeedController : ControllerBase
{
    private readonly IMongoDatabase _database;
    private readonly IWebsiteContext _websiteContext;
    private readonly IMongoDatabaseProvider _databaseProvider;

    public SeedController(
        IMongoDatabase database,
        IWebsiteContext websiteContext,
        IMongoDatabaseProvider databaseProvider)
    {
        _database = database;
        _websiteContext = websiteContext;
        _databaseProvider = databaseProvider;
    }

    /// <summary>
    /// Idempotent seed for the active website tenant database.
    /// Seeds all 8 canonical modules: hotels, tours, packages, flights, transfers, visas, restaurants, buildpackage.
    /// Does not overwrite modified admin records.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Seed()
    {
        if (!SeedToolsAllowed())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                error = "Destructive database seeding is only allowed in Development environment or with Seed:Enabled configuration."
            });
        }

        try
        {
            var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant() ?? "gujjutours";
            var result = await SeedTenantDatabaseAsync(_database, siteId);

            return Ok(new
            {
                success = true,
                websiteId = siteId,
                database = _database.DatabaseNamespace.DatabaseName,
                message = $"Successfully seeded tenant database '{_database.DatabaseNamespace.DatabaseName}' for website '{siteId}'.",
                counts = result
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    /// <summary>
    /// Seeds all three isolated tenant databases in one idempotent execution.
    /// </summary>
    [HttpPost("all")]
    public async Task<IActionResult> SeedAllTenants()
    {
        if (!SeedToolsAllowed())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                success = false,
                error = "Destructive database seeding is only allowed in Development environment or with Seed:Enabled configuration."
            });
        }

        var results = new Dictionary<string, object>();
        var tenants = new[] { "gujjutours", "tripgoasia", "technoheaven" };

        foreach (var tenant in tenants)
        {
            var dbName = $"tours_{tenant}";
            var db = _databaseProvider.GetDatabase(dbName);
            var seedSummary = await SeedTenantDatabaseAsync(db, tenant);
            results[tenant] = new
            {
                database = dbName,
                summary = seedSummary
            };
        }

        return Ok(new
        {
            success = true,
            message = "All 3 tenant databases seeded successfully.",
            tenants = results
        });
    }

    private async Task<Dictionary<string, int>> SeedTenantDatabaseAsync(IMongoDatabase db, string siteId)
    {
        var counts = new Dictionary<string, int>();

        // 1. Tours
        var toursCol = db.GetCollection<Tour>("tours");
        var diskTours = LoadEntitiesFromDisk<Tour>(siteId, $"tours.{siteId}.json");
        if (diskTours.Count == 0) diskTours = GetToursForSite(siteId);
        int toursInserted = 0;
        foreach (var tour in diskTours)
        {
            var filter = Builders<Tour>.Filter.Eq(t => t.Slug, tour.Slug);
            var existing = await toursCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                tour.Website = siteId;
                await toursCol.InsertOneAsync(tour);
                toursInserted++;
            }
        }
        counts["tours"] = toursInserted;

        // 2. Destinations
        var destsCol = db.GetCollection<Destination>("destinations");
        var diskDests = GetDestinationsForSite(siteId);
        int destsInserted = 0;
        foreach (var d in diskDests)
        {
            var filter = Builders<Destination>.Filter.Eq(x => x.Name, d.Name);
            var existing = await destsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                d.Website = siteId;
                await destsCol.InsertOneAsync(d);
                destsInserted++;
            }
        }
        counts["destinations"] = destsInserted;

        // 3. Hotels
        var hotelsCol = db.GetCollection<Hotel>("hotels");
        var diskHotels = LoadEntitiesFromDisk<Hotel>(siteId, "hotels.json") ?? new List<Hotel>();
        int hotelsInserted = 0;
        foreach (var h in diskHotels)
        {
            var filter = Builders<Hotel>.Filter.Eq(x => x.Slug, h.Slug);
            var existing = await hotelsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                h.WebsiteId = siteId;
                await hotelsCol.InsertOneAsync(h);
                hotelsInserted++;
            }
        }
        counts["hotels"] = hotelsInserted;

        // 4. Packages
        var packagesCol = db.GetCollection<Package>("packages");
        var diskPackages = LoadEntitiesFromDisk<Package>(siteId, "packages.json") ?? new List<Package>();
        int packagesInserted = 0;
        foreach (var p in diskPackages)
        {
            var filter = Builders<Package>.Filter.Eq(x => x.Slug, p.Slug);
            var existing = await packagesCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                p.WebsiteId = siteId;
                p.Website = siteId;
                await packagesCol.InsertOneAsync(p);
                packagesInserted++;
            }
        }
        counts["packages"] = packagesInserted;

        // 5. Flights
        var flightsCol = db.GetCollection<Flight>("flights");
        var diskFlights = LoadEntitiesFromDisk<Flight>(siteId, "flights.json") ?? new List<Flight>();
        int flightsInserted = 0;
        foreach (var f in diskFlights)
        {
            var filter = Builders<Flight>.Filter.Eq(x => x.Slug, f.Slug);
            var existing = await flightsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                f.WebsiteId = siteId;
                f.Website = siteId;
                await flightsCol.InsertOneAsync(f);
                flightsInserted++;
            }
        }
        counts["flights"] = flightsInserted;

        // 6. Transfers
        var transfersCol = db.GetCollection<Transfer>("transfers");
        var diskTransfers = LoadEntitiesFromDisk<Transfer>(siteId, "transfers.json") ?? new List<Transfer>();
        int transfersInserted = 0;
        foreach (var t in diskTransfers)
        {
            var filter = Builders<Transfer>.Filter.Eq(x => x.Slug, t.Slug);
            var existing = await transfersCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                t.WebsiteId = siteId;
                t.Website = siteId;
                await transfersCol.InsertOneAsync(t);
                transfersInserted++;
            }
        }
        counts["transfers"] = transfersInserted;

        // 7. Visas
        var visasCol = db.GetCollection<Visa>("visas");
        var diskVisas = LoadEntitiesFromDisk<Visa>(siteId, "visas.json") ?? new List<Visa>();
        int visasInserted = 0;
        foreach (var v in diskVisas)
        {
            var filter = Builders<Visa>.Filter.Eq(x => x.Slug, v.Slug);
            var existing = await visasCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                v.WebsiteId = siteId;
                v.Website = siteId;
                await visasCol.InsertOneAsync(v);
                visasInserted++;
            }
        }
        counts["visas"] = visasInserted;

        // 8. Restaurants
        var restaurantsCol = db.GetCollection<Restaurant>("restaurants");
        var diskRestaurants = LoadEntitiesFromDisk<Restaurant>(siteId, "restaurants.json") ?? new List<Restaurant>();
        int restaurantsInserted = 0;
        foreach (var r in diskRestaurants)
        {
            var filter = Builders<Restaurant>.Filter.Eq(x => x.Slug, r.Slug);
            var existing = await restaurantsCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                r.WebsiteId = siteId;
                r.Website = siteId;
                await restaurantsCol.InsertOneAsync(r);
                restaurantsInserted++;
            }
        }
        counts["restaurants"] = restaurantsInserted;

        // 9. Categories
        var categoriesCol = db.GetCollection<Category>("categories");
        var diskCategories = LoadEntitiesFromDisk<Category>(siteId, "categories.json") ?? new List<Category>();
        int categoriesInserted = 0;
        foreach (var c in diskCategories)
        {
            var filter = Builders<Category>.Filter.Eq(x => x.Module, c.Module) & Builders<Category>.Filter.Eq(x => x.Slug, c.Slug);
            var existing = await categoriesCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                c.WebsiteId = siteId;
                await categoriesCol.InsertOneAsync(c);
                categoriesInserted++;
            }
        }
        counts["categories"] = categoriesInserted;

        // 10. Build Package Options
        var bpoCol = db.GetCollection<BuildPackageOption>("buildPackageOptions");
        var diskBpo = LoadEntitiesFromDisk<BuildPackageOption>(siteId, "build-package-options.json") ?? new List<BuildPackageOption>();
        int bpoInserted = 0;
        foreach (var b in diskBpo)
        {
            var filter = Builders<BuildPackageOption>.Filter.Eq(x => x.DestinationSlug, b.DestinationSlug);
            var existing = await bpoCol.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                b.WebsiteId = siteId;
                await bpoCol.InsertOneAsync(b);
                bpoInserted++;
            }
        }
        counts["buildPackageOptions"] = bpoInserted;

        // Guarantee all unique indexes
        await DatabaseIndexInitializer.EnsureIndexesForDatabaseAsync(db);

        return counts;
    }

    private static List<T> LoadEntitiesFromDisk<T>(string siteId, string fileName)
    {
        try
        {
            var currentDir = Directory.GetCurrentDirectory();
            var candidates = new[]
            {
                Path.Combine(currentDir, "seed", siteId, fileName),
                Path.Combine(currentDir, "seed", fileName),
                Path.Combine(currentDir, "..", "..", "seed", siteId, fileName),
                Path.Combine(AppContext.BaseDirectory, "seed", siteId, fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", siteId, fileName),
                Path.Combine(currentDir, "Catalog", "Fixtures", fileName)
            };

            foreach (var path in candidates)
            {
                if (System.IO.File.Exists(path))
                {
                    var json = System.IO.File.ReadAllText(path);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<T>>(json, opts);
                    if (list != null && list.Count > 0) return list;
                }
            }
        }
        catch
        {
        }
        return new List<T>();
    }

    private List<Tour> GetToursForSite(string siteId)
    {
        return siteId switch
        {
            "tripgoasia" => SeedDataCatalog.Website2Tours(),
            "technoheaven" => SeedDataCatalog.Website3Tours(),
            _ => SeedDataCatalog.Website1Tours()
        };
    }

    private List<Destination> GetDestinationsForSite(string siteId)
    {
        return siteId switch
        {
            "tripgoasia" => SeedDataCatalog.Website2Destinations(),
            "technoheaven" => SeedDataCatalog.Website3Destinations(),
            _ => SeedDataCatalog.Website1Destinations()
        };
    }
}
