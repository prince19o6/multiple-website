namespace ToursApi.Configuration;

public class WebsiteConfig
{
    public required string Hostname { get; set; }   // e.g. "site1.com"
    public required string WebsiteId { get; set; }   // internal key used to filter tours/bookings, e.g. "website1"
    public required string SiteName { get; set; }
    public required string LogoUrl { get; set; }
    public required string PrimaryColor { get; set; }
    public required string SecondaryColor { get; set; }
}

public static class WebsiteRegistry
{
    // Single source of truth for all 3 sites. Update this list when you
    // add a new site or change a domain — nothing else needs to change.
    public static readonly List<WebsiteConfig> Sites = new()
    {
        new WebsiteConfig
        {
            Hostname = "travelexplorer.com",
            WebsiteId = "website1",
            SiteName = "Travel Explorer Tours",
            LogoUrl = "https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/headerLogoId/b65b72be-af9b-4f86-90b8-3d6d835af691_gujju-logo.svg",
            PrimaryColor = "#2563eb",
            SecondaryColor = "#1e40af",
        },
        new WebsiteConfig
        {
            Hostname = "adventureworld.com",
            WebsiteId = "website2",
            SiteName = "Adventure World Tours", 
            LogoUrl = "https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/headerLogoId/237a7ac1-5310-4d08-8990-5e0e72f048f8_logo.svg",
            PrimaryColor = "#16a34a",
            SecondaryColor = "#15803d",
        },
        new WebsiteConfig
        {
            Hostname = "holidayparadise.com",
            WebsiteId = "website3",
            SiteName = "Holiday Paradise Tours",
            LogoUrl = "https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/headerLogoId/1f5bdd1e-28e7-4e96-8977-82f6b3cb4a7e_technologomain.svg",
            PrimaryColor = "#dc2626",
            SecondaryColor = "#b91c1c",
        },
    };

    public static WebsiteConfig? GetByHostname(string hostname)
    {
        return Sites.FirstOrDefault(
            s => s.Hostname.Equals(hostname, StringComparison.OrdinalIgnoreCase)
        );
    }

    public static bool IsValidHostname(string hostname)
    {
        return GetByHostname(hostname) != null;
    }
}