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
}
