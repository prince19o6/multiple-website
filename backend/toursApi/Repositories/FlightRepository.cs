using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ToursApi.Common;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class FlightRepository : IFlightRepository
{
    private readonly IMongoCollection<Flight> _flights;
    private static readonly ConcurrentDictionary<string, List<Flight>> _diskCatalogCache = new(StringComparer.OrdinalIgnoreCase);

    public FlightRepository(IMongoDatabase database)
    {
        _flights = database.GetCollection<Flight>("flights");
    }

    private string GetDatabaseName() =>
        _flights.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Flight> GetDiskCatalog()
    {
        var siteId = GetWebsiteId();

        return _diskCatalogCache.GetOrAdd(siteId, key =>
        {
            var fileName = "flights.json";
            var filePath = ToursApi.Common.SeedPathHelper.FindSeedFile(key, fileName)
                           ?? ToursApi.Common.SeedPathHelper.FindSeedFile("gujjutours", fileName);

            if (filePath != null && File.Exists(filePath))
            {
                try
                {
                    var json = File.ReadAllText(filePath);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<Flight>>(json, opts);
                    if (list != null && list.Count > 0) return list;
                }
                catch
                {
                }
            }

            return new List<Flight>();
        });
    }

    public async Task<FlightPagedResult> GetFlightsAsync(FlightFilterParams filters)
    {
        try
        {
            var builder = Builders<Flight>.Filter;
            var filter = builder.Eq(f => f.Status, "Active");

            if (!string.IsNullOrWhiteSpace(filters.From))
            {
                var from = filters.From.Trim();
                var regex = new BsonRegularExpression(from, "i");
                filter = filter & (
                    builder.Eq(f => f.FromAirport.Code, from.ToUpperInvariant()) |
                    builder.Regex(f => f.FromAirport.City, regex) |
                    builder.Regex(f => f.FromAirport.Name, regex)
                );
            }

            if (!string.IsNullOrWhiteSpace(filters.To))
            {
                var to = filters.To.Trim();
                var regex = new BsonRegularExpression(to, "i");
                filter = filter & (
                    builder.Eq(f => f.ToAirport.Code, to.ToUpperInvariant()) |
                    builder.Regex(f => f.ToAirport.City, regex) |
                    builder.Regex(f => f.ToAirport.Name, regex)
                );
            }

            if (!string.IsNullOrWhiteSpace(filters.CabinClass) && !filters.CabinClass.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var cls = filters.CabinClass.Trim();
                filter = filter & builder.Regex(f => f.CabinClass, new BsonRegularExpression(cls, "i"));
            }

            if (!string.IsNullOrWhiteSpace(filters.Airline))
            {
                var al = filters.Airline.Trim();
                filter = filter & (
                    builder.Eq(f => f.AirlineCode, al.ToUpperInvariant()) |
                    builder.Regex(f => f.Airline, new BsonRegularExpression(al, "i"))
                );
            }

            if (filters.NonStopOnly == true)
            {
                filter = filter & builder.Eq(f => f.StopsCount, 0);
            }

            if (filters.PureVegMealsOnly == true)
            {
                filter = filter & builder.Eq(f => f.Meals.PureVegGuaranteed, true);
            }

            if (filters.MinPrice.HasValue && filters.MinPrice > 0)
            {
                filter = filter & builder.Gte(f => f.Price, filters.MinPrice.Value);
            }

            if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
            {
                filter = filter & builder.Lte(f => f.Price, filters.MaxPrice.Value);
            }

            var total = await _flights.CountDocumentsAsync(filter);

            if (total > 0)
            {
                var query = _flights.Find(filter);

                query = filters.Sort?.ToLowerInvariant() switch
                {
                    "price_asc" => query.SortBy(f => f.Price),
                    "price_desc" => query.SortByDescending(f => f.Price),
                    "duration_asc" => query.SortBy(f => f.DurationMinutes),
                    "departure_asc" => query.SortBy(f => f.DepartureTime),
                    _ => query.SortBy(f => f.Price)
                };

                var skip = (filters.Page - 1) * filters.PageSize;
                var items = await query.Skip(skip).Limit(filters.PageSize).ToListAsync();
                UniqueImageRegistry.EnforceUniqueImages(items);

                return new FlightPagedResult
                {
                    Items = items,
                    Total = total,
                    Page = filters.Page,
                    PageSize = filters.PageSize
                };
            }
        }
        catch
        {
            // Fall back to seed
        }

        var allSeed = GetDiskCatalog();
        var qSeed = allSeed.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filters.From))
        {
            var from = filters.From.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(f =>
                (f.FromAirport != null && f.FromAirport.Code != null && f.FromAirport.Code.ToLower() == from) ||
                (f.FromAirport != null && f.FromAirport.City != null && f.FromAirport.City.ToLower().Contains(from)));
        }

        if (!string.IsNullOrWhiteSpace(filters.To))
        {
            var to = filters.To.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(f =>
                (f.ToAirport != null && f.ToAirport.Code != null && f.ToAirport.Code.ToLower() == to) ||
                (f.ToAirport != null && f.ToAirport.City != null && f.ToAirport.City.ToLower().Contains(to)));
        }

        if (filters.MinPrice.HasValue && filters.MinPrice > 0)
        {
            qSeed = qSeed.Where(f => f.Price >= filters.MinPrice.Value);
        }

        if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
        {
            qSeed = qSeed.Where(f => f.Price <= filters.MaxPrice.Value);
        }

        qSeed = filters.Sort?.ToLowerInvariant() switch
        {
            "price_asc" => qSeed.OrderBy(f => f.Price),
            "price_desc" => qSeed.OrderByDescending(f => f.Price),
            "duration_asc" => qSeed.OrderBy(f => f.DurationMinutes),
            _ => qSeed.OrderBy(f => f.Price)
        };

        var p = filters.Page < 1 ? 1 : filters.Page;
        var ps = filters.PageSize < 1 ? 20 : filters.PageSize;
        var list = qSeed.ToList();
        var pagedItems = list.Skip((p - 1) * ps).Take(ps).ToList();
        UniqueImageRegistry.EnforceUniqueImages(pagedItems);

        return new FlightPagedResult
        {
            Items = pagedItems,
            Total = list.Count,
            Page = p,
            PageSize = ps
        };
    }

    public async Task<Flight?> GetFlightBySlugAsync(string slug)
    {
        try
        {
            var f = await _flights.Find(f => (f.Slug == slug || f.FlightNumber == slug || f.FlightId == slug) && f.Status == "Active").FirstOrDefaultAsync();
            if (f != null) return f;
        }
        catch
        {
        }

        return GetDiskCatalog().FirstOrDefault(f => f.Slug == slug || f.FlightNumber == slug || f.FlightId == slug);
    }

    public async Task<Flight?> GetFlightByIdAsync(string id)
    {
        try
        {
            if (int.TryParse(id, out var numId))
            {
                var byNum = await _flights.Find(f => f.FlightNumericId == numId).FirstOrDefaultAsync();
                if (byNum != null) return byNum;
            }

            if (ObjectId.TryParse(id, out var objId))
            {
                var byObj = await _flights.Find(f => f.Id == id).FirstOrDefaultAsync();
                if (byObj != null) return byObj;
            }

            var f = await _flights.Find(f => f.FlightId == id || f.Slug == id || f.FlightNumber == id).FirstOrDefaultAsync();
            if (f != null) return f;
        }
        catch
        {
        }

        int.TryParse(id, out var parsedNum);
        return GetDiskCatalog().FirstOrDefault(f =>
            f.FlightId == id ||
            (parsedNum > 0 && f.FlightNumericId == parsedNum) ||
            f.Id == id ||
            f.Slug == id ||
            f.FlightNumber == id);
    }

    public async Task<List<Flight>> GetFlightsByRouteAsync(string routeSlug)
    {
        try
        {
            var list = await _flights.Find(f => f.RouteSlug == routeSlug && f.Status == "Active")
                .SortBy(f => f.Price)
                .ToListAsync();
            if (list != null && list.Count > 0) return list;
        }
        catch
        {
        }

        return GetDiskCatalog().Where(f => f.RouteSlug == routeSlug).OrderBy(f => f.Price).ToList();
    }

    public async Task<List<string>> AutocompleteAirportsAsync(string query, int limit = 8)
    {
        if (string.IsNullOrWhiteSpace(query)) return new List<string>();

        try
        {
            var regex = new BsonRegularExpression(query.Trim(), "i");
            var filter = Builders<Flight>.Filter.Or(
                Builders<Flight>.Filter.Regex(f => f.FromAirport.City, regex),
                Builders<Flight>.Filter.Regex(f => f.FromAirport.Code, regex),
                Builders<Flight>.Filter.Regex(f => f.ToAirport.City, regex),
                Builders<Flight>.Filter.Regex(f => f.ToAirport.Code, regex)
            );

            var flights = await _flights.Find(filter).Limit(40).ToListAsync();
            if (flights != null && flights.Count > 0)
            {
                var results = new HashSet<string>();
                foreach (var f in flights)
                {
                    results.Add($"{f.FromAirport.City} ({f.FromAirport.Code})");
                    results.Add($"{f.ToAirport.City} ({f.ToAirport.Code})");
                }
                return results.Take(limit).ToList();
            }
        }
        catch
        {
        }

        var q = query.Trim().ToLowerInvariant();
        return GetDiskCatalog()
            .SelectMany(f => new[] { $"{f.FromAirport?.City} ({f.FromAirport?.Code})", $"{f.ToAirport?.City} ({f.ToAirport?.Code})" })
            .Where(s => !string.IsNullOrWhiteSpace(s) && s.ToLower().Contains(q))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .ToList();
    }

    public async Task<List<FlightAirport>> GetAllAirportsAsync()
    {
        var airports = new Dictionary<string, FlightAirport>(StringComparer.OrdinalIgnoreCase);

        try
        {
            var flights = await _flights.Find(Builders<Flight>.Filter.Empty).Limit(200).ToListAsync();
            foreach (var f in flights)
            {
                if (f.FromAirport != null && !string.IsNullOrWhiteSpace(f.FromAirport.Code))
                    airports[f.FromAirport.Code] = f.FromAirport;
                if (f.ToAirport != null && !string.IsNullOrWhiteSpace(f.ToAirport.Code))
                    airports[f.ToAirport.Code] = f.ToAirport;
            }
        }
        catch { }

        if (airports.Count == 0)
        {
            foreach (var f in GetDiskCatalog())
            {
                if (f.FromAirport != null && !string.IsNullOrWhiteSpace(f.FromAirport.Code))
                    airports[f.FromAirport.Code] = f.FromAirport;
                if (f.ToAirport != null && !string.IsNullOrWhiteSpace(f.ToAirport.Code))
                    airports[f.ToAirport.Code] = f.ToAirport;
            }
        }

        if (airports.Count == 0)
        {
            airports["DEL"] = new FlightAirport { Code = "DEL", City = "Delhi", Name = "Indira Gandhi International Airport", Country = "India", Terminal = "T3" };
            airports["BOM"] = new FlightAirport { Code = "BOM", City = "Mumbai", Name = "Chhatrapati Shivaji Maharaj Intl", Country = "India", Terminal = "T2" };
            airports["DXB"] = new FlightAirport { Code = "DXB", City = "Dubai", Name = "Dubai International Airport", Country = "UAE", Terminal = "T3" };
            airports["AMD"] = new FlightAirport { Code = "AMD", City = "Ahmedabad", Name = "Sardar Vallabhbhai Patel Intl", Country = "India", Terminal = "T2" };
            airports["STV"] = new FlightAirport { Code = "STV", City = "Surat", Name = "Surat International Airport", Country = "India", Terminal = "T1" };
            airports["BKK"] = new FlightAirport { Code = "BKK", City = "Bangkok", Name = "Suvarnabhumi Airport", Country = "Thailand", Terminal = "Main" };
            airports["SIN"] = new FlightAirport { Code = "SIN", City = "Singapore", Name = "Singapore Changi Airport", Country = "Singapore", Terminal = "T3" };
            airports["LHR"] = new FlightAirport { Code = "LHR", City = "London", Name = "London Heathrow Airport", Country = "United Kingdom", Terminal = "T5" };
        }

        return airports.Values.OrderBy(a => a.City).ToList();
    }

    public async Task CreateFlightAsync(Flight flight)
    {
        flight.CreatedAt = DateTime.UtcNow;
        try
        {
            await _flights.InsertOneAsync(flight);
        }
        catch
        {
        }
    }

    public async Task<bool> UpdateFlightAsync(string id, Flight flight)
    {
        try
        {
            var result = await _flights.ReplaceOneAsync(f => f.Id == id, flight);
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteFlightAsync(string id)
    {
        try
        {
            var result = await _flights.UpdateOneAsync(
                f => f.Id == id,
                Builders<Flight>.Update.Set(f => f.Status, "Deleted")
            );
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }
}
