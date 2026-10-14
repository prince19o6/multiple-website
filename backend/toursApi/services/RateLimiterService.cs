using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace ToursApi.Services;

public class RateLimiterService : IRateLimiterService
{
    private class RequestRecord
    {
        public List<DateTime> Timestamps { get; } = new();
    }

    private readonly ConcurrentDictionary<string, RequestRecord> _actions = new();

    public bool IsAllowed(string websiteId, string clientIp, string action, int maxRequests = 15, int windowSeconds = 60)
    {
        if (string.IsNullOrWhiteSpace(clientIp)) return true;

        var key = $"{websiteId}:{clientIp}:{action}";
        var record = _actions.GetOrAdd(key, _ => new RequestRecord());
        var cutoff = DateTime.UtcNow.AddSeconds(-windowSeconds);

        lock (record)
        {
            record.Timestamps.RemoveAll(t => t < cutoff);
            if (record.Timestamps.Count >= maxRequests)
            {
                return false;
            }
            record.Timestamps.Add(DateTime.UtcNow);
            return true;
        }
    }

    public void Reset(string? websiteId = null, string? clientIp = null)
    {
        if (string.IsNullOrWhiteSpace(websiteId) && string.IsNullOrWhiteSpace(clientIp))
        {
            _actions.Clear();
            return;
        }

        foreach (var key in _actions.Keys.ToList())
        {
            var matchSite = !string.IsNullOrWhiteSpace(websiteId) && key.StartsWith($"{websiteId}:", StringComparison.OrdinalIgnoreCase);
            var matchIp = !string.IsNullOrWhiteSpace(clientIp) && key.Contains($":{clientIp}:", StringComparison.OrdinalIgnoreCase);

            if (matchSite || matchIp)
            {
                _actions.TryRemove(key, out _);
            }
        }
    }
}
