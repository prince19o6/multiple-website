namespace ToursApi.Configuration;

public static class WebsiteOptions
{
    public static readonly string[] ValidWebsites = { "website1", "website2", "website3", "website4" };

    public static bool IsValidWebsite(string websiteId)
    {
        return ValidWebsites.Contains(websiteId?.ToLowerInvariant());
    }
}
