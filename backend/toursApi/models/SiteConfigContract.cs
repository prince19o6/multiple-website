using System.Text.Json.Serialization;

namespace ToursApi.Models;

public class ComponentViewMoreContract
{
    public bool Enabled { get; set; } = false;
    public string Label { get; set; } = "View All";
    public string TargetUrl { get; set; } = "";
}

public class SiteComponentConfigContract
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "";
    public string Variant { get; set; } = "default";
    public bool Enabled { get; set; } = true;
    public string Title { get; set; } = "";
    public string? Subtitle { get; set; }
    public int Order { get; set; } = 0;
    public Dictionary<string, object> Props { get; set; } = new();
    public string? DataSource { get; set; }
    public int MaxItems { get; set; } = 10;
    public ComponentViewMoreContract? ViewMore { get; set; }
    public List<string> Platforms { get; set; } = new() { "web", "app" };
}

public class SiteLanguageContract
{
    public string Code { get; set; } = "en";
    public string Name { get; set; } = "English";
    public bool IsRTL { get; set; } = false;
}

public class SiteCurrencyContract
{
    public string Code { get; set; } = "USD";
    public string Symbol { get; set; } = "$";
    public string Name { get; set; } = "US Dollar";
    public int DecimalPlaces { get; set; } = 2;
}

public class SiteInfoContract
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Tagline { get; set; } = "";
    public string CanonicalHostname { get; set; } = "";
    public List<string> Hostnames { get; set; } = new();
    public string DefaultLanguage { get; set; } = "en";
    public List<SiteLanguageContract> Languages { get; set; } = new();
    public SiteCurrencyContract Currency { get; set; } = new();
    public string TimeZone { get; set; } = "UTC";
}

public class SiteThemeColorsContract
{
    public string Primary { get; set; } = "#2563eb";
    public string PrimaryDark { get; set; } = "#1d4ed8";
    public string PrimaryLight { get; set; } = "#dbeafe";
    public string PrimaryContrast { get; set; } = "#ffffff";
    public string PrimaryText { get; set; } = "#0f172a";
    public string Secondary { get; set; } = "#0f172a";
    public string Accent { get; set; } = "#f59e0b";
    public string Background { get; set; } = "#ffffff";
    public string Surface { get; set; } = "#ffffff";
    public string Surface2 { get; set; } = "#f8fafc";
    public string Text { get; set; } = "#0f172a";
    public string Heading { get; set; } = "#0f172a";
    public string MutedText { get; set; } = "#64748b";
    public string Border { get; set; } = "#e2e8f0";
    public string Success { get; set; } = "#16a34a";
    public string Danger { get; set; } = "#dc2626";
    public string FooterBg { get; set; } = "#0f172a";
    public string FooterText { get; set; } = "#f8fafc";
}

public class SiteThemeContract
{
    public string DefaultMode { get; set; } = "light";
    public SiteThemeColorsContract Colors { get; set; } = new();
    public Dictionary<string, string>? DarkColors { get; set; }
    public Dictionary<string, int> Radius { get; set; } = new()
    {
        ["xs"] = 4, ["sm"] = 8, ["md"] = 12, ["lg"] = 16, ["xl"] = 24, ["full"] = 9999
    };
    public Dictionary<string, string> Shadows { get; set; } = new()
    {
        ["none"] = "none",
        ["sm"] = "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        ["md"] = "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        ["lg"] = "0 10px 15px -3px rgb(0 0 0 / 0.1)"
    };
    public Dictionary<string, int> Spacing { get; set; } = new()
    {
        ["xs"] = 4, ["sm"] = 8, ["md"] = 16, ["lg"] = 24, ["xl"] = 32, ["xxl"] = 48
    };
}

public class CustomFontContract
{
    public string Family { get; set; } = "";
    public string Url { get; set; } = "";
    public int Weight { get; set; } = 400;
    public string Style { get; set; } = "normal";
}

public class SiteTypographyContract
{
    public string HeadingFont { get; set; } = "Inter";
    public string BodyFont { get; set; } = "Inter";
    public string HeadingWeight { get; set; } = "700";
    public string BodyWeight { get; set; } = "400";
    public List<CustomFontContract> CustomFonts { get; set; } = new();
}

