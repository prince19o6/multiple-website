using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using ToursApi.Models;
using Xunit;

namespace ToursApi.Tests;

public class BuildPackageModuleTests
{
    private readonly string _seedDir;

    public BuildPackageModuleTests()
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
    public void BuildPackageModel_CreatesValidEntityWithAllComponents()
    {
        var option = new BuildPackageOption
        {
            DestinationNumericId = 1001,
            DestinationId = "bpo_gujjutours_1001",
            WebsiteId = "gujjutours",
            DestinationSlug = "dubai-emirates-builder",
            DestinationName = "Dubai & Abu Dhabi",
            Country = "United Arab Emirates",
            Flag = "🇦🇪",
            Tagline = "Futuristic Skylines & Golden Dunes",
            Badge = "Bestseller",
            StartingPrice = 42000,
            Currency = "INR",
            CurrencySymbol = "₹",
            Rating = 4.8,
            Reviews = 350,
            Durations = new List<BuildPackageDuration>
            {
                new() { Id = "3n-4d", Nights = 3, Days = 4, Label = "3 Nights / 4 Days", PriceMultiplier = 1.0 },
                new() { Id = "4n-5d", Nights = 4, Days = 5, Label = "4 Nights / 5 Days", PriceMultiplier = 1.25 }
            },
            FlightOptions = new List<BuildPackageFlight>
            {
                new() { Id = "flight-economy", Name = "Economy Flights", PricePerPerson = 32000, Type = "Economy" }
            },
            HotelTiers = new List<BuildPackageHotel>
            {
                new() { Id = "hotel-4star", TierName = "4-Star Premium", StarRating = 4, PricePerPerson = 18000 }
            },
            ActivityOptions = new List<BuildPackageActivity>
            {
                new() { Id = "act-1", Name = "Burj Khalifa Tour", Duration = "2 Hours", PricePerPerson = 3800, IsRecommended = true }
            },
            TransferOptions = new List<BuildPackageTransfer>
            {
                new() { Id = "tr-1", Name = "Private Sedan", VehicleClass = "Sedan", PriceTotal = 5500 }
            },
            VisaOptions = new List<BuildPackageVisa>
            {
                new() { Id = "visa-1", Name = "UAE eVisa", PricePerPerson = 6800, IsRequired = true }
            },
            MealPlans = new List<BuildPackageMealPlan>
            {
                new() { Id = "breakfast-only", Name = "Breakfast Included", PricePerPerson = 0 }
            }
        };

        Assert.Equal("dubai-emirates-builder", option.DestinationSlug);
        Assert.Equal("United Arab Emirates", option.Country);
        Assert.Equal(42000, option.StartingPrice);
        Assert.Equal("₹", option.CurrencySymbol);
        Assert.Equal(2, option.Durations.Count);
        Assert.Single(option.FlightOptions);
        Assert.Single(option.HotelTiers);
        Assert.Single(option.ActivityOptions);
        Assert.Single(option.TransferOptions);
        Assert.Single(option.VisaOptions);
        Assert.Single(option.MealPlans);
    }

    [Theory]
    [InlineData("gujjutours", "INR")]
    [InlineData("tripgoasia", "USD")]
    [InlineData("technoheaven", "AED")]
    public void SeedBuildPackage_ContainsAtLeast10DestinationsPerSite(string siteId, string expectedCurrency)
    {
        var filePath = Path.Combine(_seedDir, siteId, "build-package-options.json");
        Assert.True(File.Exists(filePath), $"Build package seed file missing at: {filePath}");

        var json = File.ReadAllText(filePath);
        var options = JsonSerializer.Deserialize<List<BuildPackageOption>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(options);
        Assert.True(options.Count >= 10, $"Expected >= 10 destination options for {siteId}, found {options.Count}");

        foreach (var opt in options)
        {
            Assert.False(string.IsNullOrWhiteSpace(opt.DestinationName), "Destination name must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(opt.DestinationSlug), "Destination slug must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(opt.Country), "Destination country must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(opt.Flag), "Destination flag must not be empty");
            Assert.Equal(expectedCurrency, opt.Currency);
            Assert.True(opt.StartingPrice > 0, $"Starting price must be positive for {opt.DestinationSlug}");
            Assert.True(opt.DestinationNumericId >= 1000, "Destination numeric ID must be >= 1000");
            Assert.True(opt.Rating >= 4.0 && opt.Rating <= 5.0, $"Rating must be between 4.0 and 5.0, got {opt.Rating}");
            Assert.True(opt.Images.Count >= 1, "Must have at least one image");
        }
    }

    [Theory]
    [InlineData("gujjutours")]
    [InlineData("tripgoasia")]
    [InlineData("technoheaven")]
    public void SeedBuildPackage_HasCuratedDurationsAndComponents(string siteId)
    {
        var filePath = Path.Combine(_seedDir, siteId, "build-package-options.json");
        var json = File.ReadAllText(filePath);
        var options = JsonSerializer.Deserialize<List<BuildPackageOption>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(options);

        foreach (var opt in options)
        {
            // At least 4 durations (3N/4D, 4N/5D, 5N/6D, 6N/7D)
            Assert.True(opt.Durations.Count >= 4, $"Destination {opt.DestinationSlug} should have >= 4 duration options");

            // At least 3 flight choices (Economy, Business, None)
            Assert.True(opt.FlightOptions.Count >= 3, $"Destination {opt.DestinationSlug} should have >= 3 flight options");

            // At least 3 hotel tiers (3-Star, 4-Star, 5-Star)
            Assert.True(opt.HotelTiers.Count >= 3, $"Destination {opt.DestinationSlug} should have >= 3 hotel tiers");

            // At least 5 activity choices
            Assert.True(opt.ActivityOptions.Count >= 5, $"Destination {opt.DestinationSlug} should have >= 5 activities");

            // At least 2 transfer choices (including None / Self Arranged)
            Assert.True(opt.TransferOptions.Count >= 2, $"Destination {opt.DestinationSlug} should have >= 2 transfer choices");

            // At least 2 visa choices
            Assert.True(opt.VisaOptions.Count >= 2, $"Destination {opt.DestinationSlug} should have >= 2 visa choices");

            // At least 3 meal plans
            Assert.True(opt.MealPlans.Count >= 3, $"Destination {opt.DestinationSlug} should have >= 3 meal plans");
        }
    }

    [Fact]
    public void SeedBuildPackage_TechnoheavenHasB2BNetPricing()
    {
        var filePath = Path.Combine(_seedDir, "technoheaven", "build-package-options.json");
        var json = File.ReadAllText(filePath);
        var options = JsonSerializer.Deserialize<List<BuildPackageOption>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(options);
        foreach (var opt in options)
        {
            Assert.NotNull(opt.NetStartingPrice);
            Assert.True(opt.NetStartingPrice > 0, "Net starting price must be greater than 0");
            Assert.True(opt.NetStartingPrice < opt.StartingPrice, "Net price must be lower than gross starting price");

            var hotel = opt.HotelTiers.First();
            Assert.NotNull(hotel.NetPricePerPerson);
            Assert.True(hotel.NetPricePerPerson > 0);
        }
    }

    [Fact]
    public void SeedCategories_ContainsBuildPackageCategory()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "categories.json");
        var json = File.ReadAllText(filePath);
        var categories = JsonSerializer.Deserialize<List<Category>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(categories);
        var bpCat = categories.FirstOrDefault(c => c.Module == "buildpackage" && c.Slug == "custom-package-builder");
        Assert.NotNull(bpCat);
        Assert.True(bpCat.Enabled);
    }
}

