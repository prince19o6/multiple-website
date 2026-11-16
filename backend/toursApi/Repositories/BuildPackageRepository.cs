using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class BuildPackageRepository : IBuildPackageRepository
{
    private readonly IMongoCollection<BuildPackageOption> _options;

    public BuildPackageRepository(IMongoDatabase database)
    {
        _options = database.GetCollection<BuildPackageOption>("buildPackageOptions");
    }

    public async Task<BuildPackagePagedResult> GetBuildPackageOptionsAsync(BuildPackageFilterParams filters)
    {
        var builder = Builders<BuildPackageOption>.Filter;
        var filter = builder.Eq(o => o.Status, "Active");

        if (!string.IsNullOrWhiteSpace(filters.Query))
        {
            var q = filters.Query.Trim();
            var regex = new BsonRegularExpression(q, "i");
            filter = filter & (
                builder.Regex(o => o.DestinationName, regex) |
                builder.Regex(o => o.Country, regex) |
                builder.Regex(o => o.Tagline, regex) |
                builder.Regex(o => o.Overview, regex)
            );
        }

        if (!string.IsNullOrWhiteSpace(filters.Country) && !filters.Country.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cRegex = new BsonRegularExpression(filters.Country.Trim(), "i");
            filter = filter & builder.Regex(o => o.Country, cRegex);
        }

        if (filters.PopularOnly == true)
        {
            filter = filter & builder.Eq(o => o.Popular, true);
        }

        if (filters.FeaturedOnly == true)
        {
            filter = filter & builder.Eq(o => o.Featured, true);
        }

        if (filters.MinPrice.HasValue)
        {
            filter = filter & builder.Gte(o => o.StartingPrice, filters.MinPrice.Value);
        }

        if (filters.MaxPrice.HasValue)
        {
            filter = filter & builder.Lte(o => o.StartingPrice, filters.MaxPrice.Value);
        }

        var sortDef = filters.Sort?.ToLowerInvariant() switch
        {
            "price_asc" => Builders<BuildPackageOption>.Sort.Ascending(o => o.StartingPrice),
            "price_desc" => Builders<BuildPackageOption>.Sort.Descending(o => o.StartingPrice),
            "rating_desc" => Builders<BuildPackageOption>.Sort.Descending(o => o.Rating),
            "popular" => Builders<BuildPackageOption>.Sort.Descending(o => o.Popular).Descending(o => o.Reviews),
            _ => Builders<BuildPackageOption>.Sort.Ascending(o => o.DestinationNumericId)
        };

        var page = filters.Page > 0 ? filters.Page : 1;
        var pageSize = filters.PageSize > 0 ? filters.PageSize : 20;

        var total = await _options.CountDocumentsAsync(filter);
        var items = await _options.Find(filter)
            .Sort(sortDef)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return new BuildPackagePagedResult
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<BuildPackageOption?> GetBuildPackageOptionBySlugAsync(string slug)
    {
        var cleanSlug = slug.Trim().ToLowerInvariant();
        var filter = Builders<BuildPackageOption>.Filter.Eq(o => o.DestinationSlug, cleanSlug);
        return await _options.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<BuildPackageOption?> GetBuildPackageOptionByIdAsync(string id)
    {
        if (int.TryParse(id, out var numId))
        {
            var numFilter = Builders<BuildPackageOption>.Filter.Eq(o => o.DestinationNumericId, numId);
            var match = await _options.Find(numFilter).FirstOrDefaultAsync();
            if (match != null) return match;
        }

        if (ObjectId.TryParse(id, out var objId))
        {
            var idFilter = Builders<BuildPackageOption>.Filter.Eq(o => o.Id, id);
            var match = await _options.Find(idFilter).FirstOrDefaultAsync();
            if (match != null) return match;
        }

        var strFilter = Builders<BuildPackageOption>.Filter.Or(
            Builders<BuildPackageOption>.Filter.Eq(o => o.DestinationId, id),
            Builders<BuildPackageOption>.Filter.Eq(o => o.DestinationSlug, id.ToLowerInvariant())
        );
        return await _options.Find(strFilter).FirstOrDefaultAsync();
    }

    public async Task<List<string>> AutocompleteDestinationsAsync(string query, int limit = 8)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            var all = await _options.Find(o => o.Status == "Active")
                .Project(o => o.DestinationName)
                .Limit(limit)
                .ToListAsync();
            return all.Distinct().ToList();
        }

        var regex = new BsonRegularExpression(query.Trim(), "i");
        var filter = Builders<BuildPackageOption>.Filter.And(
            Builders<BuildPackageOption>.Filter.Eq(o => o.Status, "Active"),
            Builders<BuildPackageOption>.Filter.Or(
                Builders<BuildPackageOption>.Filter.Regex(o => o.DestinationName, regex),
                Builders<BuildPackageOption>.Filter.Regex(o => o.Country, regex)
            )
        );

        var list = await _options.Find(filter)
            .Project(o => o.DestinationName)
            .Limit(limit)
            .ToListAsync();

        return list.Distinct().ToList();
    }

    public async Task CreateBuildPackageOptionAsync(BuildPackageOption option)
    {
        await _options.InsertOneAsync(option);
    }

    public async Task<bool> UpdateBuildPackageOptionAsync(string id, BuildPackageOption option)
    {
        var filter = Builders<BuildPackageOption>.Filter.Eq(o => o.Id, id);
        var result = await _options.ReplaceOneAsync(filter, option);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteBuildPackageOptionAsync(string id)
    {
        var filter = Builders<BuildPackageOption>.Filter.Eq(o => o.Id, id);
        var result = await _options.DeleteOneAsync(filter);
        return result.DeletedCount > 0;
    }
}

