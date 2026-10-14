namespace ToursApi.Services;

public interface IRateLimiterService
{
    bool IsAllowed(string websiteId, string clientIp, string action, int maxRequests = 15, int windowSeconds = 60);
    void Reset(string? websiteId = null, string? clientIp = null);
}
