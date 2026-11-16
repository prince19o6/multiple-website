using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using ToursApi.Models;
using Xunit;

namespace ToursApi.Tests;

public class HotelsModuleTests
{
    private readonly string _seedDir;

    public HotelsModuleTests()
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
    public void HotelModel_CreatesValidHotelEntityWithRoomOptions()
    {
        var hotel = new Hotel
        {
            Id = "hotel_sample_01",
            Slug = "grand-heritage-resort",
            Title = "Grand Heritage Resort & Spa",
            Destination = new HotelDestination
            {
                CityName = "Jaipur",
                Country = "India",
                Address = "Amer Road, Jaipur"
            },
            StarRating = 5,
            PropertyType = "Resort",
            PricePerNight = 8500,
            Currency = "INR",
            DietaryFeatures = new HotelDietaryFeatures
            {
                PureVeg = true,
                JainAvailable = true,
                HalalCertified = false
            },
            IsDemo = true,
            Collections = new List<string> { "luxury-stays", "heritage-palaces", "family-friendly" },
            Rooms = new List<HotelRoomOption>
            {
                new HotelRoomOption
                {
                    Id = "room_dlx_01",
                    Name = "Deluxe Heritage King",
                    PricePerNight = 8500,
                    FreeBreakfast = true,
                    MaxAdults = 2,
                    MaxChildren = 1,
                    CancellationPolicy = "Free cancellation up to 48 hours before check-in"
                }
            }
        };

        Assert.Equal("hotel_sample_01", hotel.Id);
        Assert.Equal("Grand Heritage Resort & Spa", hotel.Title);
        Assert.Equal("Jaipur", hotel.Destination.CityName);
        Assert.Equal(5, hotel.StarRating);
        Assert.True(hotel.DietaryFeatures.PureVeg);
        Assert.True(hotel.DietaryFeatures.JainAvailable);
        Assert.Single(hotel.Rooms);
        Assert.Equal("Deluxe Heritage King", hotel.Rooms[0].Name);
        Assert.True(hotel.Rooms[0].FreeBreakfast);
    }

    [Fact]
    public void CategoryModel_CreatesValidTaxonomyItem()
    {
        var category = new Category
        {
            Id = "cat_resort",
            Module = "hotels",
            Slug = "resorts",
            Name = new Dictionary<string, string> { ["en"] = "Resorts & Villas", ["ar"] = "منتجعات وفلل" },
            Order = 1,
            Enabled = true
        };

        Assert.Equal("hotels", category.Module);
        Assert.Equal("resorts", category.Slug);
        Assert.Equal("Resorts & Villas", category.Name["en"]);
        Assert.True(category.Enabled);
    }

    [Fact]
    public void BookingItemSnapshot_StoresHotelReservationPayload()
    {
        var snapshot = new BookingItemSnapshot
        {
            ServiceType = "hotel",
            ServiceId = "hotel_sample_01",
            Title = "Grand Heritage Resort & Spa",
            Destination = "Jaipur",
            StartDate = "2026-11-15",
            EndDate = "2026-11-18",
            RoomsCount = 1,
            Adults = 2,
            SelectionName = "Deluxe Heritage King",
            BasePrice = 8500,
            TotalAmount = 25500,
            Currency = "INR"
        };

        Assert.Equal("hotel", snapshot.ServiceType);
        Assert.Equal(25500, snapshot.TotalAmount);
        Assert.Equal("INR", snapshot.Currency);
        Assert.Equal("Deluxe Heritage King", snapshot.SelectionName);
    }

    [Theory]
    [InlineData("gujjutours", "INR")]
    [InlineData("tripgoasia", "USD")]
    [InlineData("technoheaven", "AED")]
    public void SeedData_CategoriesAndHotelsExistAndAreValid(string siteId, string expectedCurrency)
    {
        var siteDir = Path.Combine(_seedDir, siteId);
        if (!Directory.Exists(siteDir))
        {
            siteDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, $"../../../../seed/{siteId}"));
        }

        Assert.True(Directory.Exists(siteDir), $"Seed folder for {siteId} must exist at {siteDir}");

        // Validate categories.json
        var catFile = Path.Combine(siteDir, "categories.json");
        Assert.True(File.Exists(catFile), $"categories.json for {siteId} must exist");
        var catJson = File.ReadAllText(catFile);
        var categories = JsonSerializer.Deserialize<List<Category>>(catJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(categories);
        Assert.True(categories!.Count >= 10, $"Expected >= 10 categories, found {categories.Count}");

        // Validate hotels.json
        var hotelFile = Path.Combine(siteDir, "hotels.json");
        Assert.True(File.Exists(hotelFile), $"hotels.json for {siteId} must exist");
        var hotelJson = File.ReadAllText(hotelFile);
        var hotels = JsonSerializer.Deserialize<List<Hotel>>(hotelJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(hotels);
        Assert.True(hotels!.Count >= 50, $"Expected >= 50 hotels per site, found {hotels.Count}");

        // Validate currency and basic attributes
        foreach (var h in hotels)
        {
            Assert.False(string.IsNullOrWhiteSpace(h.Slug));
            Assert.False(string.IsNullOrWhiteSpace(h.Title));
            Assert.NotNull(h.Destination);
            Assert.False(string.IsNullOrWhiteSpace(h.Destination.CityName));
            Assert.Equal(expectedCurrency, h.Currency);
            Assert.True(h.PricePerNight > 0, "Hotel pricePerNight must be positive");
            Assert.True(h.StarRating >= 3 && h.StarRating <= 5, "Star rating between 3 and 5");
            Assert.NotEmpty(h.Rooms);
            Assert.NotEmpty(h.Collections);
        }

        // Gujju Tours specific dietary check
        if (siteId == "gujjutours")
        {
            var pureVegCount = hotels.Count(h => h.DietaryFeatures != null && h.DietaryFeatures.PureVeg);
            Assert.True(pureVegCount > 10, "Gujju Tours must have Pure Veg hotels represented in seed data");
        }
    }
}
