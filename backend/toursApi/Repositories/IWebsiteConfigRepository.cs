using MongoDB.Bson;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IWebsiteConfigRepository
{
    Task<WebsiteConfigDocument?> GetByHostnameAsync(string hostname);
    Task UpsertAsync(string hostname, BsonDocument config);
}