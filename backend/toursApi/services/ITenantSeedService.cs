using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ToursApi.Services;

public interface ITenantSeedService
{
    Task<Dictionary<string, int>> SeedTenantDatabaseAsync(IMongoDatabase db, string siteId);
    Task<Dictionary<string, object>> SeedAllTenantsAsync();
}
