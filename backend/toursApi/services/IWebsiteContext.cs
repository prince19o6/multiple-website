using ToursApi.Configuration;

namespace ToursApi.Services;

public interface IWebsiteContext
{
    string CurrentWebsiteId { get; set; }
    WebsiteConfig? CurrentSite { get; set; }
    string DatabaseName => CurrentSite?.DatabaseName ?? throw new InvalidOperationException("Active website context is not set");
}
