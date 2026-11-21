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
    public string ReplyToEmail { get; set; } = "";
    public string SupportContact { get; set; } = "";
    public string SupportPhone { get; set; } = "";
    public string TimeZone { get; set; } = "UTC";
    public string CancellationPolicy { get; set; } = "";
    public string ContactEmail => !string.IsNullOrWhiteSpace(SupportContact) ? SupportContact : EmailFromAddress;
    public string DefaultCurrency => !string.IsNullOrWhiteSpace(Currency) ? Currency : "USD";
    public string LogoUrl { get; set; } = "";
    public string LogoLight { get; set; } = "";
    public string LogoDark { get; set; } = "";
    public string DefaultMode { get; set; } = "light";
    public Dictionary<string, string> ThemeLight { get; set; } = new();
    public Dictionary<string, string> ThemeDark { get; set; } = new();
    public string PrimaryColor { get; set; } = "#2563eb";
    public string SecondaryColor { get; set; } = "#1e40af";

    // ─── Booking Confirmation & Workflow Config ─────────────────────────────────
    public bool RequireApproval { get; set; } = true;
    public List<string> AdminNotificationEmails { get; set; } = new();
    public int PendingExpiryHours { get; set; } = 48;
    public string ActionTokenSecret { get; set; } = "Action_Token_Secret_Default_Key_2026_Secure_Key!";
}

public static class WebsiteRegistry
{
    private static string GetEnvOrFallback(string envKey, string fallback)
    {
        var val = Environment.GetEnvironmentVariable(envKey);
        return !string.IsNullOrWhiteSpace(val) ? val.Trim() : fallback;
    }

