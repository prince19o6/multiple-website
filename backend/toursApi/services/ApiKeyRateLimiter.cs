using System;
using System.Collections.Concurrent;

namespace ToursApi.Services;

public class ApiKeyRateLimiter : IApiKeyRateLimiter
{
    private class RateBucket
    {
        public int Count;
        public long WindowStartEpochSeconds;
    }

    private readonly ConcurrentDictionary<string, RateBucket> _buckets = new();

    public bool IsAllowed(string keyId, int maxRequestsPerMinute, out int remaining, out int resetSeconds)
    {
        if (string.IsNullOrWhiteSpace(keyId) || maxRequestsPerMinute <= 0)
        {
            remaining = 0;
            resetSeconds = 60;
            return true;
        }

        var nowEpochSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var bucket = _buckets.GetOrAdd(keyId, _ => new RateBucket
        {
            Count = 0,
            WindowStartEpochSeconds = nowEpochSeconds
        });

        lock (bucket)
        {
            var elapsed = nowEpochSeconds - bucket.WindowStartEpochSeconds;
            if (elapsed >= 60)
            {
                bucket.Count = 0;
                bucket.WindowStartEpochSeconds = nowEpochSeconds;
                elapsed = 0;
            }

            resetSeconds = (int)Math.Max(1, 60 - elapsed);

            if (bucket.Count >= maxRequestsPerMinute)
            {
                remaining = 0;
                return false;
            }

            bucket.Count++;
            remaining = Math.Max(0, maxRequestsPerMinute - bucket.Count);
            return true;
        }
    }
}

