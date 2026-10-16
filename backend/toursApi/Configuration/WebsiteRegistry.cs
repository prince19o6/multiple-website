namespace ToursApi.Configuration;

public class WebsiteConfig
{
    public required string WebsiteId { get; set; }
    public required string SiteName { get; set; }
    public required string DatabaseName { get; set; }
    public required List<string> AllowedHostnames { get; set; }
    public required string CanonicalHostname { get; set; }
    public required string JwtIssuer { get; set; }
    public required string JwtAudience { get; set; }
    public required string JwtSigningKey { get; set; }
    public required List<string> CorsOrigins { get; set; }
    public required string Currency { get; set; }
    public required string CurrencySymbol { get; set; }
    public required string Scheme { get; set; }
    public required string EmailFromAddress { get; set; }
    public required string EmailFromName { get; set; }
    public string LogoUrl { get; set; } = "";
    public string PrimaryColor { get; set; } = "#2563eb";
    public string SecondaryColor { get; set; } = "#1e40af";
}

public static class WebsiteRegistry
{
    private static string GetEnvOrFallback(string envKey, string fallback)
    {
        var val = Environment.GetEnvironmentVariable(envKey);
        return !string.IsNullOrWhiteSpace(val) ? val.Trim() : fallback;
    }

    // The authoritative registry of the three isolated websites.
    // Each website has its OWN separate database name, JWT parameters, CORS origins, and email sender.
    public static readonly Dictionary<string, WebsiteConfig> SitesById = new(StringComparer.OrdinalIgnoreCase)
    {
        ["gujjutours"] = new WebsiteConfig
        {
            WebsiteId = "gujjutours",
            SiteName = "Gujju Tours",
            DatabaseName = "tours_gujjutours",
            CanonicalHostname = "www.gujjutours.com",
            AllowedHostnames = new List<string>
            {
                "www.gujjutours.com",
                "gujjutours.com",
                "b2b.gujjutours.com",
                "gujjutours",
                "travelexplorer.com",
                "www.travelexplorer.com",
                "website1"
            },
            JwtIssuer = "ToursApi-GujjuTours",
            JwtAudience = "ToursApp-GujjuTours",
            JwtSigningKey = GetEnvOrFallback("JWT_SIGNING_KEY_GUJJUTOURS", "GujjuTours_Secret_Jwt_Signing_Key_2026_Secure_Minimum_256_Bits!"),
            CorsOrigins = new List<string>
            {
                "https://www.gujjutours.com",
                "https://gujjutours.com",
                "https://b2b.gujjutours.com",
                "https://travelexplorer.com"
            },
            Currency = "USD",
            CurrencySymbol = "$",
            Scheme = "gujjutours",
            EmailFromAddress = "support@gujjutours.com",
            EmailFromName = "Gujju Tours Support",
            LogoUrl = "https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/headerLogoId/b65b72be-af9b-4f86-90b8-3d6d835af691_gujju-logo.svg",
            PrimaryColor = "#2563eb",
            SecondaryColor = "#1e40af",
        },
        ["tripgoasia"] = new WebsiteConfig
        {
            WebsiteId = "tripgoasia",
            SiteName = "TripGo Asia",
            DatabaseName = "tours_tripgoasia",
            CanonicalHostname = "www.tripgoasia.com",
            AllowedHostnames = new List<string>
            {
                "www.tripgoasia.com",
                "tripgoasia.com",
                "tripgoasia",
                "adventureworld.com",
                "www.adventureworld.com",
                "website2"
            },
            JwtIssuer = "ToursApi-TripGoAsia",
            JwtAudience = "ToursApp-TripGoAsia",
            JwtSigningKey = GetEnvOrFallback("JWT_SIGNING_KEY_TRIPGOASIA", "TripGoAsia_Secret_Jwt_Signing_Key_2026_Secure_Minimum_256_Bits!"),
            CorsOrigins = new List<string>
            {
                "https://www.tripgoasia.com",
                "https://tripgoasia.com",
                "https://adventureworld.com",
                "https://www.adventureworld.com"
            },
            Currency = "USD",
            CurrencySymbol = "$",
            Scheme = "tripgoasia",
            EmailFromAddress = "support@tripgoasia.com",
            EmailFromName = "TripGo Asia Support",
            LogoUrl = "https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/headerLogoId/237a7ac1-5310-4d08-8990-5e0e72f048f8_logo.svg",
            PrimaryColor = "#16a34a",
            SecondaryColor = "#15803d",
        },
        ["technoheaven"] = new WebsiteConfig
        {
            WebsiteId = "technoheaven",
            SiteName = "Technoheaven",
            DatabaseName = "tours_technoheaven",
            CanonicalHostname = "stagingb2b.technoheaven.com",
            AllowedHostnames = new List<string>
            {
                "stagingb2b.technoheaven.com",
                "technoheaven.com",
                "www.technoheaven.com",
                "technoheaven",
                "holidayparadise.com",
                "www.holidayparadise.com",
                "website3"
            },
            JwtIssuer = "ToursApi-Technoheaven",
            JwtAudience = "ToursApp-Technoheaven",
            JwtSigningKey = GetEnvOrFallback("JWT_SIGNING_KEY_TECHNOHEAVEN", "Technoheaven_Secret_Jwt_Signing_Key_2026_Secure_Minimum_256_Bits!"),
            CorsOrigins = new List<string>
            {
                "https://stagingb2b.technoheaven.com",
                "https://technoheaven.com",
                "https://www.technoheaven.com",
                "https://holidayparadise.com",
                "https://www.holidayparadise.com"
            },
            Currency = "USD",
            CurrencySymbol = "$",
            Scheme = "technoheaven",
            EmailFromAddress = "support@technoheaven.com",
            EmailFromName = "Technoheaven Support",
            LogoUrl = "https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/headerLogoId/1f5bdd1e-28e7-4e96-8977-82f6b3cb4a7e_technologomain.svg",
            PrimaryColor = "#dc2626",
            SecondaryColor = "#b91c1c",
        }
    };

    public static string NormalizeHostname(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "";

        var h = raw.Trim().ToLowerInvariant();

        if (h.StartsWith("https://")) h = h[8..];
        if (h.StartsWith("http://")) h = h[7..];

        var slash = h.IndexOf('/');
        if (slash >= 0) h = h[..slash];

        var colon = h.IndexOf(':');
        if (colon >= 0) h = h[..colon];

        return h.Trim().TrimEnd('.');
    }

    /// <summary>
    /// Resolves the site by normalized hostname or explicit site ID.
    /// Returns null if the hostname/ID does not belong to any registered site.
    /// Unknown hostnames strictly return null to allow the middleware to emit HTTP 404.
    /// </summary>
    public static WebsiteConfig? Resolve(string? rawHostnameOrId)
    {
        if (string.IsNullOrWhiteSpace(rawHostnameOrId)) return null;

        var normalized = NormalizeHostname(rawHostnameOrId);

        // Direct lookup by WebsiteId
        if (SitesById.TryGetValue(normalized, out var byId))
        {
            return byId;
        }

        // Search through allowed hostnames
        foreach (var site in SitesById.Values)
        {
            if (site.AllowedHostnames.Any(h => NormalizeHostname(h).Equals(normalized, StringComparison.OrdinalIgnoreCase)))
            {
                return site;
            }
        }

        return null;
    }
}