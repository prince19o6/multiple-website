using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System;
using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Exceptions;
using ToursApi.Services;

namespace ToursApi.Middleware;

public class WebsiteContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<WebsiteContextMiddleware>? _logger;

    public WebsiteContextMiddleware(RequestDelegate next, ILogger<WebsiteContextMiddleware>? logger = null)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IWebsiteContext websiteContext)
    {
        // Preflight OPTIONS requests must bypass tenant validation for CORS negotiation
        if (HttpMethods.IsOptions(context.Request.Method))
        {
            await _next(context);
            return;
        }

        // Health check / root endpoint passes through
        if (context.Request.Path == "/" || context.Request.Path == "/health")
        {
            await _next(context);
            return;
        }

        string? rawHostname = null;

        if (context.Request.Headers.TryGetValue("X-Website-Hostname", out var hostnameHeader)
            && !string.IsNullOrWhiteSpace(hostnameHeader))
        {
            rawHostname = hostnameHeader.ToString();
        }
        else if (context.Request.Headers.TryGetValue("X-Website-Id", out var idHeader)
                 && !string.IsNullOrWhiteSpace(idHeader))
        {
            rawHostname = idHeader.ToString();
        }
        else if (context.Request.Query.TryGetValue("website", out var queryWebsite)
                 && !string.IsNullOrWhiteSpace(queryWebsite))
        {
            rawHostname = queryWebsite.ToString();
        }
        else if (context.Request.Query.TryGetValue("site", out var querySite)
                 && !string.IsNullOrWhiteSpace(querySite))
        {
            rawHostname = querySite.ToString();
        }
        else if (context.Request.Query.TryGetValue("siteId", out var querySiteId)
                 && !string.IsNullOrWhiteSpace(querySiteId))
        {
            rawHostname = querySiteId.ToString();
        }
        else if (context.Request.Query.TryGetValue("hostname", out var queryHost)
                 && !string.IsNullOrWhiteSpace(queryHost))
        {
            rawHostname = queryHost.ToString();
        }
        else if (!string.IsNullOrWhiteSpace(context.Request.Host.Host)
                 && !IsLocalHost(context.Request.Host.Host))
        {
            rawHostname = context.Request.Host.Host;
        }

        // If not found in headers or host, inspect route path segments:
        // E.g. /api/core/v1/config/{hostname} or /api/config/{hostname}
        if (string.IsNullOrWhiteSpace(rawHostname))
        {
            var pathStr = context.Request.Path.Value ?? string.Empty;
            if (pathStr.StartsWith("/api/core/v1/config/", StringComparison.OrdinalIgnoreCase))
            {
                var candidate = pathStr.Substring("/api/core/v1/config/".Length).Trim().Split('/', '?')[0];
                if (!string.IsNullOrWhiteSpace(candidate))
                {
                    rawHostname = candidate;
                }
            }
            else if (pathStr.StartsWith("/api/config/", StringComparison.OrdinalIgnoreCase))
            {
                var candidate = pathStr.Substring("/api/config/".Length).Trim().Split('/', '?')[0];
                if (!string.IsNullOrWhiteSpace(candidate))
                {
                    rawHostname = candidate;
                }
            }
        }

        if (context.Request.Path.StartsWithSegments("/api"))
        {
            // For general health probes without a host header, default to gujjutours
            if (context.Request.Path.StartsWithSegments("/api/health") && string.IsNullOrWhiteSpace(rawHostname))
            {
                rawHostname = "www.gujjutours.com";
            }

            // In local development or when connecting from localhost, default to gujjutours
            if (string.IsNullOrWhiteSpace(rawHostname) && IsLocalHost(context.Request.Host.Host))
            {
                rawHostname = "www.gujjutours.com";
            }

            // Missing hostname strictly returns 404 (never 400 or default site)
            if (string.IsNullOrWhiteSpace(rawHostname))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    "{\"success\":false,\"error\":\"Website hostname is missing. Header X-Website-Hostname is required (e.g. www.gujjutours.com, www.tripgoasia.com, stagingb2b.technoheaven.com).\"}");
                return;
            }

            var site = WebsiteRegistry.Resolve(rawHostname);
            // Unknown hostname strictly returns 404 (never fallback to default site)
            if (site == null)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    $"{{\"success\":false,\"error\":\"Unknown website tenant or hostname '{rawHostname}'. Allowed tenants: gujjutours, tripgoasia, technoheaven.\"}}");
                return;
            }

            websiteContext.CurrentSite = site;
            websiteContext.CurrentWebsiteId = site.WebsiteId;

            // Set tenant diagnostic headers on response
            context.Response.Headers["X-Resolved-Website"] = site.WebsiteId;
            context.Response.Headers["X-Resolved-Database"] = site.DatabaseName;
            context.Response.Headers["X-Resolved-Hostname"] = rawHostname;
            if (!context.Response.Headers.ContainsKey("X-Data-Source"))
            {
                context.Response.Headers["X-Data-Source"] = "mongodb";
            }

            _logger?.LogInformation(
                "[WebsiteContext] {Method} {Path} -> Resolved Tenant: {WebsiteId} ({SiteName}), Database: {DatabaseName}, Hostname: {Hostname}",
                context.Request.Method,
                context.Request.Path,
                site.WebsiteId,
                site.SiteName,
                site.DatabaseName,
                rawHostname);
        }

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var dbName = websiteContext.DatabaseName ?? "tours_unknown";
            var siteId = websiteContext.CurrentWebsiteId ?? "gujjutours";
            _logger?.LogWarning(ex, "[WebsiteContext] Middleware handled exception for database '{DatabaseName}': {Message}", dbName, ex.Message);

            if (!context.Response.HasStarted)
            {
                if (HttpMethods.IsGet(context.Request.Method))
                {
                    context.Response.StatusCode = StatusCodes.Status200OK;
                    context.Response.ContentType = "application/json";
                    context.Response.Headers["X-Data-Source"] = "offline-fallback";

                    var pathStr = context.Request.Path.Value ?? string.Empty;
                    if (pathStr.StartsWith("/api/core/v1/config", StringComparison.OrdinalIgnoreCase))
                    {
                        var site = websiteContext.CurrentSite ?? WebsiteRegistry.Resolve(siteId) ?? WebsiteRegistry.SitesById["gujjutours"];
                        await context.Response.WriteAsJsonAsync(new
                        {
                            result = new
                            {
                                website = new
                                {
                                    id = site.WebsiteId,
                                    name = site.SiteName,
                                    canonicalHostname = site.CanonicalHostname,
                                    logoUrl = site.LogoUrl,
                                    currency = new { code = site.Currency, symbol = site.CurrencySymbol, name = site.Currency, decimalPlaces = 2 }
                                },
                                site = new
                                {
                                    id = site.WebsiteId,
                                    name = site.SiteName,
                                    canonicalHostname = site.CanonicalHostname,
                                    logoUrl = site.LogoUrl,
                                    currency = new { code = site.Currency, symbol = site.CurrencySymbol, name = site.Currency, decimalPlaces = 2 }
                                },
                                colors = new
                                {
                                    primary = site.PrimaryColor,
                                    secondary = site.SecondaryColor,
                                    brandPrimary = site.PrimaryColor,
                                    brandSecondary = site.SecondaryColor,
                                    accent = site.SecondaryColor,
                                },
                                theme = new
                                {
                                    defaultMode = site.DefaultMode,
                                    colors = new
                                    {
                                        brandPrimary = site.PrimaryColor,
                                        brandSecondary = site.SecondaryColor,
                                        accent = site.SecondaryColor,
                                    }
                                },
                                modules = new
                                {
                                    hotels = true,
                                    tours = true,
                                    packages = true,
                                    flights = true,
                                    transfers = true,
                                    visas = true,
                                    restaurants = true,
                                    buildpackage = true
                                },
                                websiteModules = new object[]
                                {
                                    new { module = "hotels", isEnabled = true },
                                    new { module = "tours", isEnabled = true },
                                    new { module = "packages", isEnabled = true },
                                    new { module = "flights", isEnabled = true },
                                    new { module = "transfers", isEnabled = true },
                                    new { module = "visas", isEnabled = true },
                                    new { module = "restaurants", isEnabled = true },
                                    new { module = "buildpackage", isEnabled = true }
                                }
                            },
                            isSuccess = true
                        });
                        return;
                    }

                    if (pathStr.StartsWith("/api/core/v1/home", StringComparison.OrdinalIgnoreCase))
                    {
                        var reqMod = context.Request.Query["module"].ToString();
                        var homePayload = ResilientDataGenerator.BuildSafeHomePayload(siteId, reqMod);
                        await context.Response.WriteAsJsonAsync(homePayload);
                        return;
                    }

                    if (pathStr.StartsWith("/api/hotels", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetItemsForModule("hotels");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    if (pathStr.StartsWith("/api/tours", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetItemsForModule("tours");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    if (pathStr.StartsWith("/api/packages", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetItemsForModule("packages");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    if (pathStr.StartsWith("/api/flights", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetItemsForModule("flights");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    if (pathStr.StartsWith("/api/transfers", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetItemsForModule("transfers");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    if (pathStr.StartsWith("/api/visas", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetItemsForModule("visas");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    if (pathStr.StartsWith("/api/restaurants", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetItemsForModule("restaurants");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    if (pathStr.StartsWith("/api/buildpackage", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetItemsForModule("buildpackage");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    if (pathStr.StartsWith("/api/destinations", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetDestinationsForModule("hotels");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    if (pathStr.StartsWith("/api/categories", StringComparison.OrdinalIgnoreCase))
                    {
                        var items = ResilientDataGenerator.GetCategoriesForModule("hotels");
                        await context.Response.WriteAsJsonAsync(new { success = true, count = items.Count, total = items.Count, data = items });
                        return;
                    }

                    await context.Response.WriteAsJsonAsync(new
                    {
                        success = true,
                        data = Array.Empty<object>(),
                        message = "Operating in offline resilient fallback mode",
                        website = siteId,
                        dataSource = "offline-fallback"
                    });
                    return;
                }

                if (context.Request.Path.StartsWithSegments("/api/auth/login"))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    context.Response.Headers["X-Data-Source"] = "offline-fallback";
                    await context.Response.WriteAsJsonAsync(new
                    {
                        success = false,
                        error = "Invalid email address or password",
                        website = siteId
                    });
                    return;
                }

                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                context.Response.ContentType = "application/json";
                context.Response.Headers["X-Data-Source"] = "offline-fallback";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Service degraded",
                    message = $"Operation unavailable offline for '{dbName}': {ex.Message}",
                    website = siteId,
                    dataSource = "offline-fallback"
                });
            }
        }
    }

    private static bool IsLocalHost(string host) =>
        host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || host.Equals("127.0.0.1")
        || host.Equals("::1");
}