public class SiteAssetsContract
{
    public string LogoUrl { get; set; } = "";
    public string LogoLight { get; set; } = "";
    public string LogoDark { get; set; } = "";
    public string Favicon { get; set; } = "";
    public string OgImage { get; set; } = "";
    public string AppIcon { get; set; } = "";
    public string AppSplash { get; set; } = "";
    public string AdaptiveIcon { get; set; } = "";
}

public class SiteLayoutContract
{
    public string HeaderVariant { get; set; } = "default";
    public string FooterVariant { get; set; } = "default";
    public bool TopBar { get; set; } = true;
    public bool StickyHeader { get; set; } = true;
    public string PageWidth { get; set; } = "default";
}

public class SiteWebMenuItemContract
{
    public string Label { get; set; } = "";
    public string Href { get; set; } = "";
    public string? Icon { get; set; }
    public bool OpenInNewTab { get; set; } = false;
    public bool RequiresAuth { get; set; } = false;
}

public class SiteWebServiceTabContract
{
    public string Id { get; set; } = "";
    public string Label { get; set; } = "";
    public string Href { get; set; } = "";
    public string Icon { get; set; } = "";
    public bool Enabled { get; set; } = true;
    public string? Badge { get; set; }
}

public class SiteFooterLinkContract
{
    public string Label { get; set; } = "";
    public string Href { get; set; } = "";
}

public class SiteFooterColumnContract
{
    public string Title { get; set; } = "";
    public List<SiteFooterLinkContract> Links { get; set; } = new();
}

public class SiteSocialLinkContract
{
    public string Platform { get; set; } = "";
    public string Url { get; set; } = "";
    public string? Icon { get; set; }
}

public class SiteAppTabContract
{
    public string Id { get; set; } = "";
    public string Label { get; set; } = "";
    public string Icon { get; set; } = "";
    public string? ActiveIcon { get; set; }
    public string Route { get; set; } = "";
    public bool Enabled { get; set; } = true;
    public int Order { get; set; } = 0;
    public string? BadgeKey { get; set; }
}

public class SiteAppProfileMenuContract
{
    public string Id { get; set; } = "";
    public string Label { get; set; } = "";
    public string Icon { get; set; } = "";
    public string Route { get; set; } = "";
    public bool Enabled { get; set; } = true;
    public string Section { get; set; } = "account";
}

public class SiteNavigationContract
{
    public SiteWebNavigationContract Web { get; set; } = new();
    public SiteAppNavigationContract App { get; set; } = new();
}

public class SiteWebNavigationContract
{
    public List<SiteWebMenuItemContract> MenuItems { get; set; } = new();
    public List<SiteWebServiceTabContract> ServiceTabs { get; set; } = new();
    public List<SiteFooterColumnContract> FooterColumns { get; set; } = new();
    public List<SiteSocialLinkContract> SocialLinks { get; set; } = new();
}

public class SiteAppNavigationContract
{
    public List<SiteAppTabContract> Tabs { get; set; } = new();
    public List<SiteAppProfileMenuContract> ProfileMenu { get; set; } = new();
}

public class SiteFeaturesContract
{
    public bool Hotels { get; set; } = true;
    public bool Tours { get; set; } = true;
    public bool Packages { get; set; } = true;
    public bool Flights { get; set; } = true;
    public bool Transfers { get; set; } = true;
    public bool Visas { get; set; } = true;
    public bool Restaurants { get; set; } = false;
    public bool Rentals { get; set; } = false;
    public bool Insurance { get; set; } = false;
    public bool BuildPackage { get; set; } = false;
    public bool BookingApproval { get; set; } = true;
    public bool Wishlist { get; set; } = true;
    public bool Reviews { get; set; } = true;
    public bool PromoCodes { get; set; } = true;
    public bool ConciergeChat { get; set; } = true;
    public bool LanguageSwitch { get; set; } = true;
    public bool CurrencySwitch { get; set; } = true;
    public bool DarkModeToggle { get; set; } = true;
    public bool BiometricLogin { get; set; } = false;
    public bool PushNotifications { get; set; } = true;
}

public class SiteBannerContract
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Subtitle { get; set; } = "";
    public string? Code { get; set; }
    public string? Discount { get; set; }
    public string ImageUrl { get; set; } = "";
    public string TargetUrl { get; set; } = "/tours";
    public bool Enabled { get; set; } = true;
}

