using MongoDB.Bson;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IWebsiteConfigRepository
{
    Task<WebsiteConfigDocument?> GetByHostnameAsync(string hostname);
    Task<BsonDocument?> GetConfigAsync(string hostnameOrId);
    Task UpsertAsync(string hostname, BsonDocument config);
    Task SaveConfigAsync(string hostname, BsonDocument config, string updatedBy = "admin");
    Task SeedDefaultsIfMissingAsync();
}
