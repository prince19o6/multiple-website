using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using ToursApi.Configuration;
using ToursApi.Services;

namespace ToursMigration;

public class Program
{
    public static async Task<int> Main(string[] args)
    {
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("================================================================================");
        Console.WriteLine("   MULTI-TENANT DATABASE MIGRATION TOOL");
        Console.WriteLine("   From shared database 'tours70' -> 'tours_gujjutours', 'tours_tripgoasia', 'tours_technoheaven'");
        Console.WriteLine("================================================================================");
        Console.ResetColor();

        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("\n[IMPORTANT REMINDER]");
        Console.WriteLine("Take a MongoDB Atlas Snapshot or Cluster Backup BEFORE running migration in write mode!");
        Console.WriteLine("Atlas Console -> Clusters -> Cluster0 / tours70 -> Backup -> Take Snapshot.");
        Console.WriteLine("Rollback Note: Source database 'tours70' is strictly READ-ONLY and will NOT be modified.");
        Console.WriteLine("If needed, rolling back simply means deleting the 3 new databases and switching appsettings back.\n");
        Console.ResetColor();

        bool isDryRun = args.Any(a => a.Equals("--dry-run", StringComparison.OrdinalIgnoreCase));
        string? targetTenant = args.FirstOrDefault(a => a.StartsWith("--tenant=", StringComparison.OrdinalIgnoreCase))?["--tenant=".Length..];

        if (isDryRun)
        {
            Console.ForegroundColor = ConsoleColor.Magenta;
            Console.WriteLine("[MODE: DRY-RUN] Simulation only. No documents will be written to destination databases.\n");
            Console.ResetColor();
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[MODE: LIVE WRITE] Safe idempotent upsert mode. Source 'tours70' will remain untouched.\n");
            Console.ResetColor();
        }

        // Resolve Connection String from configuration
        var configBuilder = new ConfigurationBuilder();
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "appsettings.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "toursApi", "appsettings.json"),
            Path.Combine(AppContext.BaseDirectory, "appsettings.json"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "toursApi", "appsettings.json")
        };

        foreach (var c in candidates)
        {
            if (File.Exists(c))
            {
                configBuilder.AddJsonFile(Path.GetFullPath(c), optional: true);
                break;
            }
        }

        configBuilder.AddEnvironmentVariables();
        var configuration = configBuilder.Build();

        var connectionString = configuration["MongoDB:ConnectionString"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("Error: MongoDB:ConnectionString was not found in appsettings.json or environment.");
            Console.ResetColor();
            return 1;
        }

        var sourceDbName = configuration["MongoDB:SourceDatabaseName"] ?? "tours70";

        var settings = MongoClientSettings.FromConnectionString(connectionString);
        settings.ServerSelectionTimeout = TimeSpan.FromSeconds(15);
        settings.ConnectTimeout = TimeSpan.FromSeconds(15);

        var client = new MongoClient(settings);
        var sourceDb = client.GetDatabase(sourceDbName);

        Console.WriteLine($"Connected to cluster.");
        Console.WriteLine($"Source Database: {sourceDbName}\n");

