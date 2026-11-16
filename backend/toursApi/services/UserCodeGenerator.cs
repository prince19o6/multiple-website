using System;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Driver;

namespace ToursApi.Services;

public class UserCodeGenerator : IUserCodeGenerator
{
    private readonly IMongoCollection<BsonDocument> _counters;

    public UserCodeGenerator(IMongoDatabase database)
    {
        _counters = database.GetCollection<BsonDocument>("counters");
    }

    public async Task<string> NextUserCodeAsync(string websiteId)
    {
        var cleanSite = (websiteId ?? "gujjutours").Trim().ToLowerInvariant();
        var prefix = cleanSite switch
        {
            "tripgoasia" or "tga" => "TGA-U-",
            "technoheaven" or "th" => "TH-U-",
            _ => "GT-U-"
        };

        try
        {
            var filter = Builders<BsonDocument>.Filter.Eq("_id", "user_code");
            var update = Builders<BsonDocument>.Update.Inc("seq", 1L);
            var options = new FindOneAndUpdateOptions<BsonDocument>
            {
                IsUpsert = true,
                ReturnDocument = ReturnDocument.After
            };

            var doc = await _counters.FindOneAndUpdateAsync(filter, update, options);
            long seq = doc.Contains("seq") ? doc["seq"].ToInt64() : 1L;

            return $"{prefix}{seq:D6}";
        }
        catch
        {
            var fallbackSeq = (DateTime.UtcNow.Ticks % 900000L) + 100000L;
            return $"{prefix}{fallbackSeq:D6}";
        }
    }
}

