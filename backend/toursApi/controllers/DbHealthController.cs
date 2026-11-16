using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/health/db")]
public class DbHealthController : ControllerBase
{
    private readonly IMongoDatabase _database;
    private readonly IWebsiteContext _websiteContext;

    public DbHealthController(IMongoDatabase database, IWebsiteContext websiteContext)
    {
        _database = database;
        _websiteContext = websiteContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetDbHealth()
    {
        var dbName = _database.DatabaseNamespace.DatabaseName;
        var websiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";

        try
        {
            var sw = Stopwatch.StartNew();
            var pingCommand = (Command<BsonDocument>)"{ping:1}";
            await _database.RunCommandAsync(pingCommand);
            sw.Stop();
            var latencyMs = sw.ElapsedMilliseconds;

            var toursCount = await _database.GetCollection<BsonDocument>("tours").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var destinationsCount = await _database.GetCollection<BsonDocument>("destinations").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var usersCount = await _database.GetCollection<BsonDocument>("users").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var bookingsCount = await _database.GetCollection<BsonDocument>("bookings").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);

            Response.Headers["X-Data-Source"] = "mongodb";

            return Ok(new
            {
                status = "healthy",
                database = dbName,
                website = websiteId,
                pingLatencyMs = latencyMs,
                collections = new
                {
                    tours = toursCount,
                    destinations = destinationsCount,
                    users = usersCount,
                    bookings = bookingsCount
                }
            });
        }
        catch (Exception ex)
        {
            Response.Headers["X-Data-Source"] = "mongodb";
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "unhealthy",
                error = "Database unavailable",
                message = $"Failed to connect to MongoDB database '{dbName}'",
                website = websiteId,
                details = ex.Message
            });
        }
    }

    [HttpGet("/api/health/booking")]
    public async Task<IActionResult> GetBookingHealth()
    {
        var dbName = _database.DatabaseNamespace.DatabaseName;
        var websiteId = _websiteContext.CurrentWebsiteId ?? "gujjutours";

        try
        {
            var sw = Stopwatch.StartNew();
            var pingCommand = (Command<BsonDocument>)"{ping:1}";
            await _database.RunCommandAsync(pingCommand);
            sw.Stop();

            var toursCount = await _database.GetCollection<BsonDocument>("tours").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var hotelsCount = await _database.GetCollection<BsonDocument>("hotels").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var flightsCount = await _database.GetCollection<BsonDocument>("flights").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var packagesCount = await _database.GetCollection<BsonDocument>("packages").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var restaurantsCount = await _database.GetCollection<BsonDocument>("restaurants").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var transfersCount = await _database.GetCollection<BsonDocument>("transfers").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var visasCount = await _database.GetCollection<BsonDocument>("visas").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var buildPackageCount = await _database.GetCollection<BsonDocument>("buildPackageOptions").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var bookingsCount = await _database.GetCollection<BsonDocument>("bookings").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);
            var emailOutboxCount = await _database.GetCollection<BsonDocument>("email_outbox").CountDocumentsAsync(FilterDefinition<BsonDocument>.Empty);

            return Ok(new
            {
                status = "healthy",
                database = dbName,
                website = websiteId,
                pingLatencyMs = sw.ElapsedMilliseconds,
                collections = new
                {
                    tours = toursCount,
                    hotels = hotelsCount,
                    flights = flightsCount,
                    packages = packagesCount,
                    restaurants = restaurantsCount,
                    transfers = transfersCount,
                    visas = visasCount,
                    buildPackageOptions = buildPackageCount,
                    bookings = bookingsCount,
                    emailOutbox = emailOutboxCount
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "unhealthy",
                database = dbName,
                website = websiteId,
                error = ex.Message
            });
        }
    }
}
