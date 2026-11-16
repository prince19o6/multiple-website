using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ToursApi.Configuration;
using ToursApi.Models;

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
                _logger.LogError(ex, "Failed to send password reset email via SMTP to {Email}", toEmail);
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

    public async Task SendBookingConfirmationEmailAsync(Booking booking)
    {
        var site = _websiteContext.CurrentSite
            ?? WebsiteRegistry.Resolve(booking.WebsiteId)
            ?? WebsiteRegistry.SitesById["gujjutours"];
        var toEmail = booking.Email;
        if (string.IsNullOrWhiteSpace(toEmail)) return;

        var enableSmtp = _configuration.GetValue<bool>("Email:EnableSmtp", false);
        var smtpHost = _configuration["Email:SmtpHost"];

        var fromEmail = _configuration[$"Websites:{site.WebsiteId}:EmailFromAddress"]
            ?? site.EmailFromAddress;
        var fromName = _configuration[$"Websites:{site.WebsiteId}:EmailFromName"]
            ?? site.EmailFromName;

        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;
        var currency = booking.Snapshot?.Currency ?? booking.Currency ?? "$";
        var totalFormatted = $"{currency}{booking.TotalPrice:N2}";
        var travelDateStr = booking.TravelDate != default
            ? booking.TravelDate.ToString("ddd, dd MMM yyyy")
            : booking.StartDate.ToString("ddd, dd MMM yyyy");

        var htmlBody = $@"
            <div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);'>
                <div style='background: {site.PrimaryColor}; padding: 28px 24px; color: #ffffff;'>
                    <h1 style='margin: 0; font-size: 24px; font-weight: 800;'>Booking Confirmed!</h1>
                    <p style='margin: 6px 0 0; opacity: 0.9; font-size: 14px;'>Thank you for choosing {site.SiteName}. Your reservation is secure.</p>
                </div>
                <div style='padding: 24px;'>
                    <div style='background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                        <div style='font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;'>Booking Reference</div>
                        <div style='font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 4px; font-family: monospace;'>{booking.Reference}</div>
                    </div>
                    <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;'>
                        <tr>
                            <td style='padding: 8px 0; color: #64748b; font-weight: 600;'>Tour Experience</td>
                            <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{tourTitle}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #64748b; font-weight: 600;'>Travel Date</td>
                            <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{travelDateStr}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #64748b; font-weight: 600;'>Travelers</td>
                            <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{booking.Travelers} ({booking.Adults} Adults, {booking.Children} Children)</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; color: #64748b; font-weight: 600;'>Passenger Name</td>
                            <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{booking.GuestName}</td>
                        </tr>
                        <tr style='border-top: 1px solid #e2e8f0;'>
                            <td style='padding: 12px 0 6px; color: #0f172a; font-size: 16px; font-weight: 800;'>Total Amount</td>
                            <td style='padding: 12px 0 6px; color: {site.PrimaryColor}; font-size: 18px; font-weight: 900; text-align: right;'>{totalFormatted}</td>
                        </tr>
                        <tr>
                            <td style='padding: 2px 0; color: #64748b; font-size: 12px;'>Payment Status</td>
                            <td style='padding: 2px 0; color: #16a34a; font-size: 12px; font-weight: 700; text-align: right; text-transform: uppercase;'>{booking.PaymentStatus}</td>
                        </tr>
                    </table>
                    <div style='background: #eff6ff; border-radius: 8px; padding: 12px; font-size: 13px; color: #1e40af;'>
                        You can view or manage this reservation anytime on <strong>{site.SiteName}</strong> web or mobile app using your Reference <strong>{booking.Reference}</strong>.
                    </div>
                </div>
            </div>";

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
                    Subject = $"Reservation Confirmed: {tourTitle} ({booking.Reference})",
                    IsBodyHtml = true,
                    Body = htmlBody
                };

                mail.To.Add(toEmail);
                await client.SendMailAsync(mail);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send booking confirmation email to {Email}", toEmail);
            }
        }

        _logger.LogInformation(
            "[DEBUG] [EMAIL-SERVICE] [BOOKING CONFIRMATION SENT]\n  To: {ToEmail}\n  Ref: {Reference}\n  Tour: {TourTitle}\n  Date: {TravelDate}\n  Total: {Total}\n  Website: {WebsiteName}",
            toEmail,
            booking.Reference,
            tourTitle,
            travelDateStr,
            totalFormatted,
            site.SiteName
        );
    }
}
