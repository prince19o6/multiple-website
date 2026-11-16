using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Services;

public interface INotificationService
{
    Task CreateNotificationAsync(
        string websiteId,
        string? userId,
        string userEmail,
        string title,
        string message,
        string type,
        string? status = null,
        string? bookingId = null,
        string? bookingReference = null);

    Task<List<CustomerNotification>> GetUserNotificationsAsync(string? userId, string? email, int limit = 50);
    Task<long> GetUnreadCountAsync(string? userId, string? email);
    Task MarkAsReadAsync(string notificationId);
    Task MarkAllAsReadAsync(string? userId, string? email);
}

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;

    public NotificationService(INotificationRepository repo)
    {
        _repo = repo;
    }

    public async Task CreateNotificationAsync(
        string websiteId,
        string? userId,
        string userEmail,
        string title,
        string message,
        string type,
        string? status = null,
        string? bookingId = null,
        string? bookingReference = null)
    {
        var notification = new CustomerNotification
        {
            WebsiteId = websiteId,
            UserId = userId,
            UserEmail = userEmail.Trim().ToLowerInvariant(),
            Title = title,
            Message = message,
            Type = type,
            Status = status,
            BookingId = bookingId,
            BookingReference = bookingReference,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.InsertAsync(notification);
    }

    public async Task<List<CustomerNotification>> GetUserNotificationsAsync(string? userId, string? email, int limit = 50)
    {
        return await _repo.GetByUserIdOrEmailAsync(userId, email, limit);
    }

    public async Task<long> GetUnreadCountAsync(string? userId, string? email)
    {
        return await _repo.GetUnreadCountAsync(userId, email);
    }

    public async Task MarkAsReadAsync(string notificationId)
    {
        await _repo.MarkAsReadAsync(notificationId);
    }

    public async Task MarkAllAsReadAsync(string? userId, string? email)
    {
        await _repo.MarkAllAsReadAsync(userId, email);
    }
}
