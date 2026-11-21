using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
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
    private readonly ITenantSeedService _seedService;

    public SeedController(
        IMongoDatabase database,
        IWebsiteContext websiteContext,
        IMongoDatabaseProvider databaseProvider,
        ITenantSeedService seedService)
    {
        _database = database;
        _websiteContext = websiteContext;
        _databaseProvider = databaseProvider;
        _seedService = seedService;
    }

    /// <summary>
    /// Idempotent seed for the active website tenant database.
    /// Seeds all canonical modules: hotels, tours, packages, flights, transfers, visas, restaurants, buildpackage, activities.
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
            var result = await _seedService.SeedTenantDatabaseAsync(_database, siteId);

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

        var results = await _seedService.SeedAllTenantsAsync();

        return Ok(new
        {
            success = true,
            message = "All 3 tenant databases seeded successfully.",
            tenants = results
        });
    }

    private Task<Dictionary<string, int>> SeedTenantDatabaseAsync(IMongoDatabase db, string siteId)
    {
        return _seedService.SeedTenantDatabaseAsync(db, siteId);
    }

    private static List<Tour> GetToursForSite(string siteId)
    {
        return (siteId?.ToLowerInvariant()) switch
        {
            "tripgoasia" => ToursApi.Configuration.SeedDataCatalog.Website2Tours(),
            "technoheaven" => ToursApi.Configuration.SeedDataCatalog.Website3Tours(),
            _ => ToursApi.Configuration.SeedDataCatalog.Website1Tours()
        };
    }

    private static List<Destination> GetDestinationsForSite(string siteId)
    {
        return (siteId?.ToLowerInvariant()) switch
        {
            "tripgoasia" => ToursApi.Configuration.SeedDataCatalog.Website2Destinations(),
            "technoheaven" => ToursApi.Configuration.SeedDataCatalog.Website3Destinations(),
            _ => ToursApi.Configuration.SeedDataCatalog.Website1Destinations()
        };
    }
}
