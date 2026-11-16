using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface IEmailOutboxRepository
{
    Task InsertAsync(EmailOutbox outbox);
    Task<List<EmailOutbox>> GetPendingToProcessAsync(int limit = 25);
    Task<List<EmailOutbox>> GetByBookingIdAsync(string bookingId);
    Task UpdateAsync(EmailOutbox outbox);
}

public class EmailOutboxRepository : IEmailOutboxRepository
{
    private readonly IMongoCollection<EmailOutbox> _collection;

    public EmailOutboxRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<EmailOutbox>("emailOutbox");
    }

    public async Task InsertAsync(EmailOutbox outbox)
    {
        outbox.CreatedAt = DateTime.UtcNow;
        outbox.UpdatedAt = DateTime.UtcNow;
        await _collection.InsertOneAsync(outbox);
    }

    public async Task<List<EmailOutbox>> GetPendingToProcessAsync(int limit = 25)
    {
        var now = DateTime.UtcNow;
        var filter = Builders<EmailOutbox>.Filter.And(
            Builders<EmailOutbox>.Filter.Eq(x => x.Status, EmailOutboxStatus.Queued),
            Builders<EmailOutbox>.Filter.Lte(x => x.NextAttemptAt, now)
        );

        return await _collection.Find(filter)
            .SortBy(x => x.NextAttemptAt)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<List<EmailOutbox>> GetByBookingIdAsync(string bookingId)
    {
        var filter = Builders<EmailOutbox>.Filter.Or(
            Builders<EmailOutbox>.Filter.Eq(x => x.BookingId, bookingId),
            Builders<EmailOutbox>.Filter.Eq(x => x.BookingReference, bookingId)
        );

        return await _collection.Find(filter)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task UpdateAsync(EmailOutbox outbox)
    {
        outbox.UpdatedAt = DateTime.UtcNow;
        var filter = Builders<EmailOutbox>.Filter.Eq(x => x.Id, outbox.Id);
        await _collection.ReplaceOneAsync(filter, outbox);
    }
}
