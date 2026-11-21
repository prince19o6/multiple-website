using System.Collections.Concurrent;
using System.Net.Security;
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
            ?? configuration.GetConnectionString("MongoDB")
            ?? "mongodb://localhost:27017";

        MongoClientSettings settings;
        try
        {
            settings = MongoClientSettings.FromConnectionString(connectionString);
        }
        catch (Exception)
        {
            settings = new MongoClientSettings
            {
                Server = new MongoServerAddress("127.0.0.1", 27017),
                ServerSelectionTimeout = TimeSpan.FromSeconds(1),
                ConnectTimeout = TimeSpan.FromSeconds(1)
            };
        }

        var tlsMode = configuration["MongoDB:TlsMode"] ?? "skip";
        var sslSettings = new SslSettings
        {
            EnabledSslProtocols = SslProtocols.Tls12,
            CheckCertificateRevocation = false,
        };

        if (string.Equals(tlsMode, "skip", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(tlsMode, "allowInsecure", StringComparison.OrdinalIgnoreCase))
        {
            sslSettings.ServerCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true;
        }

        settings.SslSettings = sslSettings;
        settings.ReadPreference = ReadPreference.PrimaryPreferred;

        var selectionSeconds = configuration.GetValue("MongoDB:ServerSelectionTimeoutSeconds", 3);
        settings.ServerSelectionTimeout = TimeSpan.FromSeconds(selectionSeconds);
        settings.ConnectTimeout = TimeSpan.FromSeconds(selectionSeconds);

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
