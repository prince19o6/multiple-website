using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ToursApi.Services;

namespace ToursApi.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IWebsiteContext _websiteContext;

    public NotificationsController(
        INotificationService notificationService,
        IWebsiteContext websiteContext)
    {
        _notificationService = notificationService;
        _websiteContext = websiteContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] string? email, [FromQuery] int limit = 50)
    {
        var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;

        var targetEmail = !string.IsNullOrWhiteSpace(email) ? email.Trim() : authEmail;

        if (string.IsNullOrWhiteSpace(authUserId) && string.IsNullOrWhiteSpace(targetEmail))
        {
            return Ok(new { success = true, data = Array.Empty<object>() });
        }

        var list = await _notificationService.GetUserNotificationsAsync(authUserId, targetEmail, limit);
        return Ok(new { success = true, data = list });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount([FromQuery] string? email)
    {
        var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;

        var targetEmail = !string.IsNullOrWhiteSpace(email) ? email.Trim() : authEmail;

        if (string.IsNullOrWhiteSpace(authUserId) && string.IsNullOrWhiteSpace(targetEmail))
        {
            return Ok(new { success = true, unreadCount = 0 });
        }

        var count = await _notificationService.GetUnreadCountAsync(authUserId, targetEmail);
        return Ok(new { success = true, unreadCount = count });
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        await _notificationService.MarkAsReadAsync(id);
        return Ok(new { success = true, message = "Notification marked as read." });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead([FromQuery] string? email)
    {
        var authUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var authEmail = User?.FindFirst(ClaimTypes.Email)?.Value;

        var targetEmail = !string.IsNullOrWhiteSpace(email) ? email.Trim() : authEmail;

        await _notificationService.MarkAllAsReadAsync(authUserId, targetEmail);
        return Ok(new { success = true, message = "All notifications marked as read." });
    }
}
