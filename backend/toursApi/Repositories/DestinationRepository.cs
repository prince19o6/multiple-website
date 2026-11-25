using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using ToursApi.Common;
using ToursApi.Configuration;
using ToursApi.Exceptions;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class DestinationRepository : IDestinationRepository
{
    private readonly IMongoCollection<Destination> _destinations;
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private readonly ILogger<DestinationRepository>? _logger;

    public DestinationRepository(
        IMongoDatabase database,
        IHttpContextAccessor? httpContextAccessor = null,
        ILogger<DestinationRepository>? logger = null)
    {
        _destinations = database.GetCollection<Destination>("destinations");
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    private static bool IsSeedFallbackAllowed() =>
        Environment.GetEnvironmentVariable("ALLOW_SEED_FALLBACK")?.Trim().Equals("false", StringComparison.OrdinalIgnoreCase) != true;

    private void SetDataSourceHeader(string source)
    {
        try
        {
            var response = _httpContextAccessor?.HttpContext?.Response;
            if (response != null && !response.HasStarted)
            {
                response.Headers["X-Data-Source"] = source;
            }
        }
        catch
        {
            // Ignore response header mutation exceptions if response stream already started
        }
    }

    private string GetDatabaseName() =>
        _destinations.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";

    private string GetWebsiteId()
    {
        var dbName = GetDatabaseName();
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    private List<Destination> GetCatalogDestinations()
    {
        var siteId = GetWebsiteId();

        return siteId switch
        {
            "tripgoasia" => SeedDataCatalog.Website2Destinations(),
            "technoheaven" => SeedDataCatalog.Website3Destinations(),
            _ => SeedDataCatalog.Website1Destinations()
        };
    }

    public async Task<IEnumerable<Destination>> GetAllAsync()
    {
        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var list = await _destinations
                .Find(FilterDefinition<Destination>.Empty)
                .SortBy(d => d.SortOrder)
                .ToListAsync();

            UniqueImageRegistry.EnforceUniqueImages(list);
            SetDataSourceHeader("mongodb");
            return list;
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[DestinationRepository.GetAllAsync] MongoDB query failed. ALLOW_SEED_FALLBACK is enabled, falling back to catalog destinations for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[DestinationRepository.GetAllAsync] MongoDB unreachable for database '{DatabaseName}'. ALLOW_SEED_FALLBACK is disabled.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        var fallbackDests = GetCatalogDestinations();
        UniqueImageRegistry.EnforceUniqueImages(fallbackDests);
        return fallbackDests;
    }

    public async Task<Destination?> GetByIdAsync(string id)
    {
        var dbName = GetDatabaseName();
        var siteId = GetWebsiteId();

        try
        {
            var item = await _destinations
                .Find(d => d.Id == id)
                .FirstOrDefaultAsync();

            SetDataSourceHeader("mongodb");
            return item;
        }
        catch (Exception ex)
        {
            if (IsSeedFallbackAllowed())
            {
                _logger?.LogWarning(ex, "[DestinationRepository.GetByIdAsync] MongoDB query failed. ALLOW_SEED_FALLBACK is enabled, falling back to catalog destination for '{DatabaseName}'.", dbName);
                SetDataSourceHeader("seed-fallback");
            }
            else
            {
                _logger?.LogError(ex, "[DestinationRepository.GetByIdAsync] MongoDB unreachable for database '{DatabaseName}'. ALLOW_SEED_FALLBACK is disabled.", dbName);
                throw new MongoDatabaseUnavailableException(dbName, siteId, $"Failed to connect to MongoDB database '{dbName}'", ex);
            }
        }

        return GetCatalogDestinations().FirstOrDefault(d => string.Equals(d.Id, id, StringComparison.OrdinalIgnoreCase) || string.Equals(d.Name, id, StringComparison.OrdinalIgnoreCase));
    }

    public async Task CreateAsync(Destination destination)
    {
        await _destinations.InsertOneAsync(destination);
        SetDataSourceHeader("mongodb");
    }

    public async Task UpdateAsync(string id, Destination destination)
    {
        destination.Id = id;
        await _destinations.ReplaceOneAsync(d => d.Id == id, destination);
        SetDataSourceHeader("mongodb");
    }

    public async Task DeleteAsync(string id)
    {
        await _destinations.DeleteOneAsync(d => d.Id == id);
        SetDataSourceHeader("mongodb");
    }
}