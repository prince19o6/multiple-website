using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using ToursApi.Models;
using Xunit;

namespace ToursApi.Tests;

public class PackagesModuleTests
{
    private readonly string _seedDir;

    public PackagesModuleTests()
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
    public void PackageModel_CreatesValidEntityWithHotelStaysAndItinerary()
    {
        var package = new Package
        {
            Id = "pkg_sample_101",
            PackageNumericId = 101,
            Title = "Dubai Extravaganza with Desert Safari",
            Slug = "dubai-extravaganza-5n-101",
            Category = "Dubai Holiday Packages",
            CategorySlug = "dubai-packages",
            Destination = "Dubai",
            CitiesCovered = "Dubai (3N) + Abu Dhabi (2N)",
            Duration = "6 Days / 5 Nights",
            DurationDays = 6,
            DurationNights = 5,
            StartingPrice = 42500,
            Price = 42500,
            Currency = "INR",
            Rating = 4.9,
            Reviews = 312,
            DietaryFeatures = new PackageDietaryFeatures
            {
                PureVeg = true,
                JainAvailable = true,
                HalalCertified = true
            },
            KeyInclusions = new List<string> { "4★ Hotel", "Daily Breakfast & Dinner", "Desert Safari", "Burj Khalifa" },
            HotelStays = new List<PackageHotelStay>
            {
                new PackageHotelStay { HotelName = "Grand Marina Resort", StarRating = 4, Nights = 3, City = "Dubai" },
                new PackageHotelStay { HotelName = "Corniche Palace", StarRating = 5, Nights = 2, City = "Abu Dhabi" }
            },
            Itinerary = new List<PackageItineraryDay>
            {
                new PackageItineraryDay { Day = 1, Title = "Arrival & Welcome Transfer", Meals = new List<string> { "Dinner" } }
            },
            Featured = true,
            Popular = true
        };

        Assert.Equal("pkg_sample_101", package.Id);
        Assert.Equal("Dubai Extravaganza with Desert Safari", package.Title);
        Assert.Equal("Dubai Holiday Packages", package.Category);
        Assert.Equal(42500, package.StartingPrice);
        Assert.Equal("INR", package.Currency);
        Assert.True(package.DietaryFeatures.PureVeg);
        Assert.True(package.DietaryFeatures.JainAvailable);
        Assert.Equal(2, package.HotelStays.Count);
        Assert.Single(package.Itinerary);
    }

    [Theory]
    [InlineData("gujjutours", "INR")]
    [InlineData("tripgoasia", "USD")]
    [InlineData("technoheaven", "AED")]
    public void SeedPackages_ContainsCompleteDeterministicCatalog(string siteId, string expectedCurrency)
    {
        var filePath = Path.Combine(_seedDir, siteId, "packages.json");
        Assert.True(File.Exists(filePath), $"Packages seed file not found at: {filePath}");

        var json = File.ReadAllText(filePath);
        var packages = JsonSerializer.Deserialize<List<Package>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(packages);
        Assert.True(packages.Count >= 50, $"Expected at least 50 packages for {siteId}, found {packages.Count}");

        foreach (var pkg in packages)
        {
            Assert.False(string.IsNullOrWhiteSpace(pkg.Title ?? pkg.Name), "Package title must not be blank");
            Assert.False(string.IsNullOrWhiteSpace(pkg.Slug), "Package slug must not be blank");
            Assert.False(string.IsNullOrWhiteSpace(pkg.Category), "Package category must not be blank");
            Assert.False(string.IsNullOrWhiteSpace(pkg.Destination), "Package destination must not be blank");
            Assert.True(pkg.StartingPrice > 0, $"Package price must be positive, found: {pkg.StartingPrice}");
            Assert.Equal(expectedCurrency, pkg.Currency);
            Assert.True(pkg.Rating >= 4.0 && pkg.Rating <= 5.0, $"Rating must be between 4.0 and 5.0, found: {pkg.Rating}");
            Assert.True(pkg.DurationDays >= 3, $"DurationDays must be >= 3, found: {pkg.DurationDays}");
            Assert.True(pkg.DurationNights >= 2, $"DurationNights must be >= 2, found: {pkg.DurationNights}");
            Assert.True(pkg.Itinerary.Count >= 3, "Package must have at least 3 itinerary days");
        }
    }

    [Fact]
    public void SeedPackages_TaxonomyCoversAllEightRequiredThemes()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "packages.json");
        Assert.True(File.Exists(filePath), $"File missing: {filePath}");

        var json = File.ReadAllText(filePath);
        var packages = JsonSerializer.Deserialize<List<Package>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(packages);
        var categories = packages.Select(p => p.CategorySlug.ToLowerInvariant()).Distinct().ToList();

        var requiredCategorySlugs = new[]
        {
            "scenic-escapes",
            "spiritual-escapes",
            "visa-free-escapes",
            "honeymoon-getaways",
            "dubai-packages",
            "jain-packages",
            "international-packages",
            "domestic-holidays"
        };

        foreach (var slug in requiredCategorySlugs)
        {
            Assert.Contains(slug, categories);
        }
    }

    [Fact]
    public void GujjuTours_Packages_IncludePureVegAndJainFoodAccommodations()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "packages.json");
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

        Assert.True(pureVegCount > 10, $"Expected >10 pure veg packages in GujjuTours, got {pureVegCount}");
        Assert.True(jainAvailableCount > 10, $"Expected >10 Jain-friendly packages in GujjuTours, got {jainAvailableCount}");
    }
}

