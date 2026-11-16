using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using System.Text.Json;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Services;

namespace ToursApi.Repositories;

public class WebsiteConfigRepository : IWebsiteConfigRepository
{
    private readonly IMongoDatabase _database;
    private readonly IMongoCollection<WebsiteConfigDocument> _collection;
    private readonly ILogger<WebsiteConfigRepository> _logger;

    public WebsiteConfigRepository(IMongoDatabase database, ILogger<WebsiteConfigRepository> logger)
    {
        _database = database;
        _collection = database.GetCollection<WebsiteConfigDocument>("websiteConfigs");
        _logger = logger;
    }

    public async Task<WebsiteConfigDocument?> GetByHostnameAsync(string hostname)
    {
        var normalized = WebsiteRegistry.NormalizeHostname(hostname);
        try
        {
            return await _collection
                .Find(w => w.Hostname == normalized || w.Hostname == hostname)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[WebsiteConfigRepository] MongoDB unavailable for {Hostname}. Loading disk seed fallback.", normalized);
            var diskDoc = LoadDiskSeedConfig(hostname);
            if (diskDoc != null)
            {
                return new WebsiteConfigDocument
                {
                    Hostname = normalized,
                    Config = diskDoc,
                    UpdatedAt = DateTime.UtcNow
                };
            }
            return null;
        }
    }

    public async Task<BsonDocument?> GetConfigAsync(string hostnameOrId)
    {
        var doc = await GetByHostnameAsync(hostnameOrId);
        if (doc?.Config != null) return doc.Config;

        return LoadDiskSeedConfig(hostnameOrId);
    }

