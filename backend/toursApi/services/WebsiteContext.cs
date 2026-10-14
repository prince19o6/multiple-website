using ToursApi.Configuration;

namespace ToursApi.Services;

public class WebsiteContext : IWebsiteContext
{
    public string CurrentWebsiteId { get; set; } = "";
    public WebsiteConfig? CurrentSite { get; set; }
}
