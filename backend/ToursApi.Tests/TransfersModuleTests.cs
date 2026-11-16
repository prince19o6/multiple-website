using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using ToursApi.Models;
using Xunit;

namespace ToursApi.Tests;

public class TransfersModuleTests
{
    private readonly string _seedDir;

    public TransfersModuleTests()
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
    public void TransferModel_CreatesValidEntityWithVehiclesAndInclusions()
    {
        var transfer = new Transfer
        {
            TransferNumericId = 1001,
            TransferId = "tr_test_1001",
            WebsiteId = "gujjutours",
            Title = "Jaipur Airport (JAI) to City Hotels Private Sedan Transfer",
            Name = "Jaipur Airport (JAI) to City Hotels Private Sedan Transfer",
            Slug = "jaipur-airport-to-city-hotels-sedan-1001",
            TransferType = "airport",
            TransferTypeLabel = "Airport Transfer",
            VehicleType = "Sedan",
            VehicleLabel = "Comfort Executive Sedan",
            VehicleModel = "Toyota Etios or equivalent",
            MaxPassengers = 3,
            MaxLuggage = 2,
            AirConditioned = true,
            PickupLocation = "Jaipur Airport Arrivals Gate",
            DropoffLocation = "City Center Hotels",
            City = "Jaipur",
            Country = "India",
            DurationMinutes = 45,
            EstimatedDuration = "45 Mins",
            Price = 1250,
            Currency = "INR",
            FreeCancellation = true,
            MeetAndGreet = true,
            FlightMonitoring = true,
            TollIncluded = true,
            Rating = 4.8,
            Reviews = 195
        };

        Assert.Equal("airport", transfer.TransferType);
        Assert.Equal("Sedan", transfer.VehicleType);
        Assert.Equal(3, transfer.MaxPassengers);
        Assert.True(transfer.AirConditioned);
        Assert.True(transfer.FreeCancellation);
        Assert.True(transfer.MeetAndGreet);
        Assert.True(transfer.TollIncluded);
        Assert.Equal(1250, transfer.Price);
    }

    [Theory]
    [InlineData("gujjutours", "INR")]
    [InlineData("tripgoasia", "USD")]
    [InlineData("technoheaven", "AED")]
    public void SeedTransfers_ContainsCompleteDeterministicCatalog(string siteId, string expectedCurrency)
    {
        var filePath = Path.Combine(_seedDir, siteId, "transfers.json");
        Assert.True(File.Exists(filePath), $"Transfers seed file missing at: {filePath}");

        var json = File.ReadAllText(filePath);
        var transfers = JsonSerializer.Deserialize<List<Transfer>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(transfers);
        Assert.True(transfers.Count >= 50, $"Expected >= 50 vehicle transfers for {siteId}, found {transfers.Count}");

        foreach (var t in transfers)
        {
            Assert.False(string.IsNullOrWhiteSpace(t.Title), "Transfer title must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(t.Slug), "Transfer slug must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(t.City), "Transfer city must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(t.VehicleType), "Vehicle type must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(t.PickupLocation), "Pickup location must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(t.DropoffLocation), "Dropoff location must not be empty");
            Assert.True(t.Price > 0, "Transfer price must be positive");
            Assert.Equal(expectedCurrency, t.Currency);
            Assert.True(t.MaxPassengers >= 2, "Max passengers must be at least 2");
            Assert.True(t.Rating >= 3.5 && t.Rating <= 5.0, "Rating must be between 3.5 and 5.0");
        }
    }

    [Theory]
    [InlineData("gujjutours")]
    [InlineData("tripgoasia")]
    [InlineData("technoheaven")]
    public void SeedTransfers_CoversAllRequiredVehicleClasses(string siteId)
    {
        var filePath = Path.Combine(_seedDir, siteId, "transfers.json");
        var json = File.ReadAllText(filePath);
        var transfers = JsonSerializer.Deserialize<List<Transfer>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(transfers);
        var vehicleTypes = transfers.Select(t => t.VehicleType.ToLowerInvariant()).Distinct().ToList();

        Assert.Contains("sedan", vehicleTypes);
        Assert.Contains("suv", vehicleTypes);
        Assert.Contains("van", vehicleTypes);
        Assert.Contains("luxury", vehicleTypes);
    }

    [Theory]
    [InlineData("gujjutours")]
    [InlineData("tripgoasia")]
    [InlineData("technoheaven")]
    public void SeedTransfers_CoversAllRequiredTransferTypes(string siteId)
    {
        var filePath = Path.Combine(_seedDir, siteId, "transfers.json");
        var json = File.ReadAllText(filePath);
        var transfers = JsonSerializer.Deserialize<List<Transfer>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(transfers);
        var transferTypes = transfers.Select(t => t.TransferType.ToLowerInvariant()).Distinct().ToList();

        Assert.Contains("airport", transferTypes);
        Assert.Contains("attraction", transferTypes);
        Assert.Contains("hotel", transferTypes);
    }
}

