using System;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ToursApi.Configuration;

namespace ToursApi.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    public string ProviderName => "Smtp";

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, WebsiteConfig siteConfig, CancellationToken cancellationToken = default)
    {
        var smtpHost = _configuration[$"Websites:{siteConfig.WebsiteId}:SmtpHost"]
            ?? _configuration["Email:SmtpHost"]
            ?? "127.0.0.1";

        var smtpPort = _configuration.GetValue<int>($"Websites:{siteConfig.WebsiteId}:SmtpPort",
            _configuration.GetValue<int>("Email:SmtpPort", 587));

        var smtpUser = _configuration[$"Websites:{siteConfig.WebsiteId}:EmailUser"]
            ?? _configuration["Email:User"] ?? "";

        var smtpPass = _configuration[$"Websites:{siteConfig.WebsiteId}:EmailPassword"]
            ?? _configuration["Email:Password"] ?? "";

        var enableSsl = _configuration.GetValue<bool>($"Websites:{siteConfig.WebsiteId}:EnableSsl",
            _configuration.GetValue<bool>("Email:EnableSsl", true));

        var fromEmail = !string.IsNullOrWhiteSpace(siteConfig.EmailFromAddress)
            ? siteConfig.EmailFromAddress
            : (_configuration["Email:FromEmail"] ?? "no-reply@toursapp.com");

        var fromName = !string.IsNullOrWhiteSpace(siteConfig.EmailFromName)
            ? siteConfig.EmailFromName
            : siteConfig.SiteName;

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            EnableSsl = enableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 15000
        };

        if (!string.IsNullOrWhiteSpace(smtpUser) && !string.IsNullOrWhiteSpace(smtpPass))
        {
            client.Credentials = new NetworkCredential(smtpUser, smtpPass);
        }

        using var mail = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = message.Subject,
            Body = message.HtmlBody,
            IsBodyHtml = true
        };

        if (!string.IsNullOrWhiteSpace(message.PlainTextBody))
        {
            var plainView = AlternateView.CreateAlternateViewFromString(message.PlainTextBody, null, "text/plain");
            mail.AlternateViews.Add(plainView);
            var htmlView = AlternateView.CreateAlternateViewFromString(message.HtmlBody, null, "text/html");
            mail.AlternateViews.Add(htmlView);
        }

        mail.To.Add(new MailAddress(message.ToEmail, message.ToName));

        if (!string.IsNullOrWhiteSpace(message.ReplyTo ?? siteConfig.ReplyToEmail))
        {
            mail.ReplyToList.Add(new MailAddress(message.ReplyTo ?? siteConfig.ReplyToEmail));
        }

        foreach (var cc in message.Cc)
        {
            if (!string.IsNullOrWhiteSpace(cc))
            {
                mail.CC.Add(new MailAddress(cc.Trim()));
            }
        }

        await client.SendMailAsync(mail, cancellationToken);

        _logger.LogInformation(
            "[SMTP-EMAIL-SENT] To: {ToEmail}, Subject: {Subject}, Host: {Host}:{Port}, Site: {Site}",
            message.ToEmail,
            message.Subject,
            smtpHost,
            smtpPort,
            siteConfig.SiteName
        );
    }
}
