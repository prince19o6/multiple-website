using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ToursApi.Configuration;

namespace ToursApi.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly IWebsiteContext _websiteContext;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IConfiguration configuration,
        IWebsiteContext websiteContext,
        ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _websiteContext = websiteContext;
        _logger = logger;
    }

    public async Task SendPasswordResetEmailAsync(
        string toEmail,
        string resetToken,
        string websiteHostname,
        string websiteName)
    {
        var site = _websiteContext.CurrentSite ?? WebsiteRegistry.Resolve(websiteHostname) ?? throw new InvalidOperationException($"Unable to resolve website for hostname '{websiteHostname}'");
        var rawHost = (websiteHostname ?? site.CanonicalHostname).Trim();
        var isLocal = string.IsNullOrEmpty(rawHost)
            || rawHost.Contains("localhost", StringComparison.OrdinalIgnoreCase)
            || rawHost.Contains("127.0.0.1");

        var webResetUrl = isLocal
            ? $"http://localhost:3000/reset-password?token={Uri.EscapeDataString(resetToken)}"
            : $"https://{rawHost}/reset-password?token={Uri.EscapeDataString(resetToken)}";

        // Deep link uses the website's own unique URL scheme
        var mobileDeepLink = $"{site.Scheme}://reset-password?token={Uri.EscapeDataString(resetToken)}";

        var enableSmtp = _configuration.GetValue<bool>("Email:EnableSmtp", false);
        var smtpHost = _configuration["Email:SmtpHost"];

        var fromEmail = _configuration[$"Websites:{site.WebsiteId}:EmailFromAddress"]
            ?? site.EmailFromAddress;
        var fromName = _configuration[$"Websites:{site.WebsiteId}:EmailFromName"]
            ?? site.EmailFromName;

        if (enableSmtp && !string.IsNullOrWhiteSpace(smtpHost))
        {
            try
            {
                var smtpPort = _configuration.GetValue<int>("Email:SmtpPort", 587);
                var smtpUser = _configuration[$"Websites:{site.WebsiteId}:EmailUser"]
                    ?? _configuration["Email:User"] ?? "";
                var smtpPass = _configuration[$"Websites:{site.WebsiteId}:EmailPassword"]
                    ?? _configuration["Email:Password"] ?? "";

                using var client = new SmtpClient(smtpHost, smtpPort)
                {
                    EnableSsl = _configuration.GetValue<bool>("Email:EnableSsl", true),
                    Credentials = new NetworkCredential(smtpUser, smtpPass)
                };

                using var mail = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = $"Password Reset Request - {site.SiteName}",
                    IsBodyHtml = true,
                    Body = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                            <h2 style='color: #1e293b;'>Password Reset Request</h2>
                            <p>Hello,</p>
                            <p>You requested a password reset for your account on <strong>{site.SiteName}</strong>.</p>
                            <p>Click the button below to reset your password (link expires in 45 minutes):</p>
                            <div style='margin: 25px 0;'>
                                <a href='{webResetUrl}' style='background-color: {site.PrimaryColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;'>Reset Password</a>
                            </div>
                            <p>If you are on mobile with the {site.SiteName} app installed:</p>
                            <p><a href='{mobileDeepLink}'>Open in {site.SiteName} App</a></p>
                            <p style='color: #64748b; font-size: 13px; margin-top: 30px;'>If you did not request this reset, please ignore this email. Your password will remain unchanged.</p>
                        </div>"
                };

                mail.To.Add(toEmail);
                await client.SendMailAsync(mail);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email via SMTP to {Email}", toEmail);
            }
        }

        _logger.LogInformation(
            "[DEBUG] [EMAIL] Password Reset Link for {Email} on {WebsiteName} ({Hostname}):\n  Web Link: {WebLink}\n  Mobile Deep Link: {MobileLink}",
            toEmail,
            site.SiteName,
            rawHost,
            webResetUrl,
            mobileDeepLink
        );
    }
}
