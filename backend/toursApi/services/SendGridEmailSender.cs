using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ToursApi.Configuration;

namespace ToursApi.Services;

/// <summary>
/// HTTP-based transactional email sender supporting SendGrid v3 Mail Send API.
/// </summary>
public class SendGridEmailSender : IEmailSender
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SendGridEmailSender> _logger;

    public string ProviderName => "SendGrid";

    public SendGridEmailSender(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<SendGridEmailSender> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, WebsiteConfig siteConfig, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration[$"Websites:{siteConfig.WebsiteId}:SendGridApiKey"]
            ?? _configuration["Email:SendGridApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException($"SendGrid API Key is not configured for website '{siteConfig.WebsiteId}'.");
        }

        var client = _httpClientFactory.CreateClient("SendGrid");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            personalizations = new[]
            {
                new
                {
                    to = new[] { new { email = message.ToEmail, name = message.ToName } }
                }
            },
            from = new
            {
                email = siteConfig.EmailFromAddress,
                name = siteConfig.EmailFromName
            },
            reply_to = !string.IsNullOrWhiteSpace(message.ReplyTo ?? siteConfig.ReplyToEmail)
                ? new { email = message.ReplyTo ?? siteConfig.ReplyToEmail, name = siteConfig.EmailFromName }
                : null,
            subject = message.Subject,
            content = new[]
            {
                new { type = "text/plain", value = !string.IsNullOrWhiteSpace(message.PlainTextBody) ? message.PlainTextBody : message.Subject },
                new { type = "text/html", value = message.HtmlBody }
            }
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("https://api.sendgrid.com/v3/mail/send", jsonContent, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"SendGrid delivery failed with status {response.StatusCode}: {errBody}");
        }

        _logger.LogInformation(
            "[SENDGRID-EMAIL-SENT] To: {ToEmail}, Subject: {Subject}, Website: {Website}",
            message.ToEmail,
            message.Subject,
            siteConfig.SiteName
        );
    }
}
