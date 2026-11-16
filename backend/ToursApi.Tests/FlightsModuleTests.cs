using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using ToursApi.Models;
using Xunit;

namespace ToursApi.Tests;

public class FlightsModuleTests
{
    private readonly string _seedDir;

    public FlightsModuleTests()
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
    public void FlightModel_CreatesValidEntityWithAirportsAndMeals()
    {
        var flight = new Flight
        {
            FlightNumericId = 1001,
            FlightId = "fl_test_1001",
            WebsiteId = "gujjutours",
            Airline = "SkyWings Airlines",
            AirlineCode = "SW",
            FlightNumber = "SW-202",
            FromAirport = new FlightAirport
            {
                Code = "DEL",
                City = "Delhi",
                Name = "Indira Gandhi International Airport",
                Country = "India"
            },
            ToAirport = new FlightAirport
            {
                Code = "BOM",
                City = "Mumbai",
                Name = "Chhatrapati Shivaji Maharaj International",
                Country = "India"
            },
            DepartureTime = "06:15",
            ArrivalTime = "08:35",
            Duration = "2h 20m",
            DurationMinutes = 140,
            Stops = "Non-stop",
            StopsCount = 0,
            CabinClass = "Economy",
            Price = 4850,
            Currency = "INR",
            Refundable = true,
            Baggage = new FlightBaggage
            {
                Cabin = "7 kg",
                CheckIn = "15 kg"
            },
            Meals = new FlightMeals
            {
                Included = true,
                PureVegGuaranteed = true,
                JainMealAvailable = true,
                Description = "Hot Pure Veg Breakfast"
            },
            RouteSlug = "delhi-to-mumbai-flights-del-bom",
            Slug = "delhi-to-mumbai-flights-del-bom-sw-202",
            IsDomestic = true
        };

        Assert.Equal("SW-202", flight.FlightNumber);
        Assert.Equal("DEL", flight.FromAirport.Code);
        Assert.Equal("BOM", flight.ToAirport.Code);
        Assert.True(flight.Refundable);
        Assert.True(flight.Meals.PureVegGuaranteed);
        Assert.True(flight.IsDomestic);
        Assert.Equal(4850, flight.Price);
    }

    [Theory]
    [InlineData("gujjutours", "INR")]
    [InlineData("tripgoasia", "USD")]
    [InlineData("technoheaven", "AED")]
    public void SeedFlights_ContainsCompleteDeterministicCatalog(string siteId, string expectedCurrency)
    {
        var filePath = Path.Combine(_seedDir, siteId, "flights.json");
        Assert.True(File.Exists(filePath), $"Flights seed file missing at: {filePath}");

        var json = File.ReadAllText(filePath);
        var flights = JsonSerializer.Deserialize<List<Flight>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(flights);
        Assert.True(flights.Count >= 50, $"Expected >= 50 scheduled flights for {siteId}, found {flights.Count}");

        foreach (var f in flights)
        {
            Assert.False(string.IsNullOrWhiteSpace(f.Airline), "Flight airline must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(f.FlightNumber), "Flight number must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(f.FromAirport.Code), "Departure airport code must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(f.ToAirport.Code), "Arrival airport code must not be empty");
            Assert.True(f.Price > 0, "Flight price must be positive");
            Assert.Equal(expectedCurrency, f.Currency);
            Assert.False(string.IsNullOrWhiteSpace(f.DepartureTime), "Departure time must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(f.ArrivalTime), "Arrival time must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(f.Duration), "Duration must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(f.Slug), "Slug must not be empty");
        }
    }

    [Fact]
    public void GujjuTours_Flights_ContainPureVegAndJainMealOptions()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "flights.json");
        Assert.True(File.Exists(filePath), $"File missing: {filePath}");

        var json = File.ReadAllText(filePath);
        var flights = JsonSerializer.Deserialize<List<Flight>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(flights);
        var vegFlights = flights.Where(f => f.Meals != null && f.Meals.PureVegGuaranteed).ToList();
        var jainFlights = flights.Where(f => f.Meals != null && f.Meals.JainMealAvailable).ToList();

        Assert.True(vegFlights.Count >= 30, $"Expected >= 30 Pure Veg flights in GujjuTours, got {vegFlights.Count}");
        Assert.True(jainFlights.Count >= 30, $"Expected >= 30 Jain meal flights in GujjuTours, got {jainFlights.Count}");
    }

    [Theory]
    [InlineData("gujjutours")]
    [InlineData("tripgoasia")]
    [InlineData("technoheaven")]
    public void SeedFlights_HasBothDomesticAndInternationalRoutes(string siteId)
    {
        var filePath = Path.Combine(_seedDir, siteId, "flights.json");
        var json = File.ReadAllText(filePath);
        var flights = JsonSerializer.Deserialize<List<Flight>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(flights);
        var hasDomestic = flights.Any(f => f.IsDomestic);
        var hasInternational = flights.Any(f => !f.IsDomestic);

        Assert.True(hasDomestic, $"Expected {siteId} to have domestic/regional flights");
        Assert.True(hasInternational, $"Expected {siteId} to have international flights");
    }
}