        var tenantsToMigrate = WebsiteRegistry.SitesById.Values.ToList();
        if (!string.IsNullOrWhiteSpace(targetTenant))
        {
            tenantsToMigrate = tenantsToMigrate
                .Where(t => t.WebsiteId.Equals(targetTenant, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (tenantsToMigrate.Count == 0)
            {
                Console.WriteLine($"Error: Unknown tenant '{targetTenant}'. Available tenants: {string.Join(", ", WebsiteRegistry.SitesById.Keys)}");
                return 1;
            }
        }

        // Process each tenant
        foreach (var tenant in tenantsToMigrate)
        {
            Console.ForegroundColor = ConsoleColor.White;
            Console.WriteLine($"================================================================================");
            Console.WriteLine($" Tenant: {tenant.SiteName} ({tenant.WebsiteId}) -> Target DB: {tenant.DatabaseName}");
            Console.WriteLine($"================================================================================");
            Console.ResetColor();

            var targetDb = client.GetDatabase(tenant.DatabaseName);

            // 1. Tours
            await MigrateToursAsync(sourceDb, targetDb, tenant, isDryRun);

            // 2. Bookings
            await MigrateBookingsAsync(sourceDb, targetDb, tenant, isDryRun);

            // 3. Users
            await MigrateUsersAsync(sourceDb, targetDb, tenant, isDryRun);

            // 4. Destinations
            await MigrateDestinationsAsync(sourceDb, targetDb, tenant, isDryRun);

            // 5. WebsiteConfigs
            await MigrateConfigsAsync(sourceDb, targetDb, tenant, isDryRun);

            // 6. Ensure indexes on target DB
            if (!isDryRun)
            {
                Console.WriteLine("Ensuring unique and performance indexes on target database...");
                await DatabaseIndexInitializer.EnsureIndexesForDatabaseAsync(targetDb);
                Console.WriteLine("Indexes verified.");
            }

            Console.WriteLine();
        }

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("================================================================================");
        Console.WriteLine(isDryRun ? " DRY-RUN SIMULATION COMPLETED SUCCESSFULLY!" : " MIGRATION COMPLETED SUCCESSFULLY!");
        Console.WriteLine(" Source database 'tours70' was preserved completely intact.");
        Console.WriteLine("================================================================================");
        Console.ResetColor();

        return 0;
    }

    private static async Task MigrateToursAsync(IMongoDatabase sourceDb, IMongoDatabase targetDb, WebsiteConfig tenant, bool isDryRun)
    {
        var sourceColl = sourceDb.GetCollection<BsonDocument>("tours");
        var targetColl = targetDb.GetCollection<BsonDocument>("tours");

        var legacySiteTag = tenant.WebsiteId switch
        {
            "tripgoasia" => "website2",
            "technoheaven" => "website3",
            _ => "website1"
        };

        var filter = Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Eq("website", tenant.WebsiteId),
            Builders<BsonDocument>.Filter.Eq("website", legacySiteTag),
            Builders<BsonDocument>.Filter.Eq("websiteId", tenant.WebsiteId),
            Builders<BsonDocument>.Filter.Eq("websiteId", legacySiteTag)
        );

        var docs = await sourceColl.Find(filter).ToListAsync();
        var targetCountBefore = await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);

        Console.WriteLine($"[Tours] Found {docs.Count} matching documents in source database.");

        if (!isDryRun && docs.Count > 0)
        {
            var replaceOptions = new ReplaceOptions { IsUpsert = true };
            foreach (var doc in docs)
            {
                doc["website"] = tenant.WebsiteId;
                doc["websiteId"] = tenant.WebsiteId;
                var id = doc["_id"];
                await targetColl.ReplaceOneAsync(Builders<BsonDocument>.Filter.Eq("_id", id), doc, replaceOptions);
            }
        }

