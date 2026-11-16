using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using ToursApi.Models;
using Xunit;

namespace ToursApi.Tests;

public class VisasModuleTests
{
    private readonly string _seedDir;

    public VisasModuleTests()
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
    public void VisaModel_CreatesValidEntityWithRequirementsAndFaqs()
    {
        var visa = new Visa
        {
            VisaNumericId = 1001,
            VisaId = "vi_gujjutours_1001",
            WebsiteId = "gujjutours",
            Country = "United Arab Emirates",
            CountryCode = "AE",
            CountrySlug = "united-arab-emirates",
            Title = "United Arab Emirates: 30-Day Single Entry Tourist eVisa",
            Name = "United Arab Emirates: 30-Day Single Entry Tourist eVisa",
            Slug = "united-arab-emirates-tourist-30-1001",
            VisaType = "tourist",
            VisaTypeLabel = "Tourist eVisa",
            Validity = "60 Days from Date of Issue",
            StayDuration = "30 Days",
            ProcessingTime = "3-4 Working Days",
            EntryType = "Single Entry",
            Price = 6730,
            Currency = "INR",
            ApprovalRate = 99.4,
            Rating = 4.9,
            Reviews = 340,
            DocumentsRequired = new List<string>
            {
                "Valid Passport Copy with minimum 6 months validity from date of travel",
                "Recent Passport-Sized Photograph (white background)",
                "Confirmed Round-Trip Flight Itinerary",
                "Hotel Booking Confirmation Voucher"
            },
            Faqs = new List<VisaFaq>
            {
                new VisaFaq { Question = "How long does processing take?", Answer = "3-4 Working Days." }
            }
        };

        Assert.Equal("United Arab Emirates", visa.Country);
        Assert.Equal("tourist", visa.VisaType);
        Assert.Equal("Single Entry", visa.EntryType);
        Assert.Equal(99.4, visa.ApprovalRate);
        Assert.Equal(6730, visa.Price);
        Assert.Equal(4, visa.DocumentsRequired.Count);
        Assert.Single(visa.Faqs);
    }

    [Theory]
    [InlineData("gujjutours", "INR")]
    [InlineData("tripgoasia", "USD")]
    [InlineData("technoheaven", "AED")]
    public void SeedVisas_ContainsCompleteDeterministicCatalog(string siteId, string expectedCurrency)
    {
        var filePath = Path.Combine(_seedDir, siteId, "visas.json");
        Assert.True(File.Exists(filePath), $"Visas seed file missing at: {filePath}");

        var json = File.ReadAllText(filePath);
        var visas = JsonSerializer.Deserialize<List<Visa>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(visas);
        Assert.True(visas.Count >= 50, $"Expected >= 50 visas for {siteId}, found {visas.Count}");

        foreach (var v in visas)
        {
            Assert.False(string.IsNullOrWhiteSpace(v.Title), "Visa title must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(v.Slug), "Visa slug must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(v.Country), "Visa country must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(v.CountryCode), "Visa countryCode must not be empty");
            Assert.False(string.IsNullOrWhiteSpace(v.VisaType), "Visa type must not be empty");
            Assert.Equal(expectedCurrency, v.Currency);
            Assert.True(v.Price > 0, $"Visa price must be positive for {v.Slug}");
            Assert.True(v.VisaNumericId >= 1000, "Visa numeric ID must be >= 1000");
            Assert.True(v.ApprovalRate >= 98.0, $"Approval rate must be >= 98.0%, got {v.ApprovalRate}");
            Assert.True(v.DocumentsRequired.Count >= 3, "Visa must require at least 3 documents");
        }
    }

    [Fact]
    public void SeedVisas_HasAllRequiredVisaTypes()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "visas.json");
        var json = File.ReadAllText(filePath);
        var visas = JsonSerializer.Deserialize<List<Visa>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(visas);
        var visaTypes = visas.Select(v => v.VisaType).Distinct().ToList();

        Assert.Contains("tourist", visaTypes);
        Assert.Contains("multiple-entry", visaTypes);
        Assert.Contains("express", visaTypes);
        Assert.Contains("business", visaTypes);
    }

    [Fact]
    public void SeedVisas_UniqueSlugsAndNumericIds()
    {
        var filePath = Path.Combine(_seedDir, "gujjutours", "visas.json");
        var json = File.ReadAllText(filePath);
        var visas = JsonSerializer.Deserialize<List<Visa>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(visas);
        var slugs = visas.Select(v => v.Slug).ToList();
        var numIds = visas.Select(v => v.VisaNumericId).ToList();

        Assert.Equal(slugs.Count, slugs.Distinct().Count());
        Assert.Equal(numIds.Count, numIds.Distinct().Count());
    }

    [Fact]
    public void SeedVisas_ImagePointersUseDeterministicLocalSvgs()
    {
        foreach (var site in new[] { "gujjutours", "tripgoasia", "technoheaven" })
        {
            var filePath = Path.Combine(_seedDir, site, "visas.json");
            var json = File.ReadAllText(filePath);
            var visas = JsonSerializer.Deserialize<List<Visa>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            Assert.NotNull(visas);
            foreach (var v in visas)
            {
                Assert.StartsWith("/seed-images/visas/", v.Image);
                Assert.EndsWith(".svg", v.Image);
                Assert.DoesNotContain("http://", v.Image);
                Assert.DoesNotContain("https://", v.Image);
            }
        }
    }
}

