using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using ToursApi.Models;
using Xunit;

namespace ToursApi.Tests;

public class ActivitiesModuleTests
{
    private readonly string _seedDir;

    public ActivitiesModuleTests()
    {
        var baseDir = AppContext.BaseDirectory;
        var dir = Path.Combine(baseDir, "seed");
        if (!Directory.Exists(dir))
        {
            dir = Path.Combine(Directory.GetCurrentDirectory(), "seed");
        }
        if (!Directory.Exists(dir))
        {
            dir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../seed"));
        }
        _seedDir = dir;
    }

    [Fact]
    public void TourModel_CreatesValidEntityWithHighlightsAndPackageOptions()
    {
        var tour = new Tour
        {
            Id = "act_test_101",
            TourNumericId = 101,
            Name = "Dubai Premium Desert Safari",
            Title = "Dubai Premium Desert Safari",
            Slug = "dubai-desert-safari-101",
            Category = "Desert Safari",
            Destination = "Dubai",
            Location = "Lahbab Red Dunes, Dubai",
            Country = "United Arab Emirates",
            Price = 2450,
            Currency = "INR",
            Duration = "6 Hours",
            Rating = 4.9,
            Reviews = 412,
            Highlights = new List<string>
            {
                "4x4 Dune Bashing in Lahbab Red Dunes",
                "Buffet BBQ dinner with Pure Veg & Jain food options",
                "Live Tanoura & Belly dance performances"
            },
            Included = new List<string>
            {
                "Hotel pickup and drop-off in 4x4 Land Cruiser",
                "Dinner buffet with refreshments"
            },
            Featured = true,
            Popular = true
        };

        Assert.Equal("act_test_101", tour.Id);
        Assert.Equal("Dubai Premium Desert Safari", tour.Title);
        Assert.Equal("Desert Safari", tour.Category);
        Assert.Equal(2450, tour.Price);
        Assert.Equal("INR", tour.Currency);
        Assert.Equal(3, tour.Highlights.Count);
        Assert.True(tour.Featured);
    }

    [Theory]
    [InlineData("gujjutours", "INR")]
    [InlineData("tripgoasia", "USD")]
    [InlineData("technoheaven", "AED")]
    public void SeedActivities_ContainsCompleteDeterministicCatalog(string siteId, string expectedCurrency)
    {
        var filePath = Path.Combine(_seedDir, siteId, "activities.json");
        Assert.True(File.Exists(filePath), $"Activities seed file not found at: {filePath}");

        var json = File.ReadAllText(filePath);
        var activities = JsonSerializer.Deserialize<List<Tour>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(activities);
        Assert.True(activities.Count >= 50, $"Expected at least 50 activities for {siteId}, found {activities.Count}");

        foreach (var act in activities)
        {
            Assert.False(string.IsNullOrWhiteSpace(act.Name ?? act.Title), "Activity name must not be blank");
            Assert.False(string.IsNullOrWhiteSpace(act.Slug), "Activity slug must not be blank");
            Assert.False(string.IsNullOrWhiteSpace(act.Category), "Activity category must not be blank");
            Assert.False(string.IsNullOrWhiteSpace(act.Destination), "Activity destination must not be blank");
            Assert.True(act.Price > 0, $"Activity price must be positive, found: {act.Price}");
            Assert.Equal(expectedCurrency, act.Currency);
            Assert.True(act.Rating >= 3.5 && act.Rating <= 5.0, $"Rating must be between 3.5 and 5.0, found: {act.Rating}");
        }
    }

    [Fact]
    public void SeedActivities_TaxonomyCoversAllEightRequiredCategories()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "activities.json");
        Assert.True(File.Exists(filePath), $"File missing: {filePath}");

        var json = File.ReadAllText(filePath);
        var activities = JsonSerializer.Deserialize<List<Tour>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(activities);
        var categories = activities.Select(a => a.Category.ToLowerInvariant()).Distinct().ToList();

        var requiredKeywords = new[]
        {
            "safari",
            "water",
            "city",
            "theme",
            "boat",
            "walking",
            "wildlife",
            "cultur"
        };

        foreach (var keyword in requiredKeywords)
        {
            Assert.Contains(categories, c => c.Contains(keyword));
        }
    }

    [Fact]
    public void GujjuTours_Activities_IncludePureVegAndJainDining()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "activities.json");
        var json = File.ReadAllText(filePath);

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        int pureVegCount = 0;
        int jainAvailableCount = 0;

        foreach (var item in root.EnumerateArray())
        {
            if (item.TryGetProperty("dietaryFeatures", out var dietary))
            {
                if (dietary.TryGetProperty("pureVeg", out var pv) && pv.GetBoolean())
                {
                    pureVegCount++;
                }
                if (dietary.TryGetProperty("jainAvailable", out var jain) && jain.GetBoolean())
                {
                    jainAvailableCount++;
                }
            }
        }

        Assert.True(pureVegCount > 10, $"Expected >10 pure veg activities in GujjuTours, got {pureVegCount}");
        Assert.True(jainAvailableCount > 10, $"Expected >10 Jain-friendly activities in GujjuTours, got {jainAvailableCount}");
    }

    [Fact]
    public void SeedActivities_ContainsPackageOptionsWithUpgrades()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "activities.json");
        var json = File.ReadAllText(filePath);

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var first = root.EnumerateArray().First();
        Assert.True(first.TryGetProperty("packageOptions", out var options));
        Assert.True(options.GetArrayLength() >= 2, "Each activity must provide at least 2 package option tiers");

        var optionTitles = options.EnumerateArray()
            .Select(o => o.GetProperty("title").GetString())
            .ToList();

        Assert.Contains(optionTitles, t => t != null && t.Contains("Admission"));
    }
}
