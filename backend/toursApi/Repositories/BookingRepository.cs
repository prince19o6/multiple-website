using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
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