    // The authoritative registry of the three isolated websites.
    // Each website has its OWN separate database name, JWT parameters, CORS origins, email settings, and workflow policy.
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
            Currency = "INR",
            CurrencySymbol = "₹",
            Scheme = "gujjutours",
            EmailFromAddress = "support@gujjutours.com",
            EmailFromName = "Gujju Tours Concierge",
            ReplyToEmail = "concierge@gujjutours.com",
            SupportContact = "support@gujjutours.com",
            SupportPhone = "+1 (800) 485-5886",
            TimeZone = "Asia/Kolkata",
            CancellationPolicy = "Free cancellation up to 48 hours before departure. Cancellations within 48 hours are subject to a 20% processing fee.",
            LogoUrl = "https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/headerLogoId/b65b72be-af9b-4f86-90b8-3d6d835af691_gujju-logo.svg",
            LogoLight = "https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/headerLogoId/44df6d60-4c20-4590-b5d1-439796a6eae9_gujju-logo.svg",
            LogoDark = "https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/darkThemeLogoId/adfa5ffd-232b-4cff-a0ce-cac1d4c8fc05_gujju-logo.svg",
            DefaultMode = "light",
            ThemeLight = new Dictionary<string, string>
            {
                ["bg"] = "#ffffff",
                ["surface"] = "#ffffff",
                ["surface-2"] = "#f8fafc",
                ["text"] = "#0f172a",
                ["text-muted"] = "#64748b",
                ["border"] = "#e2e8f0"
            },
            ThemeDark = new Dictionary<string, string>
            {
                ["bg"] = "#0b0f19",
                ["surface"] = "#131b2e",
                ["surface-2"] = "#1e293b",
                ["text"] = "#f8fafc",
                ["text-muted"] = "#94a3b8",
                ["border"] = "#1e293b"
            },
            PrimaryColor = "#2563eb",
            SecondaryColor = "#1e40af",
            RequireApproval = true,
            AdminNotificationEmails = new List<string> { "admin@gujjutours.com", "operations@gujjutours.com" },
            PendingExpiryHours = 48,
            ActionTokenSecret = GetEnvOrFallback("ACTION_TOKEN_SECRET_GUJJUTOURS", "GujjuTours_Action_Token_Secret_2026_Secure_Key_HMAC_SHA256!"),
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
            EmailFromName = "TripGo Asia Concierge",
            ReplyToEmail = "bookings@tripgoasia.com",
            SupportContact = "support@tripgoasia.com",
            SupportPhone = "+65 6789 0123",
            TimeZone = "Asia/Bangkok",
            CancellationPolicy = "Full refund if cancelled 72 hours before expedition start. 50% refund within 24-72 hours. No refund within 24 hours.",
            LogoUrl = "https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/headerLogoId/237a7ac1-5310-4d08-8990-5e0e72f048f8_logo.svg",
            LogoLight = "https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/headerLogoId/237a7ac1-5310-4d08-8990-5e0e72f048f8_logo.svg",
            LogoDark = "https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/darkThemeLogoId/70eb388a-e44c-4302-af0d-4c0e03f7fee1_White-Logo.svg",
            DefaultMode = "light",
            ThemeLight = new Dictionary<string, string>
            {
                ["bg"] = "#ffffff",
                ["surface"] = "#ffffff",
                ["surface-2"] = "#f8fafc",
                ["text"] = "#0f172a",
                ["text-muted"] = "#64748b",
                ["border"] = "#e2e8f0"
            },
            ThemeDark = new Dictionary<string, string>
            {
                ["bg"] = "#0b0f19",
                ["surface"] = "#131b2e",
                ["surface-2"] = "#1e293b",
                ["text"] = "#f8fafc",
                ["text-muted"] = "#94a3b8",
                ["border"] = "#1e293b"
            },
            PrimaryColor = "#16a34a",
            SecondaryColor = "#15803d",
            RequireApproval = true,
            AdminNotificationEmails = new List<string> { "admin@tripgoasia.com", "reservations@tripgoasia.com" },
            PendingExpiryHours = 48,
            ActionTokenSecret = GetEnvOrFallback("ACTION_TOKEN_SECRET_TRIPGOASIA", "TripGoAsia_Action_Token_Secret_2026_Secure_Key_HMAC_SHA256!"),
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
            Currency = "AED",
            CurrencySymbol = "AED ",
            Scheme = "technoheaven",
            EmailFromAddress = "support@technoheaven.com",
            EmailFromName = "Technoheaven Luxury Desk",
            ReplyToEmail = "concierge@technoheaven.com",
            SupportContact = "support@technoheaven.com",
            SupportPhone = "+971 4 321 0000",
            TimeZone = "Asia/Dubai",
            CancellationPolicy = "VIP Reservations can be rescheduled free of charge up to 24 hours prior. Cancellations within 24 hours forfeit the deposit.",
            LogoUrl = "https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/headerLogoId/1f5bdd1e-28e7-4e96-8977-82f6b3cb4a7e_technologomain.svg",
            LogoLight = "https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/headerLogoId/1f5bdd1e-28e7-4e96-8977-82f6b3cb4a7e_technologomain.svg",
            LogoDark = "https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/darkThemeLogoId/8329a5dc-5c1a-44d8-a9e7-4e62993dd29b_technologomain.svg",
            DefaultMode = "light",
            ThemeLight = new Dictionary<string, string>
            {
                ["bg"] = "#ffffff",
                ["surface"] = "#ffffff",
                ["surface-2"] = "#f8fafc",
                ["text"] = "#0f172a",
                ["text-muted"] = "#64748b",
                ["border"] = "#e2e8f0"
            },
            ThemeDark = new Dictionary<string, string>
            {
                ["bg"] = "#0b0f19",
                ["surface"] = "#131b2e",
                ["surface-2"] = "#1e293b",
                ["text"] = "#f8fafc",
                ["text-muted"] = "#94a3b8",
                ["border"] = "#1e293b"
            },
            PrimaryColor = "#dc2626",
            SecondaryColor = "#b91c1c",
            RequireApproval = true,
            AdminNotificationEmails = new List<string> { "admin@technoheaven.com", "luxury@technoheaven.com" },
            PendingExpiryHours = 48,
            ActionTokenSecret = GetEnvOrFallback("ACTION_TOKEN_SECRET_TECHNOHEAVEN", "Technoheaven_Action_Token_Secret_2026_Secure_Key_HMAC_SHA256!"),
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