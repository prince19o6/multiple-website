using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using ToursApi.Models;
using Xunit;

namespace ToursApi.Tests;

public class FeatureRegistryTests
{
    private readonly string _seedDir;

    public FeatureRegistryTests()
    {
        var baseDir = AppContext.BaseDirectory;
        var dir = Path.Combine(baseDir, "seed");
        if (!Directory.Exists(dir))
        {
            dir = Path.Combine(Directory.GetCurrentDirectory(), "seed");
        }
        if (!Directory.Exists(dir))
        {
            dir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../toursApi/seed"));
        }
        _seedDir = dir;
    }

    private List<FeatureItemContract> LoadSeedFeatures(string siteId)
    {
        var path = Path.Combine(_seedDir, $"{siteId}.siteConfig.json");
        Assert.True(File.Exists(path), $"Seed file for {siteId} must exist at {path}");
        var json = File.ReadAllText(path);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        Assert.True(root.TryGetProperty("featureRegistry", out var featuresProp), "Seed must contain featureRegistry");
        var list = JsonSerializer.Deserialize<List<FeatureItemContract>>(featuresProp.GetRawText());
        Assert.NotNull(list);
        return list!;
    }

    [Fact]
    public void FeatureRegistry_GujjuTours_HasAllLiveServicesAndNoCarRental()
    {
        var features = LoadSeedFeatures("gujjutours");

        // Gujju Tours live services
        var enabledServiceIds = features
            .Where(f => f.Type == "service" && f.Enabled)
            .Select(f => f.Id)
            .ToList();

        Assert.Contains("hotels", enabledServiceIds);
        Assert.Contains("packages", enabledServiceIds);
        Assert.Contains("activities", enabledServiceIds);
        Assert.Contains("flights", enabledServiceIds);
        Assert.Contains("transfers", enabledServiceIds);
        Assert.Contains("visas", enabledServiceIds);
        Assert.Contains("restaurants", enabledServiceIds);
        Assert.Contains("buildpackage", enabledServiceIds);

        // Car rental is NOT enabled on Gujju Tours
        Assert.DoesNotContain("car-rental", enabledServiceIds);
    }

    [Fact]
    public void FeatureRegistry_TripGoAsia_HasLiveServicesOnly()
    {
        var features = LoadSeedFeatures("tripgoasia");

        var enabledServiceIds = features
            .Where(f => f.Type == "service" && f.Enabled)
            .Select(f => f.Id)
            .ToList();

        // TripGo Asia live services
        Assert.Contains("attractions", enabledServiceIds);
        Assert.Contains("car-rental", enabledServiceIds);
        Assert.Contains("airport-transfer", enabledServiceIds);
        Assert.Contains("hotels", enabledServiceIds);
        Assert.Contains("holidays", enabledServiceIds);

        // Flights, Visas, and Restaurants must NOT be enabled
        Assert.DoesNotContain("flights", enabledServiceIds);
        Assert.DoesNotContain("visas", enabledServiceIds);
        Assert.DoesNotContain("restaurants", enabledServiceIds);
        Assert.DoesNotContain("buildpackage", enabledServiceIds);
    }

    [Fact]
    public void FeatureDependencyResolver_DisablingParent_CascadesToDependents()
    {
        var features = new List<FeatureItemContract>
        {
            new FeatureItemContract
            {
                Id = "bookings",
                Type = "module",
                Enabled = false, // Disabled root
                DependsOn = new List<string>()
            },
            new FeatureItemContract
            {
                Id = "my-bookings",
                Type = "module",
                Enabled = true, // Initially marked true
                DependsOn = new List<string> { "bookings" }
            },
            new FeatureItemContract
            {
                Id = "booking-approval",
                Type = "module",
                Enabled = true, // Initially marked true
                DependsOn = new List<string> { "bookings" }
            },
            new FeatureItemContract
            {
                Id = "wishlist",
                Type = "module",
                Enabled = true, // Independent
                DependsOn = new List<string>()
            }
        };

        var resolved = FeatureDependencyResolver.Resolve(features);

        var myBookings = resolved.First(f => f.Id == "my-bookings");
        var bookingApproval = resolved.First(f => f.Id == "booking-approval");
        var wishlist = resolved.First(f => f.Id == "wishlist");

        // Cascaded disable
        Assert.False(myBookings.Enabled, "Disabling 'bookings' must automatically cascade to 'my-bookings'");
        Assert.False(bookingApproval.Enabled, "Disabling 'bookings' must automatically cascade to 'booking-approval'");

        // Unrelated feature remains enabled
        Assert.True(wishlist.Enabled, "Independent feature must remain enabled");
    }

    [Theory]
    [InlineData("web", true)]
    [InlineData("app", true)]
    public void FeatureDependencyResolver_PlatformFiltering(string platform, bool expectedResult)
    {
        var features = new List<FeatureItemContract>
        {
            new FeatureItemContract
            {
                Id = "search",
                Type = "module",
                Enabled = true,
                Platforms = new List<string> { "web", "app" }
            },
            new FeatureItemContract
            {
                Id = "web-only-tool",
                Type = "module",
                Enabled = true,
                Platforms = new List<string> { "web" }
            }
        };

        var isSearchEnabled = FeatureDependencyResolver.IsFeatureEnabled(features, "search", platform);
        Assert.Equal(expectedResult, isSearchEnabled);

        var isWebOnlyEnabledInApp = FeatureDependencyResolver.IsFeatureEnabled(features, "web-only-tool", "app");
        Assert.False(isWebOnlyEnabledInApp, "web-only-tool should not be enabled on app");
    }
}

