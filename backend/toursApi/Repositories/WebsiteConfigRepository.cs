using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class WebsiteConfigRepository : IWebsiteConfigRepository
{
    private readonly IMongoCollection<WebsiteConfigDocument> _collection;

    public WebsiteConfigRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<WebsiteConfigDocument>("websiteConfigs");
    }

    public async Task<WebsiteConfigDocument?> GetByHostnameAsync(string hostname)
    {
        return await _collection
            .Find(w => w.Hostname == hostname)
            .FirstOrDefaultAsync();
    }

    public async Task UpsertAsync(string hostname, BsonDocument config)
    {
        var update = Builders<WebsiteConfigDocument>.Update
            .Set(w => w.Config, config)
            .Set(w => w.UpdatedAt, DateTime.UtcNow)
            .SetOnInsert(w => w.Hostname, hostname);

        await _collection.UpdateOneAsync(
            w => w.Hostname == hostname,
            update,
            new UpdateOptions { IsUpsert = true });
    }
}