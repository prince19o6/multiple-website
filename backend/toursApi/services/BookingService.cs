using System;
using System.Collections.Generic;
using System.Security.Cryptography;
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

    public async Task<(IEnumerable<Booking> Items, long TotalCount)> QueryBookingsPagedAsync(
        string? email = null,
        string? userId = null,
        IEnumerable<string>? ids = null,
        string? status = null,
        string? search = null,
        int page = 1,
        int pageSize = 20)
    {
        var validPage = Math.Max(1, page);
        var validPageSize = Math.Clamp(pageSize, 1, 100);
        var skip = (validPage - 1) * validPageSize;

        var items = await _repository.QueryAsync(email, userId, ids, status, search, skip, validPageSize);
        var count = await _repository.CountAsync(email, userId, ids, status, search);

        return (items, count);
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

    public async Task<Booking?> GetBookingByReferenceAndEmailAsync(string reference, string email)
    {
        return await _repository.GetByReferenceAndEmailAsync(reference, email);
    }

    public async Task<Booking?> GetByIdempotencyKeyAsync(string idempotencyKey)
    {
        return await _repository.GetByIdempotencyKeyAsync(idempotencyKey);
    }

    public string GenerateBookingReference()
    {
        var siteId = _websiteContext.CurrentWebsiteId?.ToLowerInvariant();
        var prefix = siteId switch
        {
            "tripgoasia" => "TGA",
            "technoheaven" => "TH",
            _ => "GT"
        };

        var year = DateTime.UtcNow.Year;
        const string alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 characters, no ambiguous chars
        var randomBytes = RandomNumberGenerator.GetBytes(6);
        var chars = new char[6];
        for (int i = 0; i < 6; i++)
        {
            chars[i] = alphabet[randomBytes[i] % alphabet.Length];
        }

        return $"{prefix}-{year}-{new string(chars)}";
    }

    public async Task CreateBookingAsync(Booking booking)
    {
        booking.WebsiteId = _websiteContext.CurrentWebsiteId;
        booking.CreatedAt = DateTime.UtcNow;
        booking.UpdatedAt = DateTime.UtcNow;

        if (string.IsNullOrWhiteSpace(booking.Reference))
        {
            booking.Reference = GenerateBookingReference();
        }

        // Initialize status history if empty
        if (booking.StatusHistory == null || booking.StatusHistory.Count == 0)
        {
            booking.StatusHistory = new List<BookingStatusHistoryItem>
            {
                new()
                {
                    Status = booking.Status ?? "pending",
                    ChangedAt = DateTime.UtcNow,
                    Note = $"Reservation created via {booking.Source ?? "web"}",
                    ChangedBy = booking.UserId ?? "customer"
                }
            };
        }

        // Synchronize flat fields with snapshot for legacy consumers
        if (booking.Snapshot != null)
        {
            if (booking.TourId <= 0 && booking.Snapshot.TourId > 0) booking.TourId = booking.Snapshot.TourId;
            if (string.IsNullOrWhiteSpace(booking.TourName)) booking.TourName = booking.Snapshot.Title;
            if (string.IsNullOrWhiteSpace(booking.TourSlug)) booking.TourSlug = booking.Snapshot.Slug;
            if (string.IsNullOrWhiteSpace(booking.TourImage)) booking.TourImage = booking.Snapshot.CoverImage;
            if (string.IsNullOrWhiteSpace(booking.Location)) booking.Location = booking.Snapshot.Destination;
            if (string.IsNullOrWhiteSpace(booking.Destination)) booking.Destination = booking.Snapshot.Destination;
            if (string.IsNullOrWhiteSpace(booking.Currency)) booking.Currency = booking.Snapshot.Currency;
            if (string.IsNullOrWhiteSpace(booking.Duration)) booking.Duration = booking.Snapshot.Duration;
            booking.UnitPrice ??= booking.Snapshot.PricePerPerson;
        }

        if (booking.PriceBreakdown != null && booking.PriceBreakdown.Total > 0)
        {
            booking.TotalPrice = booking.PriceBreakdown.Total;
        }

        await _repository.CreateAsync(booking);
    }

    public async Task UpdateBookingAsync(string id, Booking booking)
    {
        booking.WebsiteId = _websiteContext.CurrentWebsiteId;
        booking.UpdatedAt = DateTime.UtcNow;

        // Keep flat fields in sync
        if (booking.PriceBreakdown != null && booking.PriceBreakdown.Total > 0)
        {
            booking.TotalPrice = booking.PriceBreakdown.Total;
        }

        await _repository.UpdateAsync(id, booking);
    }

    public async Task DeleteAsync(string id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task DeleteBookingAsync(string id)
    {
        await _repository.DeleteAsync(id);
    }

    public async Task<int> ClaimGuestBookingsAsync(string userId, string? email, IEnumerable<string>? references)
    {
        return await _repository.ClaimGuestBookingsAsync(userId, email, references);
    }
}