    private BsonDocument? LoadDiskSeedConfig(string hostnameOrId)
    {
        try
        {
            var site = WebsiteRegistry.Resolve(hostnameOrId)
                ?? WebsiteRegistry.SitesById.GetValueOrDefault(hostnameOrId);

            var siteId = site?.WebsiteId ?? "gujjutours";
            var candidates = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "seed", $"{siteId}.siteConfig.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "seed", $"{siteId}.siteConfig.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "backend", "toursApi", "seed", $"{siteId}.siteConfig.json"),
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    var json = File.ReadAllText(path);
                    return BsonSerializer.Deserialize<BsonDocument>(json);
                }
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "[WebsiteConfigRepository] Failed loading disk seed config for {Host}", hostnameOrId);
        }
        return null;
    }

    public async Task UpsertAsync(string hostname, BsonDocument config)
    {
        await SaveConfigAsync(hostname, config, "system");
    }

    public async Task SaveConfigAsync(string hostname, BsonDocument config, string updatedBy = "admin")
    {
        var normalized = WebsiteRegistry.NormalizeHostname(hostname);

        // Stamp version and audit metadata
        config["updatedAt"] = DateTime.UtcNow.ToString("o");
        config["updatedBy"] = updatedBy;

        var update = Builders<WebsiteConfigDocument>.Update
            .Set(w => w.Config, config)
            .Set(w => w.UpdatedAt, DateTime.UtcNow)
            .SetOnInsert(w => w.Hostname, normalized);

        await _collection.UpdateOneAsync(
            w => w.Hostname == normalized,
            update,
            new UpdateOptions { IsUpsert = true });

        _logger.LogInformation("[WebsiteConfigRepository] Upserted site config for {Hostname} by {User}", normalized, updatedBy);
    }

    public async Task SeedDefaultsIfMissingAsync()
    {
        try
        {
            var currentDbName = _database.DatabaseNamespace.DatabaseName;
            string? siteId = null;

            if (currentDbName.Contains("gujjutours", StringComparison.OrdinalIgnoreCase)) siteId = "gujjutours";
            else if (currentDbName.Contains("tripgoasia", StringComparison.OrdinalIgnoreCase)) siteId = "tripgoasia";
            else if (currentDbName.Contains("technoheaven", StringComparison.OrdinalIgnoreCase)) siteId = "technoheaven";

            if (string.IsNullOrEmpty(siteId)) return;

            var site = WebsiteRegistry.SitesById.GetValueOrDefault(siteId);
            if (site == null) return;

            var existing = await GetByHostnameAsync(site.CanonicalHostname);
            if (existing == null)
            {
                var seedPath = Path.Combine(AppContext.BaseDirectory, "seed", $"{siteId}.siteConfig.json");
                if (!File.Exists(seedPath))
                {
                    seedPath = Path.Combine(Directory.GetCurrentDirectory(), "seed", $"{siteId}.siteConfig.json");
                }

                if (File.Exists(seedPath))
                {
                    var json = await File.ReadAllTextAsync(seedPath);
                    var bsonDoc = BsonSerializer.Deserialize<BsonDocument>(json);
                    await SaveConfigAsync(site.CanonicalHostname, bsonDoc, "system_seed");
                    _logger.LogInformation("[WebsiteConfigRepository] Seeded default SiteConfig for {SiteId} into {Db}", siteId, currentDbName);
                }
            }
            else if (existing.Config != null)
            {
                var config = existing.Config;
                bool modified = false;

                // Ensure featureRegistry is seeded if missing
                if (!config.Contains("featureRegistry") || !config["featureRegistry"].IsBsonArray || config["featureRegistry"].AsBsonArray.Count == 0)
                {
                    var seedPath = Path.Combine(AppContext.BaseDirectory, "seed", $"{siteId}.siteConfig.json");
                    if (!File.Exists(seedPath))
                    {
                        seedPath = Path.Combine(Directory.GetCurrentDirectory(), "seed", $"{siteId}.siteConfig.json");
                    }
                    if (File.Exists(seedPath))
                    {
                        var json = await File.ReadAllTextAsync(seedPath);
                        var bsonDoc = BsonSerializer.Deserialize<BsonDocument>(json);
                        if (bsonDoc.Contains("featureRegistry"))
                        {
                            config["featureRegistry"] = bsonDoc["featureRegistry"];
                            modified = true;
                            _logger.LogInformation("[WebsiteConfigRepository] Seeded featureRegistry into existing config for {SiteId}", siteId);
                        }
                    }
                }

                // Sanitize existing document: searchWidget should only target app platforms (web hero embeds it)
                if (config.Contains("components") && config["components"].IsBsonDocument &&
                    config["components"].AsBsonDocument.Contains("home") && config["components"]["home"].IsBsonArray)
                {
                    var homeComponents = config["components"]["home"].AsBsonArray;
                    foreach (var comp in homeComponents)
                    {
                        if (comp.IsBsonDocument && comp.AsBsonDocument.GetValue("type", "").AsString == "searchWidget")
                        {
                            var platforms = comp.AsBsonDocument.GetValue("platforms", new BsonArray()).AsBsonArray;
                            if (platforms.Any(p => p.AsString == "web"))
                            {
                                comp.AsBsonDocument["platforms"] = new BsonArray { "app" };
                                modified = true;
                            }
                        }
                    }

                    // Ensure footer component exists in components.home for web
                    bool hasFooter = homeComponents.Any(c => c.IsBsonDocument && c.AsBsonDocument.GetValue("type", "").AsString == "footer");
                    if (!hasFooter)
                    {
                        homeComponents.Add(new BsonDocument
                        {
                            { "id", "footer-1" },
                            { "type", "footer" },
                            { "variant", "columns" },
                            { "enabled", true },
                            { "title", "Footer" },
                            { "order", homeComponents.Count + 1 },
                            { "props", new BsonDocument() },
                            { "platforms", new BsonArray { "web" } }
                        });
                        modified = true;
                        _logger.LogInformation("[WebsiteConfigRepository] Seeded footer component into components.home for {SiteId}", siteId);
                    }
                }

                if (modified)
                {
                    await SaveConfigAsync(site.CanonicalHostname, config, "system_seed_features");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[WebsiteConfigRepository] SeedDefaultsIfMissingAsync skipped due to exception");
        }
    }
}
