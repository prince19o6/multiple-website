using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using ToursApi.Models;
using ToursApi.Repositories;

namespace ToursApi.Services;

public interface IEmailOutboxService
{
    Task EnqueueAsync(
        string websiteId,
        string recipientEmail,
        string recipientName,
        string subject,
        string template,
        object payload,
        string? bookingId = null,
        string? bookingReference = null);

    Task<List<EmailOutbox>> GetOutboxForBookingAsync(string bookingId);
}

public class EmailOutboxService : IEmailOutboxService
{
    private readonly IEmailOutboxRepository _outboxRepo;

    public EmailOutboxService(IEmailOutboxRepository outboxRepo)
    {
        _outboxRepo = outboxRepo;
    }

    public async Task EnqueueAsync(
        string websiteId,
        string recipientEmail,
        string recipientName,
        string subject,
        string template,
        object payload,
        string? bookingId = null,
        string? bookingReference = null)
    {
        var outbox = new EmailOutbox
        {
            WebsiteId = websiteId,
            RecipientEmail = recipientEmail.Trim(),
            RecipientName = recipientName.Trim(),
            Subject = subject.Trim(),
            Template = template.Trim(),
            PayloadJson = JsonSerializer.Serialize(payload),
            Status = EmailOutboxStatus.Queued,
            Attempts = 0,
            MaxAttempts = 5,
            NextAttemptAt = DateTime.UtcNow,
            BookingId = bookingId,
            BookingReference = bookingReference,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _outboxRepo.InsertAsync(outbox);
    }

    public async Task<List<EmailOutbox>> GetOutboxForBookingAsync(string bookingId)
    {
        return await _outboxRepo.GetByBookingIdAsync(bookingId);
    }
}
