using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.IO;
using System.Text.Json;
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

    public SeedController(IMongoDatabase database, IWebsiteContext websiteContext)
    {
        _database = database;
        _websiteContext = websiteContext;
    }

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
            var siteId = _websiteContext.CurrentWebsiteId;
            var toursCollection = _database.GetCollection<Tour>("tours");
            var destinationsCollection = _database.GetCollection<Destination>("destinations");

            // Scoped strictly to this website's isolated database
            await toursCollection.DeleteManyAsync(Builders<Tour>.Filter.Empty);
            await destinationsCollection.DeleteManyAsync(Builders<Destination>.Filter.Empty);

            var tours = GetToursForSite(siteId);
            var destinations = GetDestinationsForSite(siteId);

            if (tours.Count > 0)
            {
                await toursCollection.InsertManyAsync(tours);
            }

            if (destinations.Count > 0)
            {
                await destinationsCollection.InsertManyAsync(destinations);
            }

            // Ensure unique indexes on this database
            await DatabaseIndexInitializer.EnsureIndexesForDatabaseAsync(_database);

            return Ok(new
            {
                success = true,
                websiteId = siteId,
                database = _database.DatabaseNamespace.DatabaseName,
                message = $"Seeded {tours.Count} tours and {destinations.Count} destinations into '{_database.DatabaseNamespace.DatabaseName}' for website '{siteId}'.",
                data = new { toursCount = tours.Count, destinationsCount = destinations.Count },
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    private List<Tour> GetToursForSite(string siteId)
    {
        // Try reading seed/tours.<siteId>.json from disk first
        var diskTours = LoadToursFromDisk(siteId);
        if (diskTours.Count > 0) return diskTours;

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

    private static List<Tour> LoadToursFromDisk(string siteId)
    {
        try
        {
            var fileName = $"tours.{siteId}.json";
            var currentDir = Directory.GetCurrentDirectory();
            var candidates = new[]
            {
                Path.Combine(currentDir, "seed", fileName),
                Path.Combine(currentDir, "..", "..", "seed", fileName),
                Path.Combine(AppContext.BaseDirectory, "seed", fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", fileName)
            };

            foreach (var path in candidates)
            {
                if (System.IO.File.Exists(path))
                {
                    var json = System.IO.File.ReadAllText(path);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<Tour>>(json, opts);
                    if (list != null && list.Count > 0) return list;
                }
            }
        }
        catch
        {
        }
        return new List<Tour>();
    }
}