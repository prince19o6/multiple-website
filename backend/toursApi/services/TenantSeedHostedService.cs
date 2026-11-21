using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ToursApi.Services;

public class TenantSeedHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TenantSeedHostedService> _logger;

    public TenantSeedHostedService(IServiceScopeFactory scopeFactory, ILogger<TenantSeedHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            // Give Kestrel a short moment to bind and launch
            await Task.Delay(2000, stoppingToken);

            _logger.LogInformation("Starting automated tenant database verification and idempotent seed...");
            using var scope = _scopeFactory.CreateScope();
            var seedService = scope.ServiceProvider.GetRequiredService<ITenantSeedService>();
            var summary = await seedService.SeedAllTenantsAsync();
            _logger.LogInformation("Automated tenant database seed completed successfully.");
        }
        catch (OperationCanceledException)
        {
            // Graceful shutdown
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Background tenant database seed encountered an issue (resilient fallback active).");
        }
    }
}
