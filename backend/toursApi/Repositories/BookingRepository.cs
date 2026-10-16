using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Text.RegularExpressions;
using ToursApi.Models;

namespace ToursApi.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly IMongoCollection<Booking> _bookings;

    public BookingRepository(IMongoDatabase database)
    {
        _bookings = database.GetCollection<Booking>("bookings");
    }

    public async Task<IEnumerable<Booking>> GetAllAsync()
    {
        return await _bookings.Find(FilterDefinition<Booking>.Empty).ToListAsync();
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
        var builder = Builders<Booking>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            var statusRegex = new BsonRegularExpression($"^{Regex.Escape(status.Trim())}$", "i");
            filter &= builder.Regex(b => b.Status, statusRegex);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = Regex.Escape(search.Trim());
            var reg = new BsonRegularExpression(term, "i");
            filter &= builder.Or(
                builder.Regex(b => b.GuestName, reg),
                builder.Regex(b => b.Email, reg),
                builder.Regex(b => b.TourName, reg),
                builder.Regex(b => b.Reference, reg),
                builder.Regex(b => b.Id, reg)
            );
        }

        var identityFilters = new List<FilterDefinition<Booking>>();
        if (!string.IsNullOrWhiteSpace(email))
        {
            var emailRegex = new BsonRegularExpression($"^{Regex.Escape(email.Trim())}$", "i");
            identityFilters.Add(builder.Regex(b => b.Email, emailRegex));
        }
        if (!string.IsNullOrWhiteSpace(userId))
        {
            identityFilters.Add(builder.Eq(b => b.UserId, userId.Trim()));
        }
        if (ids != null)
        {
            var idList = ids.Where(i => !string.IsNullOrWhiteSpace(i)).ToList();
            if (idList.Count > 0)
            {
                identityFilters.Add(builder.In(b => b.Id, idList));
            }
        }

        if (identityFilters.Count > 0)
        {
            filter &= builder.Or(identityFilters);
        }

        IFindFluent<Booking, Booking> query = _bookings.Find(filter).SortByDescending(b => b.CreatedAt);
        if (skip.HasValue && skip.Value > 0)
        {
            query = query.Skip(skip.Value);
        }
        if (limit.HasValue && limit.Value > 0)
        {
            query = query.Limit(limit.Value);
        }

        return await query.ToListAsync();
    }

    public async Task<Booking?> GetByIdAsync(string id)
    {
        return await _bookings.Find(b => b.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Booking?> GetByReferenceAsync(string reference)
    {
        return await _bookings.Find(b => b.Reference == reference).FirstOrDefaultAsync();
    }

    public async Task CreateAsync(Booking booking)
    {
        if (string.IsNullOrEmpty(booking.Id))
        {
            booking.Id = ObjectId.GenerateNewId().ToString();
        }

        if (string.IsNullOrWhiteSpace(booking.Reference))
        {
            var rand = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(4)).ToUpperInvariant();
            booking.Reference = $"BK-{rand}";
        }

        await _bookings.InsertOneAsync(booking);
    }

    public async Task UpdateAsync(string id, Booking booking)
    {
        await _bookings.ReplaceOneAsync(b => b.Id == id, booking);
    }

    public async Task DeleteAsync(string id)
    {
        await _bookings.DeleteOneAsync(b => b.Id == id);
    }
}
