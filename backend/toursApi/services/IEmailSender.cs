using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ToursApi.Configuration;

namespace ToursApi.Services;

public class EmailMessage
{
    public string ToEmail { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string PlainTextBody { get; set; } = string.Empty;
    public string? ReplyTo { get; set; }
    public List<string> Cc { get; set; } = new();
}

public interface IEmailSender
{
    string ProviderName { get; }
    Task SendAsync(EmailMessage message, WebsiteConfig siteConfig, CancellationToken cancellationToken = default);
}
