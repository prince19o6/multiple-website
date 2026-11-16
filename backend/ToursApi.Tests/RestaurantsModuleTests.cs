using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using ToursApi.Models;
using Xunit;

namespace ToursApi.Tests;

public class RestaurantsModuleTests
{
    private readonly string _seedDir;

    public RestaurantsModuleTests()
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
    public void RestaurantModel_CreatesValidEntityWithDietaryAndTimings()
    {
        var restaurant = new Restaurant
        {
            RestaurantNumericId = 1001,
            RestaurantId = "res_test_1001",
            WebsiteId = "gujjutours",
            Title = "Kathiawad Rasoi Grand Heritage Thali",
            Name = "Kathiawad Rasoi Grand Heritage Thali",
            Slug = "kathiawad-rasoi-grand-heritage-thali-ahmedabad-1001",
            Cuisine = "gujarati-thali",
            CuisineLabel = "Gujarati Thali",
            City = "Ahmedabad",
            Country = "India",
            Address = "12, Heritage Food Boulevard, Ahmedabad",
            PriceRange = "$$",
            CostForTwo = 850,
            Currency = "INR",
            Rating = 4.8,
            Reviews = 420,
            IsNew = true,
            Featured = true,
            Popular = true,
            IsPureVeg = true,
            IsJainAvailable = true,
            DietaryTags = new List<string> { "100% Pure Vegetarian", "Jain Options Available" },
            Timings = "11:30 AM - 03:30 PM, 07:00 PM - 11:30 PM",
            Specialties = new List<string> { "Undhiyu & Puri", "Khaman Dhokla", "Shrikhand" }
        };

        Assert.Equal("gujarati-thali", restaurant.Cuisine);
        Assert.Equal("Ahmedabad", restaurant.City);
        Assert.True(restaurant.IsPureVeg);
        Assert.True(restaurant.IsJainAvailable);
        Assert.True(restaurant.IsNew);
        Assert.Equal(850, restaurant.CostForTwo);
        Assert.Equal(3, restaurant.Specialties.Count);
    }

    [Theory]
    [InlineData("gujjutours", "INR")]
    [InlineData("tripgoasia", "USD")]
    [InlineData("technoheaven", "AED")]
    public void SeedRestaurants_ContainsCompleteDeterministicCatalog(string siteId, string expectedCurrency)
    {
        var filePath = Path.Combine(_seedDir, siteId, "restaurants.json");
        Assert.True(File.Exists(filePath), $"Restaurants seed file missing at: {filePath}");

        var json = File.ReadAllText(filePath);
        var restaurants = JsonSerializer.Deserialize<List<Restaurant>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(restaurants);
        Assert.True(restaurants.Count >= 90, $"Expected >= 90 restaurants for {siteId}, found {restaurants.Count}");

        foreach (var r in restaurants)
        {
            Assert.False(string.IsNullOrWhiteSpace(r.Title), "Restaurant title must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(r.Slug), "Restaurant slug must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(r.Cuisine), "Restaurant cuisine must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(r.City), "Restaurant city must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(r.Address), "Restaurant address must not be empty");
            Assert.Equal(expectedCurrency, r.Currency);
            Assert.True(r.CostForTwo > 0, $"Cost for two must be positive for {r.Slug}");
            Assert.True(r.RestaurantNumericId >= 1000, "Restaurant numeric ID must be >= 1000");
            Assert.True(r.Rating >= 3.8 && r.Rating <= 5.0, $"Rating must be between 3.8 and 5.0, got {r.Rating}");
            Assert.True(r.Specialties.Count >= 2, "Must have at least 2 specialties");
        }
    }

    [Fact]
    public void SeedRestaurants_HasAllNineCuisinesWithAtLeastTenEach()
    {
        var requiredCuisines = new[]
        {
            "indian",
            "gujarati-thali",
            "jain",
            "vegetarian",
            "asian",
            "seafood",
            "fine-dining",
            "cafe",
            "street-food"
        };

        foreach (var siteId in new[] { "gujjutours", "tripgoasia", "technoheaven" })
        {
            var filePath = Path.Combine(_seedDir, siteId, "restaurants.json");
            var json = File.ReadAllText(filePath);
            var restaurants = JsonSerializer.Deserialize<List<Restaurant>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            Assert.NotNull(restaurants);
            foreach (var cuisine in requiredCuisines)
            {
                var count = restaurants.Count(r => r.Cuisine.Equals(cuisine, StringComparison.OrdinalIgnoreCase));
                Assert.True(count >= 10, $"Site {siteId} must have >= 10 items for cuisine '{cuisine}', found {count}");
            }
        }
    }

    [Fact]
    public void SeedRestaurants_HasDietaryOptionsRepresented()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "restaurants.json");
        var json = File.ReadAllText(filePath);
        var restaurants = JsonSerializer.Deserialize<List<Restaurant>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(restaurants);
        Assert.True(restaurants.Any(r => r.IsPureVeg), "Must have Pure Veg restaurants");
        Assert.True(restaurants.Any(r => r.IsJainAvailable), "Must have Jain available restaurants");
        Assert.True(restaurants.Any(r => r.IsNew), "Must have New restaurants");
    }

    [Fact]
    public void SeedRestaurants_ImagePointersUseDeterministicLocalSvgs()
    {
        foreach (var site in new[] { "gujjutours", "tripgoasia", "technoheaven" })
        {
            var filePath = Path.Combine(_seedDir, site, "restaurants.json");
            var json = File.ReadAllText(filePath);
            var restaurants = JsonSerializer.Deserialize<List<Restaurant>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            Assert.NotNull(restaurants);
            foreach (var r in restaurants)
            {
                Assert.StartsWith("/seed-images/restaurants/", r.Image);
                Assert.EndsWith(".svg", r.Image);
                Assert.DoesNotContain("http://", r.Image);
                Assert.DoesNotContain("https://", r.Image);
            }
        }
    }

    [Fact]
    public void SeedRestaurants_UniqueSlugsAndNumericIds()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "restaurants.json");
        var json = File.ReadAllText(filePath);
        var restaurants = JsonSerializer.Deserialize<List<Restaurant>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(restaurants);
        var slugs = restaurants.Select(r => r.Slug).ToList();
        var numIds = restaurants.Select(r => r.RestaurantNumericId).ToList();

        Assert.Equal(slugs.Count, slugs.Distinct().Count());
        Assert.Equal(numIds.Count, numIds.Distinct().Count());
    }
}

