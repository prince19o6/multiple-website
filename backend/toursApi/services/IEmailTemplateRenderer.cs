using System.Threading.Tasks;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Services;

public interface IEmailTemplateRenderer
{
    (string Html, string PlainText, string Subject) RenderCustomerBookingReceived(Booking booking, WebsiteConfig site);
    (string Html, string PlainText, string Subject) RenderCustomerBookingConfirmed(Booking booking, WebsiteConfig site, string webAppBaseUrl);
    (string Html, string PlainText, string Subject) RenderCustomerBookingRejected(Booking booking, string reason, WebsiteConfig site);
    (string Html, string PlainText, string Subject) RenderCustomerBookingCancelled(Booking booking, string reason, WebsiteConfig site);
    (string Html, string PlainText, string Subject) RenderCustomerBookingExpired(Booking booking, WebsiteConfig site);
    (string Html, string PlainText, string Subject) RenderCustomerCancellationRequestReceived(Booking booking, string reason, WebsiteConfig site);
    (string Html, string PlainText, string Subject) RenderAdminNewBookingAlert(Booking booking, WebsiteConfig site, string approveUrl, string rejectUrl);
    (string Html, string PlainText, string Subject) RenderAdminCancellationRequestAlert(Booking booking, string reason, WebsiteConfig site, string inboxUrl);

    // ─── Authentication Emails ──────────────────────────────────────────
    (string Html, string PlainText, string Subject) RenderCustomerWelcomeAndVerify(User user, string verifyUrl, WebsiteConfig site);
    (string Html, string PlainText, string Subject) RenderCustomerPasswordReset(User user, string resetUrl, WebsiteConfig site);
    (string Html, string PlainText, string Subject) RenderCustomerPasswordChanged(User user, WebsiteConfig site);
}

