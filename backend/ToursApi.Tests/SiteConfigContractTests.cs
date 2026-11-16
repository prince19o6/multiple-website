using System;
using System.Linq;
using ToursApi.Configuration;
using Xunit;

namespace ToursApi.Tests;

public class SiteConfigContractTests
{
    private readonly string[] _expectedSites = new[] { "gujjutours", "tripgoasia", "technoheaven" };

    [Fact]
    public void WebsiteRegistry_ContainsAllThreeMandatoryWebsites()
    {
        var allSites = WebsiteRegistry.SitesById.Values.ToList();
        Assert.True(allSites.Count >= 3, "Registry must contain at least the 3 production websites");

        foreach (var siteId in _expectedSites)
        {
            var site = WebsiteRegistry.Resolve(siteId);
            Assert.NotNull(site);
            Assert.Equal(siteId, site.WebsiteId);
        }
    }

    [Theory]
    [InlineData("gujjutours", "Gujju Tours", "USD", "$")]
    [InlineData("tripgoasia", "TripGo Asia", "USD", "$")]
    [InlineData("technoheaven", "Technoheaven", "USD", "$")]
    public void WebsiteRegistry_HasValidCurrencyAndMetadataPerTenant(string siteId, string expectedName, string expectedCurrency, string expectedSymbol)
    {
        var site = WebsiteRegistry.Resolve(siteId);
        Assert.NotNull(site);
        Assert.Contains(expectedName, site.SiteName);
        Assert.Equal(expectedCurrency, site.Currency);
        Assert.Equal(expectedSymbol, site.CurrencySymbol);
        Assert.NotEmpty(site.CanonicalHostname);
        Assert.NotEmpty(site.AllowedHostnames);
    }

    [Theory]
    [InlineData("www.gujjutours.com", "gujjutours")]
    [InlineData("gujjutours.com", "gujjutours")]
    [InlineData("b2b.gujjutours.com", "gujjutours")]
    [InlineData("www.tripgoasia.com", "tripgoasia")]
    [InlineData("tripgoasia.com", "tripgoasia")]
    [InlineData("adventureworld.com", "tripgoasia")]
    [InlineData("stagingb2b.technoheaven.com", "technoheaven")]
    [InlineData("technoheaven.com", "technoheaven")]
    [InlineData("www.technoheaven.com", "technoheaven")]
    public void WebsiteRegistry_ResolvesHostnamesAccurately(string hostname, string expectedSiteId)
    {
        var site = WebsiteRegistry.Resolve(hostname);
        Assert.NotNull(site);
        Assert.Equal(expectedSiteId, site.WebsiteId);
    }

    [Theory]
    [InlineData("malicious-site.com")]
    [InlineData("unknown.travel")]
    [InlineData("random-host.net")]
    [InlineData("")]
    [InlineData("   ")]
    public void WebsiteRegistry_RejectsUnknownHostnames(string unknownHost)
    {
        var site = WebsiteRegistry.Resolve(unknownHost);
        Assert.Null(site);
    }

    [Fact]
    public void WebsiteRegistry_EnsuresNoSharedCryptographicSecretsAcrossTenants()
    {
        var siteA = WebsiteRegistry.Resolve("gujjutours")!;
        var siteB = WebsiteRegistry.Resolve("tripgoasia")!;
        var siteC = WebsiteRegistry.Resolve("technoheaven")!;

        var keys = new[] { siteA.JwtSigningKey, siteB.JwtSigningKey, siteC.JwtSigningKey };
        Assert.Equal(3, keys.Distinct().Count());

        var dbNames = new[] { siteA.DatabaseName, siteB.DatabaseName, siteC.DatabaseName };
        Assert.Equal(3, dbNames.Distinct().Count());
    }
}
