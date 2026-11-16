using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Services;

/// <summary>
/// Reliable background processor that continuously delivers queued transactional emails
/// across all isolated tenant databases using exponential backoff retry.
/// </summary>
public class EmailOutboxBackgroundService : BackgroundService
{
    private readonly IMongoDatabaseProvider _dbProvider;
    private readonly IConfiguration _configuration;
    private readonly IEmailTemplateRenderer _templateRenderer;
    private readonly IEnumerable<IEmailSender> _emailSenders;
    private readonly ILogger<EmailOutboxBackgroundService> _logger;

    public EmailOutboxBackgroundService(
        IMongoDatabaseProvider dbProvider,
        IConfiguration configuration,
        IEmailTemplateRenderer templateRenderer,
        IEnumerable<IEmailSender> emailSenders,
        ILogger<EmailOutboxBackgroundService> logger)
    {
        _dbProvider = dbProvider;
        _configuration = configuration;
        _templateRenderer = templateRenderer;
        _emailSenders = emailSenders;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[OUTBOX-DAEMON] Email Outbox Processor started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var hadError = false;
            try
            {
                foreach (var site in WebsiteRegistry.SitesById.Values)
                {
                    if (stoppingToken.IsCancellationRequested) break;
                    await ProcessSiteOutboxAsync(site, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                hadError = true;
                _logger.LogWarning("[OUTBOX-DAEMON] Outbox sweep deferred: {Message}", ex.Message);
            }

            // Normal interval: 10s. If database connection timed out: 60s backoff
            await Task.Delay(TimeSpan.FromSeconds(hadError ? 60 : 10), stoppingToken);
        }

        _logger.LogInformation("[OUTBOX-DAEMON] Email Outbox Processor stopped.");
    }

    private IEmailSender SelectSender(WebsiteConfig site)
    {
        var configuredProvider = _configuration[$"Websites:{site.WebsiteId}:EmailProvider"]
            ?? _configuration["Email:Provider"]
            ?? "Dev";

        var sender = _emailSenders.FirstOrDefault(s => string.Equals(s.ProviderName, configuredProvider, StringComparison.OrdinalIgnoreCase))
            ?? _emailSenders.FirstOrDefault(s => s.ProviderName == "Dev")
            ?? throw new InvalidOperationException("No suitable email sender configured.");

        return sender;
    }

    private async Task ProcessSiteOutboxAsync(WebsiteConfig site, CancellationToken ct)
    {
        try
        {
            var db = _dbProvider.GetDatabase(site.DatabaseName);
            var outboxCollection = db.GetCollection<EmailOutbox>("emailOutbox");
            var bookingsCollection = db.GetCollection<Booking>("bookings");

            var now = DateTime.UtcNow;
            var filter = Builders<EmailOutbox>.Filter.And(
                Builders<EmailOutbox>.Filter.Eq(x => x.Status, EmailOutboxStatus.Queued),
                Builders<EmailOutbox>.Filter.Lte(x => x.NextAttemptAt, now)
            );

            var pendingBatch = await outboxCollection.Find(filter)
                .SortBy(x => x.NextAttemptAt)
                .Limit(10)
                .ToListAsync(ct);

            if (pendingBatch.Count == 0) return;

            var sender = SelectSender(site);

            foreach (var item in pendingBatch)
            {
                if (ct.IsCancellationRequested) break;

                try
                {
                    // Mark as Processing
                    item.Status = EmailOutboxStatus.Processing;
                    item.Attempts++;
                    item.UpdatedAt = DateTime.UtcNow;
                    await outboxCollection.ReplaceOneAsync(x => x.Id == item.Id, item, cancellationToken: ct);

                    // Fetch associated booking if any
                    Booking? booking = null;
                    if (!string.IsNullOrWhiteSpace(item.BookingId))
                    {
                        booking = await bookingsCollection.Find(b => b.Id == item.BookingId || b.Reference == item.BookingId).FirstOrDefaultAsync(ct);
                    }
                    else if (!string.IsNullOrWhiteSpace(item.BookingReference))
                    {
                        booking = await bookingsCollection.Find(b => b.Reference == item.BookingReference).FirstOrDefaultAsync(ct);
                    }

                    // Render HTML + Plain Text from template and payload
                    var (html, plainText, subject) = RenderTemplateContent(item, booking, site);

                    var emailMessage = new EmailMessage
                    {
                        ToEmail = item.RecipientEmail,
                        ToName = item.RecipientName,
                        Subject = !string.IsNullOrWhiteSpace(item.Subject) ? item.Subject : subject,
                        HtmlBody = html,
                        PlainTextBody = plainText,
                        ReplyTo = site.ReplyToEmail
                    };

                    await sender.SendAsync(emailMessage, site, ct);

                    // Mark as Sent
                    item.Status = EmailOutboxStatus.Sent;
                    item.SentAt = DateTime.UtcNow;
                    item.LastError = null;
                    item.UpdatedAt = DateTime.UtcNow;
                    await outboxCollection.ReplaceOneAsync(x => x.Id == item.Id, item, cancellationToken: ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[OUTBOX-DAEMON] Error delivering email outbox {Id} to {Recipient}", item.Id, item.RecipientEmail);

                    item.LastError = $"{ex.GetType().Name}: {ex.Message}";
                    item.UpdatedAt = DateTime.UtcNow;

                    if (item.Attempts >= item.MaxAttempts)
                    {
                        item.Status = EmailOutboxStatus.Failed;
                        _logger.LogWarning("[OUTBOX-DAEMON] Outbox item {Id} reached max attempts ({Max}). Marked as Failed.", item.Id, item.MaxAttempts);
                    }
                    else
                    {
                        item.Status = EmailOutboxStatus.Queued;
                        // Exponential backoff: 1 -> 15s, 2 -> 1m, 3 -> 5m, 4 -> 15m, 5 -> 30m
                        var backoffMinutes = item.Attempts switch
                        {
                            1 => 0.25, // 15 sec
                            2 => 1.0,  // 1 min
                            3 => 5.0,  // 5 min
                            4 => 15.0, // 15 min
                            _ => 30.0  // 30 min
                        };
                        item.NextAttemptAt = DateTime.UtcNow.AddMinutes(backoffMinutes);
                    }

                    await outboxCollection.ReplaceOneAsync(x => x.Id == item.Id, item, cancellationToken: ct);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("[OUTBOX-DAEMON] Database unreachable for {SiteId}: {Message}", site.WebsiteId, ex.Message);
        }
    }

    private (string Html, string PlainText, string Subject) RenderTemplateContent(EmailOutbox item, Booking? booking, WebsiteConfig site)
    {
        var dummyBooking = booking ?? new Booking
        {
            Reference = item.BookingReference ?? "REF-PENDING",
            TourName = "Tour Package",
            GuestName = item.RecipientName,
            Email = item.RecipientEmail,
            TotalPrice = 0.0,
            TravelDate = DateTime.UtcNow.AddDays(7),
            WebsiteId = site.WebsiteId
        };

        var webAppBaseUrl = _configuration["Cors:AllowedOrigins:0"] ?? "http://localhost:3000";

        using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(item.PayloadJson) ? "{}" : item.PayloadJson);
        var root = doc.RootElement;

        var reason = root.TryGetProperty("reason", out var rElem) ? rElem.GetString() ?? "" : "";
        var approveUrl = root.TryGetProperty("approveUrl", out var aElem) ? aElem.GetString() ?? "" : "";
        var rejectUrl = root.TryGetProperty("rejectUrl", out var rejElem) ? rejElem.GetString() ?? "" : "";
        var inboxUrl = root.TryGetProperty("inboxUrl", out var inElem) ? inElem.GetString() ?? "" : $"{webAppBaseUrl}/admin/bookings";

        return item.Template switch
        {
            EmailTemplateNames.CustomerBookingReceived =>
                _templateRenderer.RenderCustomerBookingReceived(dummyBooking, site),

            EmailTemplateNames.CustomerBookingConfirmed =>
                _templateRenderer.RenderCustomerBookingConfirmed(dummyBooking, site, webAppBaseUrl),

            EmailTemplateNames.CustomerBookingRejected =>
                _templateRenderer.RenderCustomerBookingRejected(dummyBooking, reason, site),

            EmailTemplateNames.CustomerBookingCancelled =>
                _templateRenderer.RenderCustomerBookingCancelled(dummyBooking, reason, site),

            EmailTemplateNames.CustomerBookingExpired =>
                _templateRenderer.RenderCustomerBookingExpired(dummyBooking, site),

            EmailTemplateNames.CustomerCancellationRequestReceived =>
                _templateRenderer.RenderCustomerCancellationRequestReceived(dummyBooking, reason, site),

            EmailTemplateNames.AdminNewBookingAlert =>
                _templateRenderer.RenderAdminNewBookingAlert(dummyBooking, site, approveUrl, rejectUrl),

            EmailTemplateNames.AdminCancellationRequestAlert =>
                _templateRenderer.RenderAdminCancellationRequestAlert(dummyBooking, reason, site, inboxUrl),

            _ => (
                Html: $"<div style='font-family: sans-serif; padding: 20px;'><h2>{WebUtility.HtmlEncode(item.Subject)}</h2><p>{WebUtility.HtmlEncode(item.PayloadJson)}</p></div>",
                PlainText: $"{item.Subject}\n\n{item.PayloadJson}",
                Subject: item.Subject
            )
        };
    }
}