public class SiteTrustBadgeContract
{
    public string Icon { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
}

public class SitePartnerContract
{
    public string Name { get; set; } = "";
    public string LogoUrl { get; set; } = "";
}

public class SiteFaqContract
{
    public string Question { get; set; } = "";
    public string Answer { get; set; } = "";
    public string? Category { get; set; }
}

public class SiteBookingAddOnContract
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "USD";
    public string Description { get; set; } = "";
    public string Icon { get; set; } = "shield-checkmark-outline";
}

public class SiteConciergeContract
{
    public string Name { get; set; } = "Travel Specialist";
    public string Title { get; set; } = "Dedicated Concierge";
    public string AvatarUrl { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Whatsapp { get; set; } = "";
    public string Email { get; set; } = "";
    public string WelcomeMessage { get; set; } = "Hello! How can I help customize your journey today?";
}

public class SiteContactContract
{
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Address { get; set; }
    public string SupportHours { get; set; } = "24/7 Dedicated Support";
}

public class SiteContentContract
{
    public List<SiteBannerContract> Banners { get; set; } = new();
    public List<SiteTrustBadgeContract> TrustBadges { get; set; } = new();
    public List<SitePartnerContract> Partners { get; set; } = new();
    public List<SiteFaqContract> Faqs { get; set; } = new();
    public List<SiteBookingAddOnContract> BookingAddOns { get; set; } = new();
    public SiteConciergeContract Concierge { get; set; } = new();
    public SiteContactContract Contact { get; set; } = new();
    public string CancellationPolicy { get; set; } = "Free cancellation up to 48 hours before departure.";
    public string TermsUrl { get; set; } = "/terms";
    public string PrivacyUrl { get; set; } = "/privacy";
    public string DeleteAccountUrl { get; set; } = "/delete-account";
}

public class SiteSeoContract
{
    public string TitleTemplate { get; set; } = "%s | Travel Platform";
    public string DefaultTitle { get; set; } = "Extraordinary Travel Experiences";
    public string DefaultDescription { get; set; } = "Book bespoke tours, luxury stays, flights, and authentic local activities.";
    public List<string> Keywords { get; set; } = new() { "travel", "tours", "hotels", "flights" };
    public string OgImage { get; set; } = "";
    public string TwitterHandle { get; set; } = "";
}

public class SiteAppMetaContract
{
    public string MinSupportedVersion { get; set; } = "1.0.0";
    public string LatestVersion { get; set; } = "1.0.0";
    public bool ForceUpdate { get; set; } = false;
    public string ForceUpdateMessage { get; set; } = "A critical update is required. Please download the latest version to continue.";
    public bool Maintenance { get; set; } = false;
    public string MaintenanceMessage { get; set; } = "Our systems are currently undergoing scheduled maintenance. Please check back shortly.";
    public Dictionary<string, string> StoreUrls { get; set; } = new()
    {
        ["ios"] = "",
        ["android"] = ""
    };
    public string DeepLinkScheme { get; set; } = "toursapp";
    public string SupportEmail { get; set; } = "support@travelplatform.com";
}

public class SiteComponentsContainerContract
{
    public List<SiteComponentConfigContract> Home { get; set; } = new();
    public List<SiteComponentConfigContract> Listing { get; set; } = new();
    public List<SiteComponentConfigContract> Detail { get; set; } = new();
}

public class SiteConfigContract
{
    public string Version { get; set; } = "1.0.0";
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    public SiteInfoContract Site { get; set; } = new();
    public SiteThemeContract Theme { get; set; } = new();
    public SiteTypographyContract Typography { get; set; } = new();
    public SiteAssetsContract Assets { get; set; } = new();
    public SiteLayoutContract Layout { get; set; } = new();
    public SiteComponentsContainerContract Components { get; set; } = new();
    public SiteNavigationContract Navigation { get; set; } = new();
    public SiteFeaturesContract Features { get; set; } = new();
    public List<FeatureItemContract> FeatureRegistry { get; set; } = new();
    public SiteContentContract Content { get; set; } = new();
    public SiteSeoContract Seo { get; set; } = new();
    public Dictionary<string, string> Integrations { get; set; } = new();
    public SiteAppMetaContract App { get; set; } = new();
}

