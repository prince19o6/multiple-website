using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly IMongoCollection<Booking> _bookings;
    private static readonly ConcurrentDictionary<string, Booking> _inMemoryCache = new(StringComparer.OrdinalIgnoreCase);

    public BookingRepository(IMongoDatabase database)
    {
        _bookings = database.GetCollection<Booking>("bookings");
    }

    private string GetWebsiteId()
    {
        var dbName = _bookings.Database?.DatabaseNamespace?.DatabaseName ?? "tours_gujjutours";
        var siteId = dbName.Replace("tours_", "").Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(siteId) ? "gujjutours" : siteId;
    }

    public async Task<IEnumerable<Booking>> GetAllAsync()
    {
        try
        {
            var list = await _bookings.Find(FilterDefinition<Booking>.Empty)
                .SortByDescending(b => b.CreatedAt)
                .ToListAsync();

            foreach (var item in list)
            {
                if (!string.IsNullOrEmpty(item.Reference)) _inMemoryCache[item.Reference] = item;
                if (!string.IsNullOrEmpty(item.Id)) _inMemoryCache[item.Id] = item;
            }

            return list;
        }
        catch (Exception ex)
        {
            var siteId = GetWebsiteId();
            Console.WriteLine($"[WARN] [BookingRepository.GetAllAsync] MongoDB error: {ex.Message}. Falling back to memory cache.");
            return _inMemoryCache.Values
                .GroupBy(b => !string.IsNullOrEmpty(b.Id) ? b.Id : b.Reference)
                .Select(g => g.First())
                .Where(b => string.Equals(b.WebsiteId, siteId, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(b => b.CreatedAt)
                .ToList();
        }
    }

    private FilterDefinition<Booking> BuildFilter(
        string? email = null,
        string? userId = null,
        IEnumerable<string>? ids = null,
        string? status = null,
        string? search = null)
    {
        var builder = Builders<Booking>.Filter;
        var filter = builder.Empty;

        // Status filter
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var cleanStatus = status.Trim().ToLowerInvariant();
            if (cleanStatus == "upcoming")
            {
                filter &= builder.Or(
                    builder.Regex(b => b.Status, new BsonRegularExpression("^(upcoming|pending|confirmed)$", "i"))
                );
            }
            else
            {
                var statusRegex = new BsonRegularExpression($"^{Regex.Escape(cleanStatus)}$", "i");
                filter &= builder.Regex(b => b.Status, statusRegex);
            }
        }

        // Search filter across reference, guest name, email, tour name, and phone
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = Regex.Escape(search.Trim());
            var reg = new BsonRegularExpression(term, "i");
            filter &= builder.Or(
                builder.Regex(b => b.GuestName, reg),
                builder.Regex(b => b.Email, reg),
                builder.Regex(b => b.Phone, reg),
                builder.Regex(b => b.TourName, reg),
                builder.Regex(b => b.Reference, reg),
                builder.Regex(b => b.Id, reg),
                builder.Regex("snapshot.title", reg),
                builder.Regex("travelersList.name", reg)
            );
        }

        var identityFilters = new List<FilterDefinition<Booking>>();

        // 1. Email filter (case-insensitive)
        if (!string.IsNullOrWhiteSpace(email))
        {
            var emailRegex = new BsonRegularExpression($"^{Regex.Escape(email.Trim())}$", "i");
            identityFilters.Add(builder.Regex(b => b.Email, emailRegex));
        }

        // 2. User ID filter
        if (!string.IsNullOrWhiteSpace(userId))
        {
            identityFilters.Add(builder.Eq(b => b.UserId, userId.Trim()));
        }

        // 3. Ids filter (Checks both MongoDB _id AND booking Reference)
        if (ids != null)
        {
            var idList = ids.Where(i => !string.IsNullOrWhiteSpace(i)).Select(i => i.Trim()).ToList();
            if (idList.Count > 0)
            {
                var validObjectIds = idList.Where(i => ObjectId.TryParse(i, out _)).ToList();
                var idOrRefFilters = new List<FilterDefinition<Booking>>();

                if (validObjectIds.Count > 0)
                {
                    idOrRefFilters.Add(builder.In(b => b.Id, validObjectIds));
                }

                idOrRefFilters.Add(builder.In(b => b.Reference, idList));

                identityFilters.Add(builder.Or(idOrRefFilters));
            }
        }

        if (identityFilters.Count > 0)
        {
            // Match any of the user identity filters (userId OR email OR references)
            filter &= builder.Or(identityFilters);
        }

        return filter;
    }

    public async Task<IEnumerable<Booking>> QueryAsync(
        string? email = null,
        string? userId = null,
        IEnumerable<string>? ids = null,
        string? status = null,
        string? search = null,
        int? skip = null,
        int? limit = null)
    {
        try
        {
            var filter = BuildFilter(email, userId, ids, status, search);
            IFindFluent<Booking, Booking> query = _bookings.Find(filter).SortByDescending(b => b.CreatedAt);

            if (skip.HasValue && skip.Value > 0)
            {
                query = query.Skip(skip.Value);
            }
            if (limit.HasValue && limit.Value > 0)
            {
                query = query.Limit(limit.Value);
            }

            var list = await query.ToListAsync();
            foreach (var b in list)
            {
                if (!string.IsNullOrEmpty(b.Reference)) _inMemoryCache[b.Reference] = b;
                if (!string.IsNullOrEmpty(b.Id)) _inMemoryCache[b.Id] = b;
            }
            return list;
        }
        catch (Exception ex)
        {
            var siteId = GetWebsiteId();
            Console.WriteLine($"[WARN] [BookingRepository.QueryAsync] MongoDB error: {ex.Message}. Querying in-memory cache.");
            var query = _inMemoryCache.Values
                .GroupBy(b => !string.IsNullOrEmpty(b.Id) ? b.Id : b.Reference)
                .Select(g => g.First())
                .Where(b => string.Equals(b.WebsiteId, siteId, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(email))
            {
                query = query.Where(b => string.Equals(b.Email, email.Trim(), StringComparison.OrdinalIgnoreCase));
            }
            if (!string.IsNullOrWhiteSpace(userId))
            {
                query = query.Where(b => string.Equals(b.UserId, userId.Trim(), StringComparison.OrdinalIgnoreCase));
            }
            if (ids != null)
            {
                var idSet = ids.Where(i => !string.IsNullOrWhiteSpace(i)).Select(i => i.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase);
                if (idSet.Count > 0)
                {
                    query = query.Where(b => idSet.Contains(b.Id ?? "") || idSet.Contains(b.Reference ?? ""));
                }
            }
            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var st = status.Trim().ToLowerInvariant();
                if (st == "upcoming")
                {
                    query = query.Where(b => (b.Status ?? "").ToLowerInvariant() is "upcoming" or "pending" or "confirmed");
                }
                else
                {
                    query = query.Where(b => string.Equals(b.Status, st, StringComparison.OrdinalIgnoreCase));
                }
            }
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                query = query.Where(b =>
                    (b.GuestName?.Contains(s, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (b.Email?.Contains(s, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (b.TourName?.Contains(s, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (b.Reference?.Contains(s, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (b.TravelersList != null && b.TravelersList.Any(t => t.Name?.Contains(s, StringComparison.OrdinalIgnoreCase) ?? false)));
            }

            query = query.OrderByDescending(b => b.CreatedAt);
            if (skip.HasValue && skip.Value > 0) query = query.Skip(skip.Value);
            if (limit.HasValue && limit.Value > 0) query = query.Take(limit.Value);

            return query.ToList();
        }
    }

    public async Task<long> CountAsync(
        string? email = null,
        string? userId = null,
        IEnumerable<string>? ids = null,
        string? status = null,
        string? search = null)
    {
        try
        {
            var filter = BuildFilter(email, userId, ids, status, search);
            return await _bookings.CountDocumentsAsync(filter);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingRepository.CountAsync] MongoDB error: {ex.Message}. Counting memory cache.");
            var items = await QueryAsync(email, userId, ids, status, search);
            return items.Count();
        }
    }

    public async Task<Booking?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;
        var cleanId = id.Trim();
        var siteId = GetWebsiteId();

        try
        {
            if (ObjectId.TryParse(cleanId, out _))
            {
                var doc = await _bookings.Find(b => b.Id == cleanId).FirstOrDefaultAsync();
                if (doc != null)
                {
                    _inMemoryCache[doc.Id!] = doc;
                    if (!string.IsNullOrEmpty(doc.Reference)) _inMemoryCache[doc.Reference] = doc;
                    return doc;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingRepository.GetByIdAsync] MongoDB error: {ex.Message}");
        }

        if (_inMemoryCache.TryGetValue(cleanId, out var cached) &&
            string.Equals(cached.WebsiteId, siteId, StringComparison.OrdinalIgnoreCase))
        {
            return cached;
        }

        var foundInCache = _inMemoryCache.Values.FirstOrDefault(b =>
            string.Equals(b.WebsiteId, siteId, StringComparison.OrdinalIgnoreCase) &&
            (string.Equals(b.Reference, cleanId, StringComparison.OrdinalIgnoreCase) ||
             string.Equals(b.Id, cleanId, StringComparison.OrdinalIgnoreCase)));
        return foundInCache;
    }

    public async Task<Booking?> GetByReferenceAsync(string reference)
    {
        if (string.IsNullOrWhiteSpace(reference)) return null;
        var cleanRef = reference.Trim();
        var siteId = GetWebsiteId();

        try
        {
            var builder = Builders<Booking>.Filter;
            var refRegex = new BsonRegularExpression($"^{Regex.Escape(cleanRef)}$", "i");
            var doc = await _bookings.Find(builder.Regex(b => b.Reference, refRegex)).FirstOrDefaultAsync();
            if (doc != null)
            {
                _inMemoryCache[doc.Reference] = doc;
                if (!string.IsNullOrEmpty(doc.Id)) _inMemoryCache[doc.Id] = doc;
                return doc;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingRepository.GetByReferenceAsync] MongoDB error: {ex.Message}");
        }

        if (_inMemoryCache.TryGetValue(cleanRef, out var cached) &&
            string.Equals(cached.WebsiteId, siteId, StringComparison.OrdinalIgnoreCase))
        {
            return cached;
        }

        var foundInCache = _inMemoryCache.Values.FirstOrDefault(b =>
            string.Equals(b.WebsiteId, siteId, StringComparison.OrdinalIgnoreCase) &&
            (string.Equals(b.Reference, cleanRef, StringComparison.OrdinalIgnoreCase) ||
             string.Equals(b.Id, cleanRef, StringComparison.OrdinalIgnoreCase)));
        return foundInCache;
    }

    public async Task<Booking?> GetByReferenceAndEmailAsync(string reference, string email)
    {
        if (string.IsNullOrWhiteSpace(reference) || string.IsNullOrWhiteSpace(email)) return null;
        var cleanRef = reference.Trim();
        var cleanEmail = email.Trim();
        var siteId = GetWebsiteId();

        try
        {
            var builder = Builders<Booking>.Filter;
            var refRegex = new BsonRegularExpression($"^{Regex.Escape(cleanRef)}$", "i");
            var emailRegex = new BsonRegularExpression($"^{Regex.Escape(cleanEmail)}$", "i");

            var filter = builder.Regex(b => b.Reference, refRegex) & builder.Regex(b => b.Email, emailRegex);
            var doc = await _bookings.Find(filter).FirstOrDefaultAsync();
            if (doc != null)
            {
                _inMemoryCache[doc.Reference] = doc;
                if (!string.IsNullOrEmpty(doc.Id)) _inMemoryCache[doc.Id] = doc;
                return doc;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingRepository.GetByReferenceAndEmailAsync] MongoDB error: {ex.Message}");
        }

        var match = _inMemoryCache.Values.FirstOrDefault(b =>
            string.Equals(b.WebsiteId, siteId, StringComparison.OrdinalIgnoreCase) &&
            (string.Equals(b.Reference, cleanRef, StringComparison.OrdinalIgnoreCase) || string.Equals(b.Id, cleanRef, StringComparison.OrdinalIgnoreCase)) &&
            string.Equals(b.Email, cleanEmail, StringComparison.OrdinalIgnoreCase));
        return match;
    }

    public async Task<Booking?> GetByIdempotencyKeyAsync(string idempotencyKey)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey)) return null;
        var cleanKey = idempotencyKey.Trim();
        var siteId = GetWebsiteId();

        try
        {
            var doc = await _bookings.Find(b => b.IdempotencyKey == cleanKey).FirstOrDefaultAsync();
            if (doc != null)
            {
                _inMemoryCache[doc.Reference] = doc;
                if (!string.IsNullOrEmpty(doc.Id)) _inMemoryCache[doc.Id] = doc;
                return doc;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingRepository.GetByIdempotencyKeyAsync] MongoDB error: {ex.Message}");
        }

        return _inMemoryCache.Values.FirstOrDefault(b =>
            string.Equals(b.WebsiteId, siteId, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(b.IdempotencyKey, cleanKey, StringComparison.OrdinalIgnoreCase));
    }

    public async Task CreateAsync(Booking booking)
    {
        if (string.IsNullOrEmpty(booking.Id))
        {
            booking.Id = ObjectId.GenerateNewId().ToString();
        }

        if (!string.IsNullOrEmpty(booking.Reference))
        {
            _inMemoryCache[booking.Reference] = booking;
        }
        _inMemoryCache[booking.Id] = booking;

        try
        {
            await _bookings.InsertOneAsync(booking);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingRepository.CreateAsync] MongoDB insert error: {ex.Message}. Safely retained in memory cache.");
        }
    }

    public async Task UpdateAsync(string id, Booking booking)
    {
        if (!string.IsNullOrEmpty(id))
        {
            _inMemoryCache[id] = booking;
        }
        if (!string.IsNullOrEmpty(booking.Reference))
        {
            _inMemoryCache[booking.Reference] = booking;
        }

        try
        {
            await _bookings.ReplaceOneAsync(b => b.Id == id, booking);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingRepository.UpdateAsync] MongoDB update error: {ex.Message}. Safely updated in memory cache.");
        }
    }

    public async Task DeleteAsync(string id)
    {
        _inMemoryCache.TryRemove(id, out _);
        try
        {
            await _bookings.DeleteOneAsync(b => b.Id == id);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingRepository.DeleteAsync] MongoDB delete error: {ex.Message}");
        }
    }

    public async Task<int> ClaimGuestBookingsAsync(string userId, string? email, IEnumerable<string>? references)
    {
        if (string.IsNullOrWhiteSpace(userId)) return 0;
        var cleanUserId = userId.Trim();
        var cleanEmail = email?.Trim();
        var refList = references != null
            ? references.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).ToList()
            : new List<string>();

        var siteId = GetWebsiteId();
        int claimedCount = 0;

        // 1. Update in-memory cache bookings
        foreach (var booking in _inMemoryCache.Values)
        {
            if (string.Equals(booking.WebsiteId, siteId, StringComparison.OrdinalIgnoreCase) &&
                string.IsNullOrEmpty(booking.UserId))
            {
                bool matches = false;
                if (!string.IsNullOrWhiteSpace(cleanEmail) && string.Equals(booking.Email, cleanEmail, StringComparison.OrdinalIgnoreCase))
                {
                    matches = true;
                }
                else if (refList.Count > 0 && (refList.Contains(booking.Reference, StringComparer.OrdinalIgnoreCase) || refList.Contains(booking.Id, StringComparer.OrdinalIgnoreCase)))
                {
                    matches = true;
                }

                if (matches)
                {
                    booking.UserId = cleanUserId;
                    booking.UpdatedAt = DateTime.UtcNow;
                    booking.StatusHistory.Add(new BookingStatusHistoryItem
                    {
                        Status = "claimed",
                        ChangedAt = DateTime.UtcNow,
                        Note = "Claimed by authenticated user account",
                        ChangedBy = cleanUserId
                    });
                    claimedCount++;
                }
            }
        }

        // 2. Persist to MongoDB if reachable
        try
        {
            var builder = Builders<Booking>.Filter;
            var unassignedFilter = builder.Or(
                builder.Eq(b => b.UserId, null),
                builder.Eq(b => b.UserId, string.Empty)
            );

            var matchFilters = new List<FilterDefinition<Booking>>();

            if (!string.IsNullOrWhiteSpace(cleanEmail))
            {
                var emailRegex = new BsonRegularExpression($"^{Regex.Escape(cleanEmail)}$", "i");
                matchFilters.Add(builder.Regex(b => b.Email, emailRegex));
            }

            if (refList.Count > 0)
            {
                matchFilters.Add(builder.In(b => b.Reference, refList));
                var validObjectIds = refList.Where(r => ObjectId.TryParse(r, out _)).ToList();
                if (validObjectIds.Count > 0)
                {
                    matchFilters.Add(builder.In(b => b.Id, validObjectIds));
                }
            }

            if (matchFilters.Count > 0)
            {
                var finalFilter = unassignedFilter & builder.Or(matchFilters);

                var update = Builders<Booking>.Update
                    .Set(b => b.UserId, cleanUserId)
                    .Set(b => b.UpdatedAt, DateTime.UtcNow)
                    .Push(b => b.StatusHistory, new BookingStatusHistoryItem
                    {
                        Status = "claimed",
                        ChangedAt = DateTime.UtcNow,
                        Note = "Claimed by authenticated user account",
                        ChangedBy = cleanUserId
                    });

                var result = await _bookings.UpdateManyAsync(finalFilter, update);
                return Math.Max(claimedCount, (int)result.ModifiedCount);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] [BookingRepository.ClaimGuestBookingsAsync] MongoDB error: {ex.Message}. Retaining in-memory claimed count: {claimedCount}.");
        }

        return claimedCount;
    }
}
