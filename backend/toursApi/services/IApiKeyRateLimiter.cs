namespace ToursApi.Services;

public interface IApiKeyRateLimiter
{
    /// <summary>
    /// Evaluates if an API key has exceeded its per-minute rate limit.
    /// </summary>
    bool IsAllowed(string keyId, int maxRequestsPerMinute, out int remaining, out int resetSeconds);
}

