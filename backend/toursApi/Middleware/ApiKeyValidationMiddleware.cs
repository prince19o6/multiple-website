using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using ToursApi.Configuration;
using ToursApi.Models;
using ToursApi.Repositories;
using ToursApi.Services;

namespace ToursApi.Middleware;

public class ApiKeyValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyValidationMiddleware> _logger;

    public ApiKeyValidationMiddleware(RequestDelegate next, ILogger<ApiKeyValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context,
        IWebsiteContext websiteContext,
        IApiKeyRepository apiKeyRepository,
        IApiKeyRateLimiter rateLimiter)
    {
        // 1. Bypass CORS preflight OPTIONS
        if (HttpMethods.IsOptions(context.Request.Method))
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.Value ?? string.Empty;

        // 2. Bypass public system, catalog read, and authentication endpoints
        if (path == "/" ||
            path == "/health" ||
            path.StartsWith("/api/health", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/core/v1", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/config", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/visa/check-validity", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/auth/", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Allow all public read GET/HEAD requests to catalog and hub endpoints (except admin and private account routes)
        var isGetOrHead = HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method);
        var isPrivate = path.StartsWith("/api/admin", StringComparison.OrdinalIgnoreCase) ||
                        path.StartsWith("/api/users", StringComparison.OrdinalIgnoreCase) ||
                        path.StartsWith("/api/bookings", StringComparison.OrdinalIgnoreCase);

        if (isGetOrHead && !isPrivate)
        {
            await _next(context);
            return;
        }

        // Only enforce on /api routes
        if (!path.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var currentWebsiteId = websiteContext.CurrentWebsiteId;
        if (string.IsNullOrWhiteSpace(currentWebsiteId))
        {
            // WebsiteContextMiddleware should have already resolved this. If missing, pass through to 404 handler
            await _next(context);
            return;
        }

        // Auto-seed default keys if DB collection is empty (runs safely once in background, zero latency)
        _ = Task.Run(async () =>
        {
            try
            {
                await apiKeyRepository.SeedDefaultKeysIfEmptyAsync(currentWebsiteId);
            }
            catch { }
        });

        // 3. Extract API Key header
        string? rawKey = null;
        string keySource = "none";

        if (context.Request.Headers.TryGetValue("X-Api-Key", out var apiKeyHeader) && !string.IsNullOrWhiteSpace(apiKeyHeader))
        {
            rawKey = apiKeyHeader.ToString().Trim();
            keySource = "X-Api-Key";
        }
        else if (context.Request.Headers.TryGetValue("X-App-Key", out var appKeyHeader) && !string.IsNullOrWhiteSpace(appKeyHeader))
        {
            rawKey = appKeyHeader.ToString().Trim();
            keySource = "X-App-Key";
        }
        else if (context.Request.Headers.TryGetValue("Authorization", out var authHeader) && !string.IsNullOrWhiteSpace(authHeader))
        {
            var authStr = authHeader.ToString().Trim();
            if (authStr.StartsWith("ApiKey ", StringComparison.OrdinalIgnoreCase))
            {
                rawKey = authStr.Substring(7).Trim();
                keySource = "Authorization:ApiKey";
            }
        }

        // 4. Missing API Key check
        if (string.IsNullOrWhiteSpace(rawKey))
        {
            // If the client supplies an authenticated user/admin Bearer token (e.g. browser admin session without API key),
            // allow it to proceed to UseAuthentication / UseAuthorization for cryptographic JWT validation.
            if (context.Request.Headers.TryGetValue("Authorization", out var bearerHeader) &&
                bearerHeader.ToString().Trim().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            _logger.LogWarning("[ApiKeyMiddleware] Rejected request to {Path}: Missing API key for website '{WebsiteId}'",
                path, currentWebsiteId);

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                error = "Authentication required. Please provide a valid tenant API key via 'X-Api-Key' (server) or 'X-App-Key' (mobile) header.",
                code = "API_KEY_MISSING",
                website = currentWebsiteId
            });
            return;
        }

        // 5. Hostname resolution
        var rawHostname = context.Request.Headers["X-Website-Hostname"].ToString();
        if (string.IsNullOrWhiteSpace(rawHostname))
        {
            rawHostname = websiteContext.CurrentSite?.CanonicalHostname ?? "localhost";
        }

        // 6. Validate Key in Tenant Database
        var apiKey = await apiKeyRepository.ValidateKeyAsync(rawKey, currentWebsiteId, rawHostname);

        if (apiKey == null)
        {
            _logger.LogWarning("[ApiKeyMiddleware] Rejected request to {Path}: Invalid API key from header '{KeySource}' for website '{WebsiteId}', hostname '{Hostname}'",
                path, keySource, currentWebsiteId, rawHostname);

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                error = "The provided API key is invalid, revoked, expired, or does not match this website tenant and hostname.",
                code = "API_KEY_INVALID",
                website = currentWebsiteId
            });
            return;
        }

        // 7. Scope & Privilege Enforcement for Low-Privilege Mobile App Keys
        if (apiKey.Type == "app")
        {
            var isWriteMethod = !HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method);
            var isAdminRoute = path.StartsWith("/api/admin", StringComparison.OrdinalIgnoreCase) ||
                               path.StartsWith("/api/core/v1/config", StringComparison.OrdinalIgnoreCase) && HttpMethods.IsPut(context.Request.Method);

            // App keys cannot perform admin tasks
            if (isAdminRoute)
            {
                _logger.LogWarning("[ApiKeyMiddleware] App key '{KeyPrefix}...' denied access to admin endpoint {Path}", apiKey.KeyPrefix, path);
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    error = "App key has insufficient permissions for administrative operations.",
                    code = "INSUFFICIENT_SCOPE"
                });
                return;
            }

            // Write operations by mobile clients require user JWT Bearer authorization
            if (isWriteMethod && !context.Request.Headers.ContainsKey("Authorization") && !path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("[ApiKeyMiddleware] Write operation to {Path} attempted with app key '{KeyPrefix}...' without user JWT", path, apiKey.KeyPrefix);
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    error = "User authentication (Bearer JWT) is required for write operations.",
                    code = "USER_JWT_REQUIRED"
                });
                return;
            }
        }

        // 8. Rate Limiting Check
        if (!rateLimiter.IsAllowed(apiKey.Id, apiKey.RateLimitPerMinute, out var remaining, out var resetSeconds))
        {
            _logger.LogWarning("[ApiKeyMiddleware] Key '{KeyPrefix}...' exceeded rate limit ({Limit} req/min) on {Path}",
                apiKey.KeyPrefix, apiKey.RateLimitPerMinute, path);

            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.ContentType = "application/json";
            context.Response.Headers["Retry-After"] = resetSeconds.ToString();
            context.Response.Headers["X-RateLimit-Limit"] = apiKey.RateLimitPerMinute.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = "0";
            context.Response.Headers["X-RateLimit-Reset"] = resetSeconds.ToString();

            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                error = "API rate limit exceeded. Please wait and retry.",
                code = "RATE_LIMIT_EXCEEDED",
                retryAfter = resetSeconds
            });
            return;
        }

        // Set response rate limit headers
        context.Response.Headers["X-RateLimit-Limit"] = apiKey.RateLimitPerMinute.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = remaining.ToString();
        context.Response.Headers["X-RateLimit-Reset"] = resetSeconds.ToString();

        // 9. Asynchronously update last used
        _ = apiKeyRepository.UpdateLastUsedAsync(apiKey.Id);

        // Store validated key object in context items for controllers
        context.Items["ApiKey"] = apiKey;

        await _next(context);
    }
}
