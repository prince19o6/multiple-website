using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace ToursApi.Models;

public class FeatureIconContract
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = "";

    [JsonPropertyName("fallbackKey")]
    public string FallbackKey { get; set; } = "Sparkles";
}

public class FeatureItemContract
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "service"; // service | module | page

    [JsonPropertyName("label")]
    public Dictionary<string, string> Label { get; set; } = new();

    [JsonPropertyName("icon")]
    public FeatureIconContract Icon { get; set; } = new();

    [JsonPropertyName("route")]
    public string Route { get; set; } = "";

    [JsonPropertyName("order")]
    public int Order { get; set; } = 0;

    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("platforms")]
    public List<string> Platforms { get; set; } = new() { "web", "app" };

    [JsonPropertyName("visibleInNav")]
    public bool VisibleInNav { get; set; } = true;

    [JsonPropertyName("visibleOnHome")]
    public bool VisibleOnHome { get; set; } = true;

    [JsonPropertyName("searchType")]
    public string SearchType { get; set; } = "none"; // tour | hotel | flight | transfer | car | holiday | none

    [JsonPropertyName("dependsOn")]
    public List<string> DependsOn { get; set; } = new();

    [JsonPropertyName("requiresAuth")]
    public bool RequiresAuth { get; set; } = false;

    [JsonPropertyName("roles")]
    public List<string> Roles { get; set; } = new() { "Public" };

    [JsonPropertyName("badge")]
    public string? Badge { get; set; }

    [JsonPropertyName("provider")]
    public string Provider { get; set; } = "local_backend"; // remote_api | local_backend
}

public static class FeatureDependencyResolver
{
    /// <summary>
    /// Cascades disabled state across dependent features.
    /// If parent feature is disabled, any feature declaring it in DependsOn is disabled.
    /// </summary>
    public static List<FeatureItemContract> Resolve(IEnumerable<FeatureItemContract> items)
    {
        var list = items.Select(i => new FeatureItemContract
        {
            Id = i.Id,
            Type = i.Type,
            Label = new Dictionary<string, string>(i.Label),
            Icon = new FeatureIconContract { Url = i.Icon?.Url ?? "", FallbackKey = i.Icon?.FallbackKey ?? "Sparkles" },
            Route = i.Route,
            Order = i.Order,
            Enabled = i.Enabled,
            Platforms = new List<string>(i.Platforms),
            VisibleInNav = i.VisibleInNav,
            VisibleOnHome = i.VisibleOnHome,
            SearchType = i.SearchType,
            DependsOn = new List<string>(i.DependsOn),
            RequiresAuth = i.RequiresAuth,
            Roles = new List<string>(i.Roles),
            Badge = i.Badge,
            Provider = i.Provider
        }).ToList();

        var map = list.ToDictionary(x => x.Id, StringComparer.OrdinalIgnoreCase);

        bool changed = true;
        int iterations = 0;
        int maxIterations = list.Count + 1;

        while (changed && iterations < maxIterations)
        {
            changed = false;
            iterations++;

            foreach (var item in list)
            {
                if (!item.Enabled) continue;

                if (item.DependsOn != null && item.DependsOn.Count > 0)
                {
                    foreach (var depId in item.DependsOn)
                    {
                        if (!map.TryGetValue(depId, out var parent) || !parent.Enabled)
                        {
                            item.Enabled = false;
                            changed = true;
                            break;
                        }
                    }
                }
            }
        }

        return list.OrderBy(x => x.Order).ToList();
    }

    public static bool IsFeatureEnabled(IEnumerable<FeatureItemContract> items, string featureId, string platform = "web")
    {
        if (items == null || string.IsNullOrWhiteSpace(featureId)) return false;
        var resolved = Resolve(items);
        var item = resolved.FirstOrDefault(x => x.Id.Equals(featureId, StringComparison.OrdinalIgnoreCase));
        if (item == null || !item.Enabled) return false;
        if (!string.IsNullOrEmpty(platform) && !item.Platforms.Contains(platform, StringComparer.OrdinalIgnoreCase)) return false;
        return true;
    }
}

