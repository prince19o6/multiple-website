using System.Collections.Concurrent;
using System.Security.Authentication;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace ToursApi.Services;

public class MongoDatabaseProvider : IMongoDatabaseProvider
{
    private readonly IMongoClient _client;
    private readonly ConcurrentDictionary<string, IMongoDatabase> _databaseCache = new(StringComparer.OrdinalIgnoreCase);

    public IMongoClient Client => _client;

    public MongoDatabaseProvider(IConfiguration configuration)
    {
        var connectionString = configuration["MongoDB:ConnectionString"]
            ?? throw new InvalidOperationException("MongoDB:ConnectionString is not configured.");

        var settings = MongoClientSettings.FromConnectionString(connectionString);

        // Standard, genuine TLS 1.2 configuration for MongoDB Atlas
        settings.SslSettings = new SslSettings
        {
            EnabledSslProtocols = SslProtocols.Tls12,
        };

        var selectionSeconds = configuration.GetValue("MongoDB:ServerSelectionTimeoutSeconds", 5);
        settings.ServerSelectionTimeout = TimeSpan.FromSeconds(selectionSeconds);
        settings.ConnectTimeout = TimeSpan.FromSeconds(5);

        _client = new MongoClient(settings);
    }

    public IMongoDatabase GetDatabase(string databaseName)
    {
        if (string.IsNullOrWhiteSpace(databaseName))
        {
            databaseName = "tours_gujjutours";
        }

        return _databaseCache.GetOrAdd(databaseName, name => _client.GetDatabase(name));
    }
}
