using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class TransferRepository : ITransferRepository
{
    private readonly IMongoCollection<Transfer> _transfers;
    private static readonly ConcurrentDictionary<string, List<Transfer>> _diskCatalogCache = new(StringComparer.OrdinalIgnoreCase);

    public TransferRepository(IMongoDatabase database)
    {
        _transfers = database.GetCollection<Transfer>("transfers");
    }

    private string GetDatabaseName() =>
        _transfers.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Transfer> GetDiskCatalog()
    {
        var siteId = GetWebsiteId();

        return _diskCatalogCache.GetOrAdd(siteId, key =>
        {
            var fileName = "transfers.json";
            var currentDir = Directory.GetCurrentDirectory();
            var candidates = new[]
            {
                Path.Combine(currentDir, "seed", key, fileName),
                Path.Combine(currentDir, "backend", "toursApi", "seed", key, fileName),
                Path.Combine(currentDir, "..", "..", "seed", key, fileName),
                Path.Combine(AppContext.BaseDirectory, "seed", key, fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", key, fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "toursApi", "seed", key, fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "web", "seed", key, fileName),
                Path.Combine(currentDir, "seed", "gujjutours", fileName),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "seed", "gujjutours", fileName)
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    try
                    {
                        var json = File.ReadAllText(path);
                        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var list = JsonSerializer.Deserialize<List<Transfer>>(json, opts);
                        if (list != null && list.Count > 0) return list;
                    }
                    catch
                    {
                    }
                }
            }

            return new List<Transfer>();
        });
    }

    public async Task<TransferPagedResult> GetTransfersAsync(TransferFilterParams filters)
    {
        try
        {
            var builder = Builders<Transfer>.Filter;
            var filter = builder.Eq(t => t.Status, "Active");

            if (!string.IsNullOrWhiteSpace(filters.City))
            {
                var city = filters.City.Trim();
                var regex = new BsonRegularExpression(city, "i");
                filter = filter & (
                    builder.Regex(t => t.City, regex) |
                    builder.Regex(t => t.Country, regex) |
                    builder.Regex(t => t.PickupLocation, regex) |
                    builder.Regex(t => t.DropoffLocation, regex) |
                    builder.Regex(t => t.Title, regex)
                );
            }

            if (!string.IsNullOrWhiteSpace(filters.TransferType) && !filters.TransferType.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var type = filters.TransferType.Trim().ToLowerInvariant();
                filter = filter & builder.Eq(t => t.TransferType, type);
            }

            if (!string.IsNullOrWhiteSpace(filters.VehicleType) && !filters.VehicleType.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var vType = filters.VehicleType.Trim();
                filter = filter & builder.Regex(t => t.VehicleType, new BsonRegularExpression(vType, "i"));
            }

            if (filters.Passengers.HasValue && filters.Passengers > 0)
            {
                filter = filter & builder.Gte(t => t.MaxPassengers, filters.Passengers.Value);
            }

            if (filters.MinPrice.HasValue && filters.MinPrice > 0)
            {
                filter = filter & builder.Gte(t => t.Price, filters.MinPrice.Value);
            }

            if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
            {
                filter = filter & builder.Lte(t => t.Price, filters.MaxPrice.Value);
            }

            var total = await _transfers.CountDocumentsAsync(filter);

            if (total > 0)
            {
                var query = _transfers.Find(filter);

                query = filters.Sort?.ToLowerInvariant() switch
                {
                    "price_asc" => query.SortBy(t => t.Price),
                    "price_desc" => query.SortByDescending(t => t.Price),
                    "rating_desc" => query.SortByDescending(t => t.Rating),
                    _ => query.SortBy(t => t.Price)
                };

                var skip = (filters.Page - 1) * filters.PageSize;
                var items = await query.Skip(skip).Limit(filters.PageSize).ToListAsync();

                return new TransferPagedResult
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

        if (!string.IsNullOrWhiteSpace(filters.City))
        {
            var city = filters.City.Trim().ToLowerInvariant();
            qSeed = qSeed.Where(t =>
                (t.City != null && t.City.ToLower().Contains(city)) ||
                (t.Country != null && t.Country.ToLower().Contains(city)) ||
                (t.PickupLocation != null && t.PickupLocation.ToLower().Contains(city)) ||
                (t.DropoffLocation != null && t.DropoffLocation.ToLower().Contains(city)) ||
                (t.Title != null && t.Title.ToLower().Contains(city)));
        }

        if (filters.MinPrice.HasValue && filters.MinPrice > 0)
        {
            qSeed = qSeed.Where(t => t.Price >= filters.MinPrice.Value);
        }

        if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
        {
            qSeed = qSeed.Where(t => t.Price <= filters.MaxPrice.Value);
        }

        qSeed = filters.Sort?.ToLowerInvariant() switch
        {
            "price_asc" => qSeed.OrderBy(t => t.Price),
            "price_desc" => qSeed.OrderByDescending(t => t.Price),
            "rating_desc" => qSeed.OrderByDescending(t => t.Rating),
            _ => qSeed.OrderBy(t => t.Price)
        };

        var page = filters.Page < 1 ? 1 : filters.Page;
        var pageSize = filters.PageSize < 1 ? 20 : filters.PageSize;
        var list = qSeed.ToList();

        return new TransferPagedResult
        {
            Items = list.Skip((page - 1) * pageSize).Take(pageSize).ToList(),
            Total = list.Count,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<Transfer?> GetTransferBySlugAsync(string slug)
    {
        try
        {
            var t = await _transfers.Find(t => t.Slug == slug && t.Status == "Active").FirstOrDefaultAsync();
            if (t != null) return t;
        }
        catch
        {
        }

        return GetDiskCatalog().FirstOrDefault(t => t.Slug != null && t.Slug.ToLower() == slug.ToLower());
    }

    public async Task<Transfer?> GetTransferByIdAsync(string id)
    {
        try
        {
            if (int.TryParse(id, out var numId))
            {
                var byNum = await _transfers.Find(t => t.TransferNumericId == numId).FirstOrDefaultAsync();
                if (byNum != null) return byNum;
            }

            if (ObjectId.TryParse(id, out var objId))
            {
                var byObj = await _transfers.Find(t => t.Id == id).FirstOrDefaultAsync();
                if (byObj != null) return byObj;
            }

            var t = await _transfers.Find(t => t.TransferId == id || t.Slug == id).FirstOrDefaultAsync();
            if (t != null) return t;
        }
        catch
        {
        }

        int.TryParse(id, out var parsedNum);
        return GetDiskCatalog().FirstOrDefault(t =>
            t.TransferId == id ||
            (parsedNum > 0 && t.TransferNumericId == parsedNum) ||
            t.Id == id ||
            t.Slug == id);
    }

    public async Task<List<string>> AutocompleteLocationsAsync(string query, int limit = 8)
    {
        if (string.IsNullOrWhiteSpace(query)) return new List<string>();

        try
        {
            var regex = new BsonRegularExpression(query.Trim(), "i");
            var filter = Builders<Transfer>.Filter.Or(
                Builders<Transfer>.Filter.Regex(t => t.City, regex),
                Builders<Transfer>.Filter.Regex(t => t.PickupLocation, regex),
                Builders<Transfer>.Filter.Regex(t => t.DropoffLocation, regex)
            );

            var list = await _transfers.Find(filter).Limit(30).ToListAsync();
            if (list != null && list.Count > 0)
            {
                var results = new HashSet<string>();
                foreach (var t in list)
                {
                    results.Add(t.City);
                    results.Add(t.PickupLocation);
                }
                return results.Take(limit).ToList();
            }
        }
        catch
        {
        }

        var q = query.Trim().ToLowerInvariant();
        return GetDiskCatalog()
            .SelectMany(t => new[] { t.City, t.PickupLocation, t.DropoffLocation })
            .Where(s => !string.IsNullOrWhiteSpace(s) && s.ToLower().Contains(q))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .ToList();
    }

    public async Task CreateTransferAsync(Transfer transfer)
    {
        transfer.CreatedAt = DateTime.UtcNow;
        try
        {
            await _transfers.InsertOneAsync(transfer);
        }
        catch
        {
        }
    }

    public async Task<bool> UpdateTransferAsync(string id, Transfer transfer)
    {
        try
        {
            var result = await _transfers.ReplaceOneAsync(t => t.Id == id, transfer);
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteTransferAsync(string id)
    {
        try
        {
            var result = await _transfers.UpdateOneAsync(
                t => t.Id == id,
                Builders<Transfer>.Update.Set(t => t.Status, "Deleted")
            );
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }
}