        var targetCountAfter = isDryRun ? targetCountBefore : await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
        Console.WriteLine($"[Tours] Target DB '{targetDb.DatabaseNamespace.DatabaseName}' count: {targetCountBefore} -> {targetCountAfter}");
    }

    private static async Task MigrateBookingsAsync(IMongoDatabase sourceDb, IMongoDatabase targetDb, WebsiteConfig tenant, bool isDryRun)
    {
        var sourceColl = sourceDb.GetCollection<BsonDocument>("bookings");
        var targetColl = targetDb.GetCollection<BsonDocument>("bookings");

        var legacySiteTag = tenant.WebsiteId switch
        {
            "tripgoasia" => "website2",
            "technoheaven" => "website3",
            _ => "website1"
        };

        var filter = Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Eq("websiteId", tenant.WebsiteId),
            Builders<BsonDocument>.Filter.Eq("websiteId", legacySiteTag)
        );

        var docs = await sourceColl.Find(filter).ToListAsync();
        var targetCountBefore = await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);

        Console.WriteLine($"[Bookings] Found {docs.Count} matching documents in source database.");

        if (!isDryRun && docs.Count > 0)
        {
            var replaceOptions = new ReplaceOptions { IsUpsert = true };
            foreach (var doc in docs)
            {
                doc["websiteId"] = tenant.WebsiteId;

                // Ensure unique reference is present
                if (!doc.Contains("reference") || doc["reference"].IsBsonNull || string.IsNullOrWhiteSpace(doc["reference"].AsString))
                {
                    var prefix = tenant.WebsiteId switch
                    {
                        "tripgoasia" => "TGA",
                        "technoheaven" => "TH",
                        _ => "GT"
                    };
                    var rand = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(4)).ToUpperInvariant();
                    doc["reference"] = $"BK-{prefix}-{rand}";
                }

                var id = doc["_id"];
                await targetColl.ReplaceOneAsync(Builders<BsonDocument>.Filter.Eq("_id", id), doc, replaceOptions);
            }
        }

        var targetCountAfter = isDryRun ? targetCountBefore : await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
        Console.WriteLine($"[Bookings] Target DB '{targetDb.DatabaseNamespace.DatabaseName}' count: {targetCountBefore} -> {targetCountAfter}");
    }

    private static async Task MigrateUsersAsync(IMongoDatabase sourceDb, IMongoDatabase targetDb, WebsiteConfig tenant, bool isDryRun)
    {
        var sourceColl = sourceDb.GetCollection<BsonDocument>("users");
        var targetColl = targetDb.GetCollection<BsonDocument>("users");

        var legacySiteTag = tenant.WebsiteId switch
        {
            "tripgoasia" => "website2",
            "technoheaven" => "website3",
            _ => "website1"
        };

        var filter = Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Eq("websiteId", tenant.WebsiteId),
            Builders<BsonDocument>.Filter.Eq("websiteId", legacySiteTag)
        );

        var docs = await sourceColl.Find(filter).ToListAsync();
        var targetCountBefore = await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);

        Console.WriteLine($"[Users] Found {docs.Count} matching documents in source database.");

        if (!isDryRun && docs.Count > 0)
        {
            var replaceOptions = new ReplaceOptions { IsUpsert = true };
            foreach (var doc in docs)
            {
                doc["websiteId"] = tenant.WebsiteId;
                var id = doc["_id"];
                await targetColl.ReplaceOneAsync(Builders<BsonDocument>.Filter.Eq("_id", id), doc, replaceOptions);
            }
        }

        var targetCountAfter = isDryRun ? targetCountBefore : await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
        Console.WriteLine($"[Users] Target DB '{targetDb.DatabaseNamespace.DatabaseName}' count: {targetCountBefore} -> {targetCountAfter}");
    }

    private static async Task MigrateDestinationsAsync(IMongoDatabase sourceDb, IMongoDatabase targetDb, WebsiteConfig tenant, bool isDryRun)
    {
        var sourceColl = sourceDb.GetCollection<BsonDocument>("destinations");
        var targetColl = targetDb.GetCollection<BsonDocument>("destinations");

        var legacySiteTag = tenant.WebsiteId switch
        {
            "tripgoasia" => "website2",
            "technoheaven" => "website3",
            _ => "website1"
        };

        var filter = Builders<BsonDocument>.Filter.Or(
            Builders<BsonDocument>.Filter.Eq("website", tenant.WebsiteId),
            Builders<BsonDocument>.Filter.Eq("website", legacySiteTag)
        );

        var docs = await sourceColl.Find(filter).ToListAsync();
        var targetCountBefore = await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);

        Console.WriteLine($"[Destinations] Found {docs.Count} matching documents in source database.");

        if (!isDryRun && docs.Count > 0)
        {
            var replaceOptions = new ReplaceOptions { IsUpsert = true };
            foreach (var doc in docs)
            {
                doc["website"] = tenant.WebsiteId;
                var id = doc["_id"];
                await targetColl.ReplaceOneAsync(Builders<BsonDocument>.Filter.Eq("_id", id), doc, replaceOptions);
            }
        }

        var targetCountAfter = isDryRun ? targetCountBefore : await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
        Console.WriteLine($"[Destinations] Target DB '{targetDb.DatabaseNamespace.DatabaseName}' count: {targetCountBefore} -> {targetCountAfter}");
    }

    private static async Task MigrateConfigsAsync(IMongoDatabase sourceDb, IMongoDatabase targetDb, WebsiteConfig tenant, bool isDryRun)
    {
        var sourceColl = sourceDb.GetCollection<BsonDocument>("websiteConfigs");
        var targetColl = targetDb.GetCollection<BsonDocument>("websiteConfigs");

        var normalizedHosts = tenant.AllowedHostnames.Select(WebsiteRegistry.NormalizeHostname).ToHashSet();
        var allDocs = await sourceColl.Find(Builders<BsonDocument>.Filter.Empty).ToListAsync();
        var docs = allDocs.Where(d => d.Contains("hostname") && normalizedHosts.Contains(WebsiteRegistry.NormalizeHostname(d["hostname"].AsString))).ToList();

        var targetCountBefore = await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
        Console.WriteLine($"[WebsiteConfigs] Found {docs.Count} matching documents in source database.");

        if (!isDryRun && docs.Count > 0)
        {
            var replaceOptions = new ReplaceOptions { IsUpsert = true };
            foreach (var doc in docs)
            {
                var id = doc["_id"];
                await targetColl.ReplaceOneAsync(Builders<BsonDocument>.Filter.Eq("_id", id), doc, replaceOptions);
            }
        }

        var targetCountAfter = isDryRun ? targetCountBefore : await targetColl.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);
        Console.WriteLine($"[WebsiteConfigs] Target DB '{targetDb.DatabaseNamespace.DatabaseName}' count: {targetCountBefore} -> {targetCountAfter}");
    }
}
