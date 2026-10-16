using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _repository;
    private readonly IWebsiteContext _websiteContext;

    public BookingService(IBookingRepository repository, IWebsiteContext websiteContext)
    {
        _repository = repository;
        _websiteContext = websiteContext;
    }

    public async Task<IEnumerable<Booking>> GetAllBookingsAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<IEnumerable<Booking>> QueryBookingsAsync(
        string? email = null,
        string? userId = null,
        IEnumerable<string>? ids = null,
        string? status = null,
        string? search = null,
        int? skip = null,
        int? limit = null)
    {
        return await _repository.QueryAsync(email, userId, ids, status, search, skip, limit);
    }

    public async Task<Booking?> GetBookingByIdAsync(string id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<Booking?> GetBookingByReferenceAsync(string reference)
    {
        return await _repository.GetByReferenceAsync(reference);
    }

    public async Task CreateBookingAsync(Booking booking)
    {
        booking.WebsiteId = _websiteContext.CurrentWebsiteId;
        booking.CreatedAt = DateTime.UtcNow;
        booking.UpdatedAt = DateTime.UtcNow;

        if (string.IsNullOrWhiteSpace(booking.Reference))
        {
            var prefix = _websiteContext.CurrentWebsiteId switch
            {
                "tripgoasia" => "TGA",
                "technoheaven" => "TH",
                _ => "GT"
            };
            var rand = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(4)).ToUpperInvariant();
            booking.Reference = $"BK-{prefix}-{rand}";
        }

        await _repository.CreateAsync(booking);
    }

    public async Task UpdateBookingAsync(string id, Booking booking)
    {
        booking.WebsiteId = _websiteContext.CurrentWebsiteId;
        booking.UpdatedAt = DateTime.UtcNow;
        await _repository.UpdateAsync(id, booking);
    }

    public async Task DeleteBookingAsync(string id)
    {
        await _repository.DeleteAsync(id);
    }
}
