using MongoDB.Driver;

namespace ToursApi.Services;

public interface IMongoDatabaseProvider
{
    IMongoClient Client { get; }
    IMongoDatabase GetDatabase(string databaseName);
}
