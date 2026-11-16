using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Repositories;

public interface INotificationRepository
{
    Task InsertAsync(CustomerNotification notification);
    Task<List<CustomerNotification>> GetByUserIdOrEmailAsync(string? userId, string? email, int limit = 50);
    Task<long> GetUnreadCountAsync(string? userId, string? email);
    Task MarkAsReadAsync(string notificationId);
    Task MarkAllAsReadAsync(string? userId, string? email);
}

public class NotificationRepository : INotificationRepository
{
    private readonly IMongoCollection<CustomerNotification> _collection;

    public NotificationRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<CustomerNotification>("notifications");
    }

    private FilterDefinition<CustomerNotification> BuildUserFilter(string? userId, string? email)
    {
        var builder = Builders<CustomerNotification>.Filter;
        var parts = new List<FilterDefinition<CustomerNotification>>();

        if (!string.IsNullOrWhiteSpace(userId))
        {
            parts.Add(builder.Eq(x => x.UserId, userId.Trim()));
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            parts.Add(builder.Eq(x => x.UserEmail, email.Trim().ToLowerInvariant()));
        }

        return parts.Count > 0 ? builder.Or(parts) : builder.Empty;
    }

    public async Task InsertAsync(CustomerNotification notification)
    {
        notification.CreatedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(notification.UserEmail))
        {
            notification.UserEmail = notification.UserEmail.Trim().ToLowerInvariant();
        }
        await _collection.InsertOneAsync(notification);
    }

    public async Task<List<CustomerNotification>> GetByUserIdOrEmailAsync(string? userId, string? email, int limit = 50)
    {
        var filter = BuildUserFilter(userId, email);
        return await _collection.Find(filter)
            .SortByDescending(x => x.CreatedAt)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task<long> GetUnreadCountAsync(string? userId, string? email)
    {
        var filter = Builders<CustomerNotification>.Filter.And(
            BuildUserFilter(userId, email),
            Builders<CustomerNotification>.Filter.Eq(x => x.IsRead, false)
        );
        return await _collection.CountDocumentsAsync(filter);
    }

    public async Task MarkAsReadAsync(string notificationId)
    {
        var filter = Builders<CustomerNotification>.Filter.Eq(x => x.Id, notificationId);
        var update = Builders<CustomerNotification>.Update.Set(x => x.IsRead, true);
        await _collection.UpdateOneAsync(filter, update);
    }

    public async Task MarkAllAsReadAsync(string? userId, string? email)
    {
        var filter = Builders<CustomerNotification>.Filter.And(
            BuildUserFilter(userId, email),
            Builders<CustomerNotification>.Filter.Eq(x => x.IsRead, false)
        );
        var update = Builders<CustomerNotification>.Update.Set(x => x.IsRead, true);
        await _collection.UpdateManyAsync(filter, update);
    }
}
