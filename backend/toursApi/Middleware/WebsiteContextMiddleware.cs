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
        else if (!string.IsNullOrWhiteSpace(context.Request.Host.Host)
                 && !IsLocalHost(context.Request.Host.Host))
        {
            rawHostname = context.Request.Host.Host;
        }

        if (context.Request.Path.StartsWithSegments("/api"))
        {
            // For general health probes without a host header, default to gujjutours
            if (context.Request.Path.StartsWithSegments("/api/health") && string.IsNullOrWhiteSpace(rawHostname))
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
        catch (MongoDatabaseUnavailableException ex)
        {
            _logger?.LogError(ex, "[WebsiteContext] MongoDB unavailable for database '{DatabaseName}': {Message}", ex.DatabaseName, ex.Message);
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                context.Response.ContentType = "application/json";
                context.Response.Headers["X-Data-Source"] = "mongodb";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Database unavailable",
                    message = $"Failed to connect to MongoDB database '{ex.DatabaseName}'",
                    website = ex.WebsiteId,
                    dataSource = "mongodb"
                });
            }
        }
        catch (Exception ex) when (ex is MongoException or TimeoutException)
        {
            var dbName = websiteContext.DatabaseName ?? "tours_unknown";
            var siteId = websiteContext.CurrentWebsiteId ?? "unknown";
            _logger?.LogError(ex, "[WebsiteContext] MongoDB driver exception for database '{DatabaseName}': {Message}", dbName, ex.Message);
            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                context.Response.ContentType = "application/json";
                context.Response.Headers["X-Data-Source"] = "mongodb";
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Database unavailable",
                    message = $"Failed to connect to MongoDB database '{dbName}'",
                    website = siteId,
                    dataSource = "mongodb"
                });
            }
        }
    }

    private static bool IsLocalHost(string host) =>
        host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || host.Equals("127.0.0.1")
        || host.Equals("::1");
}