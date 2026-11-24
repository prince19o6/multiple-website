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

public class VisaRepository : IVisaRepository
{
    private readonly IMongoCollection<Visa> _visas;
    private static readonly ConcurrentDictionary<string, List<Visa>> _diskCatalogCache = new(StringComparer.OrdinalIgnoreCase);

    public VisaRepository(IMongoDatabase database)
    {
        _visas = database.GetCollection<Visa>("visas");
    }

    private string GetDatabaseName() =>
        _visas.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Visa> GetDiskCatalog()
    {
        var siteId = GetWebsiteId();

        return _diskCatalogCache.GetOrAdd(siteId, key =>
        {
            var fileName = "visas.json";
            var filePath = ToursApi.Common.SeedPathHelper.FindSeedFile(key, fileName)
                           ?? ToursApi.Common.SeedPathHelper.FindSeedFile("gujjutours", fileName);

            if (filePath != null && File.Exists(filePath))
            {
                try
                {
                    var json = File.ReadAllText(filePath);
                    var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<Visa>>(json, opts);
                    if (list != null && list.Count > 0) return list;
                }
                catch
                {
                }
            }

            return new List<Visa>();
        });
    }

    public async Task<VisaPagedResult> GetVisasAsync(VisaFilterParams filters)
    {
        try
        {
            var builder = Builders<Visa>.Filter;
            var filter = builder.Eq(v => v.Status, "Active");

            var searchKey = !string.IsNullOrWhiteSpace(filters.Search) ? filters.Search : filters.Country;
            if (!string.IsNullOrWhiteSpace(searchKey))
            {
                var cleanCountry = System.Text.RegularExpressions.Regex.Replace(searchKey.Trim(), @"\s*\([^)]*\)", "").Trim();
                var countryPattern = System.Text.RegularExpressions.Regex.Escape(cleanCountry);
                var regex = new BsonRegularExpression(countryPattern, "i");
                filter = filter & (
                    builder.Regex(v => v.Country, regex) |
                    builder.Regex(v => v.CountryCode, regex) |
                    builder.Regex(v => v.CountrySlug, regex) |
                    builder.Regex(v => v.Title, regex)
                );
            }

            if (!string.IsNullOrWhiteSpace(filters.CountryCode))
            {
                var code = filters.CountryCode.Trim().ToUpperInvariant();
                filter = filter & builder.Eq(v => v.CountryCode, code);
            }

            var typeFilter = !string.IsNullOrWhiteSpace(filters.VisaType) ? filters.VisaType : filters.Category;
            if (!string.IsNullOrWhiteSpace(typeFilter) && !typeFilter.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var vType = typeFilter.Trim().ToLowerInvariant();
                filter = filter & builder.Eq(v => v.VisaType, vType);
            }

            if (!string.IsNullOrWhiteSpace(filters.Continent) && !filters.Continent.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var cont = filters.Continent.Trim();
                filter = filter & builder.Regex(v => v.Continent, new BsonRegularExpression(cont, "i"));
            }

            if (filters.MinPrice.HasValue && filters.MinPrice > 0)
            {
                filter = filter & builder.Gte(v => v.Price, filters.MinPrice.Value);
            }

            if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
            {
                filter = filter & builder.Lte(v => v.Price, filters.MaxPrice.Value);
            }

            var total = await _visas.CountDocumentsAsync(filter);

            if (total > 0)
            {
                var query = _visas.Find(filter);

                switch (filters.Sort?.ToLowerInvariant())
                {
                    case "price_asc":
                        query = query.SortBy(v => v.Price);
                        break;
                    case "price_desc":
                        query = query.SortByDescending(v => v.Price);
                        break;
                    case "rating_desc":
                        query = query.SortByDescending(v => v.Rating).ThenByDescending(v => v.Reviews);
                        break;
                    case "popular":
                    default:
                        query = query.SortByDescending(v => v.Featured).ThenByDescending(v => v.Rating);
                        break;
                }

                var page = filters.Page < 1 ? 1 : filters.Page;
                var pageSize = filters.PageSize < 1 ? 20 : filters.PageSize;

                var items = await query
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                return new VisaPagedResult
                {
                    Items = items,
                    Total = total,
                    Page = page,
                    PageSize = pageSize
                };
            }
        }
        catch
        {
            // Fall back to disk seed
        }

        // Offline / seed fallback
        var allVisas = GetDiskCatalog();
        var querySeed = allVisas.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filters.Country))
        {
            var cleanCountry = System.Text.RegularExpressions.Regex.Replace(filters.Country.Trim(), @"\s*\([^)]*\)", "").Trim().ToLowerInvariant();
            querySeed = querySeed.Where(v =>
                (v.Country != null && (v.Country.ToLower().Contains(cleanCountry) || cleanCountry.Contains(v.Country.ToLower()))) ||
                (v.CountryCode != null && v.CountryCode.ToLower().Contains(cleanCountry)) ||
                (v.CountrySlug != null && v.CountrySlug.ToLower().Contains(cleanCountry)) ||
                (v.Title != null && v.Title.ToLower().Contains(cleanCountry)));
        }

        if (!string.IsNullOrWhiteSpace(filters.CountryCode))
        {
            var cc = filters.CountryCode.Trim().ToLowerInvariant();
            querySeed = querySeed.Where(v => v.CountryCode != null && v.CountryCode.ToLower() == cc);
        }

        if (!string.IsNullOrWhiteSpace(filters.VisaType) && !filters.VisaType.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var vt = filters.VisaType.Trim().ToLowerInvariant();
            querySeed = querySeed.Where(v => v.VisaType != null && v.VisaType.ToLower() == vt);
        }

        if (!string.IsNullOrWhiteSpace(filters.Continent) && !filters.Continent.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cont = filters.Continent.Trim().ToLowerInvariant();
            querySeed = querySeed.Where(v => v.Continent != null && v.Continent.ToLower().Contains(cont));
        }

        if (filters.MinPrice.HasValue && filters.MinPrice > 0)
        {
            querySeed = querySeed.Where(v => v.Price >= filters.MinPrice.Value);
        }

        if (filters.MaxPrice.HasValue && filters.MaxPrice > 0)
        {
            querySeed = querySeed.Where(v => v.Price <= filters.MaxPrice.Value);
        }

        switch (filters.Sort?.ToLowerInvariant())
        {
            case "price_asc":
                querySeed = querySeed.OrderBy(v => v.Price);
                break;
            case "price_desc":
                querySeed = querySeed.OrderByDescending(v => v.Price);
                break;
            case "rating_desc":
                querySeed = querySeed.OrderByDescending(v => v.Rating).ThenByDescending(v => v.Reviews);
                break;
            default:
                querySeed = querySeed.OrderByDescending(v => v.Featured).ThenByDescending(v => v.Rating);
                break;
        }

        var p = filters.Page < 1 ? 1 : filters.Page;
        var ps = filters.PageSize < 1 ? 20 : filters.PageSize;
        var seedList = querySeed.ToList();

        return new VisaPagedResult
        {
            Items = seedList.Skip((p - 1) * ps).Take(ps).ToList(),
            Total = seedList.Count,
            Page = p,
            PageSize = ps
        };
    }

    public async Task<List<CountryVisaSummary>> GetCountrySummariesAsync()
    {
        List<Visa> allVisas;
        try
        {
            allVisas = await _visas.Find(v => v.Status == "Active").ToListAsync();
            if (allVisas == null || allVisas.Count == 0)
            {
                allVisas = GetDiskCatalog();
            }
        }
        catch
        {
            allVisas = GetDiskCatalog();
        }

        return allVisas
            .GroupBy(v => v.CountrySlug ?? v.Country?.ToLowerInvariant() ?? "intl")
            .Select(g =>
            {
                var first = g.First();
                return new CountryVisaSummary
                {
                    Country = first.Country,
                    CountryCode = first.CountryCode,
                    CountrySlug = first.CountrySlug,
                    Flag = first.Flag,
                    Continent = first.Continent,
                    StartingPrice = g.Min(x => x.Price),
                    Currency = first.Currency,
                    ApprovalRate = Math.Round(g.Average(x => x.ApprovalRate), 1),
                    TotalOptions = g.Count(),
                    SampleImage = first.Image
                };
            })
            .OrderBy(c => c.Country)
            .ToList();
    }

    public async Task<List<Visa>> GetVisasByCountrySlugAsync(string countrySlug)
    {
        if (string.IsNullOrWhiteSpace(countrySlug)) return new List<Visa>();
        var slug = countrySlug.Trim().ToLowerInvariant();

        try
        {
            var items = await _visas
                .Find(v => (v.CountrySlug == slug || v.Country.ToLower() == slug) && v.Status == "Active")
                .SortBy(v => v.Price)
                .ToListAsync();

            if (items != null && items.Count > 0) return items;
        }
        catch
        {
        }

        return GetDiskCatalog()
            .Where(v => (v.CountrySlug != null && v.CountrySlug.ToLower() == slug) || (v.Country != null && v.Country.ToLower() == slug))
            .OrderBy(v => v.Price)
            .ToList();
    }

    public async Task<Visa?> GetVisaBySlugAsync(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;
        var cleanSlug = slug.Trim().ToLowerInvariant();

        try
        {
            var v = await _visas
                .Find(v => v.Slug == cleanSlug || v.CountrySlug == cleanSlug)
                .FirstOrDefaultAsync();
            if (v != null) return v;
        }
        catch
        {
        }

        return GetDiskCatalog().FirstOrDefault(v =>
            (v.Slug != null && v.Slug.ToLower() == cleanSlug) ||
            (v.CountrySlug != null && v.CountrySlug.ToLower() == cleanSlug));
    }

    public async Task<Visa?> GetVisaByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;

        try
        {
            var builder = Builders<Visa>.Filter;
            FilterDefinition<Visa> filter = builder.Eq(v => v.VisaId, id);

            if (int.TryParse(id, out var numId))
            {
                filter = filter | builder.Eq(v => v.VisaNumericId, numId);
            }

            if (ObjectId.TryParse(id, out _))
            {
                filter = filter | builder.Eq(v => v.Id, id);
            }

            var v = await _visas.Find(filter).FirstOrDefaultAsync();
            if (v != null) return v;
        }
        catch
        {
        }

        int.TryParse(id, out var parsedNum);
        return GetDiskCatalog().FirstOrDefault(v =>
            v.VisaId == id ||
            (parsedNum > 0 && v.VisaNumericId == parsedNum) ||
            v.Id == id ||
            v.Slug == id);
    }

    public async Task<List<string>> AutocompleteCountriesAsync(string query, int limit = 8)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                var countries = await _visas.Distinct<string>("Country", Builders<Visa>.Filter.Empty).ToListAsync();
                if (countries != null && countries.Count > 0) return countries.Take(limit).ToList();
            }
            else
            {
                var regex = new BsonRegularExpression(query.Trim(), "i");
                var filter = Builders<Visa>.Filter.Regex(v => v.Country, regex);
                var matches = await _visas.Distinct<string>("Country", filter).ToListAsync();
                if (matches != null && matches.Count > 0) return matches.Take(limit).ToList();
            }
        }
        catch
        {
        }

        var seedCountries = GetDiskCatalog()
            .Select(v => v.Country)
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLowerInvariant();
            seedCountries = seedCountries.Where(c => c.ToLower().Contains(q));
        }

        return seedCountries.Take(limit).ToList();
    }

    public async Task CreateVisaAsync(Visa visa)
    {
        if (string.IsNullOrEmpty(visa.Id))
        {
            visa.Id = ObjectId.GenerateNewId().ToString();
        }
        try
        {
            await _visas.InsertOneAsync(visa);
        }
        catch
        {
        }
    }

    public async Task<bool> UpdateVisaAsync(string id, Visa visa)
    {
        try
        {
            var filter = Builders<Visa>.Filter.Eq(v => v.Id, id);
            var result = await _visas.ReplaceOneAsync(filter, visa);
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteVisaAsync(string id)
    {
        try
        {
            var filter = Builders<Visa>.Filter.Eq(v => v.Id, id);
            var result = await _visas.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }
        catch
        {
            return false;
        }
    }
}
