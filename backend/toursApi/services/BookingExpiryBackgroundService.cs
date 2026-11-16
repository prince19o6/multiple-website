using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Services;

/// <summary>
/// Hosted background service that periodically sweeps old pending bookings past the website's
/// `PendingExpiryHours` threshold, transitions them to `Expired`, and alerts the customer.
/// </summary>
public class BookingExpiryBackgroundService : BackgroundService
{
    private readonly IMongoDatabaseProvider _dbProvider;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BookingExpiryBackgroundService> _logger;

    public BookingExpiryBackgroundService(
        IMongoDatabaseProvider dbProvider,
        IServiceProvider serviceProvider,
        ILogger<BookingExpiryBackgroundService> logger)
    {
        _dbProvider = dbProvider;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[EXPIRY-DAEMON] Booking Expiry Background Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var hadError = false;
            try
            {
                foreach (var site in WebsiteRegistry.SitesById.Values)
                {
                    if (stoppingToken.IsCancellationRequested) break;
                    await CheckAndExpireBookingsForSiteAsync(site, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                hadError = true;
                _logger.LogWarning("[EXPIRY-DAEMON] Booking expiry sweep deferred: {Message}", ex.Message);
            }

            // Normal interval: 2 minutes. If database unreachable: 60s backoff
            await Task.Delay(TimeSpan.FromSeconds(hadError ? 60 : 120), stoppingToken);
        }

        _logger.LogInformation("[EXPIRY-DAEMON] Booking Expiry Background Service stopped.");
    }

    private async Task CheckAndExpireBookingsForSiteAsync(WebsiteConfig site, CancellationToken ct)
    {
        if (site.PendingExpiryHours <= 0) return;

        try
        {
            var db = _dbProvider.GetDatabase(site.DatabaseName);
            var bookingsCollection = db.GetCollection<Booking>("bookings");

            var cutoff = DateTime.UtcNow.AddHours(-site.PendingExpiryHours);

            var filter = Builders<Booking>.Filter.And(
                Builders<Booking>.Filter.Eq(b => b.Status, BookingStatus.Pending),
                Builders<Booking>.Filter.Lte(b => b.CreatedAt, cutoff)
            );

            var expiredCandidates = await bookingsCollection.Find(filter).Limit(25).ToListAsync(ct);

            if (expiredCandidates.Count == 0) return;

            _logger.LogInformation(
                "[EXPIRY-DAEMON] Found {Count} pending bookings to expire for {Site} (Cutoff: {Cutoff})",
                expiredCandidates.Count,
                site.SiteName,
                cutoff
            );

            using var scope = _serviceProvider.CreateScope();
            var websiteContext = scope.ServiceProvider.GetRequiredService<IWebsiteContext>();
            websiteContext.CurrentSite = site;
            websiteContext.CurrentWebsiteId = site.WebsiteId;

            var workflowService = scope.ServiceProvider.GetRequiredService<IBookingWorkflowService>();

            foreach (var b in expiredCandidates)
            {
                if (ct.IsCancellationRequested) break;
                try
                {
                    await workflowService.ExpireBookingAsync(b.Id ?? b.Reference, site);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[EXPIRY-DAEMON] Failed expiring booking {Ref} for {Site}", b.Reference, site.SiteName);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("[EXPIRY-DAEMON] Database unreachable for {Site}: {Message}", site.WebsiteId, ex.Message);
        }
    }
}
