using System;
using System.Net;
using System.Text;
using ToursApi.Configuration;
using ToursApi.Models;

namespace ToursApi.Services;

public class EmailTemplateRenderer : IEmailTemplateRenderer
{
    private static string Escape(string? input) => WebUtility.HtmlEncode(input ?? string.Empty);

    private static string BuildBaseLayout(
        WebsiteConfig site,
        string headerTitle,
        string headerSubtitle,
        string contentBody,
        string? badgeText = null)
    {
        var primary = !string.IsNullOrWhiteSpace(site.PrimaryColor) ? site.PrimaryColor : "#2563eb";
        var logoHtml = !string.IsNullOrWhiteSpace(site.LogoUrl)
            ? $"<img src='{site.LogoUrl}' alt='{Escape(site.SiteName)}' style='max-height: 38px; max-width: 180px; display: block; margin-bottom: 12px;' />"
            : $"<div style='font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em; margin-bottom: 8px;'>{Escape(site.SiteName)}</div>";

        var badgeHtml = !string.IsNullOrWhiteSpace(badgeText)
            ? $"<span style='display: inline-block; background: rgba(255,255,255,0.22); color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;'>{Escape(badgeText)}</span>"
            : "";

        return $@"<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>{Escape(headerTitle)}</title>
</head>
<body style='margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;'>
    <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0' style='background-color: #f1f5f9; padding: 24px 12px;'>
        <tr>
            <td align='center'>
                <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0' style='max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06); border: 1px solid #e2e8f0;'>
                    <!-- Brand Header -->
                    <tr>
                        <td style='background: {primary}; padding: 32px 28px; text-align: left;'>
                            {logoHtml}
                            {badgeHtml}
                            <h1 style='margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; line-height: 1.3;'>{Escape(headerTitle)}</h1>
                            <p style='margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;'>{Escape(headerSubtitle)}</p>
                        </td>
                    </tr>
                    <!-- Main Body Content -->
                    <tr>
                        <td style='padding: 28px;'>
                            {contentBody}
                        </td>
                    </tr>
                    <!-- Brand Footer -->
                    <tr>
                        <td style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;'>
                            <div style='font-weight: 700; color: #0f172a; margin-bottom: 4px;'>{Escape(site.SiteName)} Concierge Desk</div>
                            <div>Support: <a href='mailto:{Escape(site.SupportContact)}' style='color: {primary}; text-decoration: none;'>{Escape(site.SupportContact)}</a> {(!string.IsNullOrWhiteSpace(site.SupportPhone) ? $"• {Escape(site.SupportPhone)}" : "")}</div>
                            <div style='margin-top: 8px; color: #94a3b8;'>© {DateTime.UtcNow.Year} {Escape(site.SiteName)}. All rights reserved. Operating under {Escape(site.CanonicalHostname)}.</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
    }

    private static string FormatPrice(Booking b, WebsiteConfig site)
    {
        var sym = !string.IsNullOrWhiteSpace(b.Snapshot?.Currency) ? b.Snapshot.Currency : site.CurrencySymbol;
        return $"{sym}{b.TotalPrice:N2}";
    }

    private static string FormatTravelDate(Booking b)
    {
        var d = b.TravelDate != default ? b.TravelDate : b.StartDate;
        return d != default ? d.ToString("dddd, dd MMMM yyyy") : "Dates to be confirmed";
    }

    // ─── 1. Customer: Booking Received (Pending Approval) ────────────────────────
    public (string Html, string PlainText, string Subject) RenderCustomerBookingReceived(Booking booking, WebsiteConfig site)
    {
        var subject = $"Booking Received (Pending Confirmation): {booking.Snapshot?.Title ?? booking.TourName} [{booking.Reference}]";
        var travelDate = FormatTravelDate(booking);
        var price = FormatPrice(booking, site);
        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        var body = $@"
            <div style='background-color: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                <div style='font-size: 12px; font-weight: 800; color: #854d0e; text-transform: uppercase; letter-spacing: 0.05em;'>Current Status: Pending Review</div>
                <div style='color: #713f12; font-size: 13px; margin-top: 4px;'>
                    Your reservation has been received and is currently being reviewed by our travel concierge. You will receive a confirmation email with your official e-ticket and QR check-in code once approved.
                </div>
            </div>

            <div style='background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;'>
                <div style='font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em;'>Booking Reference</div>
                <div style='font-size: 24px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 4px;'>{Escape(booking.Reference)}</div>
            </div>

            <table width='100%' cellspacing='0' cellpadding='0' border='0' style='margin-bottom: 24px; font-size: 14px;'>
                <tr>
                    <td style='padding: 8px 0; color: #64748b;'>Tour Package</td>
                    <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(tourTitle)}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #64748b;'>Departure Date</td>
                    <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(travelDate)}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #64748b;'>Travelers</td>
                    <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{booking.Travelers} ({booking.Adults} Adults, {booking.Children} Children)</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #64748b;'>Lead Guest</td>
                    <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(booking.GuestName)}</td>
                </tr>
                <tr style='border-top: 1px solid #e2e8f0;'>
                    <td style='padding: 12px 0; color: #0f172a; font-weight: 800; font-size: 16px;'>Total Amount</td>
                    <td style='padding: 12px 0; color: {site.PrimaryColor}; font-weight: 900; font-size: 18px; text-align: right;'>{Escape(price)}</td>
                </tr>
            </table>

            <div style='background: #eff6ff; border-radius: 10px; padding: 14px; font-size: 13px; color: #1e40af; line-height: 1.5;'>
                <strong>Next Step:</strong> Our team reviews bookings promptly. Keep your reference <code>{Escape(booking.Reference)}</code> handy. You can check current status anytime on <strong>{Escape(site.SiteName)}</strong> web or app under <em>My Bookings</em>.
            </div>";

        var html = BuildBaseLayout(site, "Booking Request Received", $"Thank you for booking with {site.SiteName}", body, "Status: Pending");

        var plainText = $@"Booking Request Received - {site.SiteName}
Status: Pending Review
Reference: {booking.Reference}
Tour: {tourTitle}
Travel Date: {travelDate}
Travelers: {booking.Travelers}
Total: {price}

Your booking is currently pending review by our concierge. You will receive an official confirmation email once approved.
Support Contact: {site.SupportContact}";

        return (html, plainText, subject);
    }

    // ─── 2. Customer: Booking Confirmed (With E-Ticket Link & Policy) ─────────────
    public (string Html, string PlainText, string Subject) RenderCustomerBookingConfirmed(Booking booking, WebsiteConfig site, string webAppBaseUrl)
    {
        var subject = $"Booking Confirmed: {booking.Snapshot?.Title ?? booking.TourName} [{booking.Reference}]";
        var travelDate = FormatTravelDate(booking);
        var price = FormatPrice(booking, site);
        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;
        var voucherUrl = $"{webAppBaseUrl.TrimEnd('/')}/booking/confirmation?ref={Uri.EscapeDataString(booking.Reference)}";

        var body = $@"
            <div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                <div style='font-size: 12px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em;'>✓ Reservation Confirmed</div>
                <div style='color: #166534; font-size: 13px; margin-top: 4px;'>
                    Great news! Your booking has been confirmed by our operations team. Your digital boarding pass and QR check-in ticket are now unlocked.
                </div>
            </div>

            <div style='background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;'>
                <div style='font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em;'>Confirmed Reference Code</div>
                <div style='font-size: 26px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 4px;'>{Escape(booking.Reference)}</div>
            </div>

            <table width='100%' cellspacing='0' cellpadding='0' border='0' style='margin-bottom: 24px; font-size: 14px;'>
                <tr>
                    <td style='padding: 8px 0; color: #64748b;'>Tour Experience</td>
                    <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(tourTitle)}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #64748b;'>Departure Date</td>
                    <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(travelDate)}</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #64748b;'>Travelers</td>
                    <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{booking.Travelers} ({booking.Adults} Adults, {booking.Children} Children)</td>
                </tr>
                <tr>
                    <td style='padding: 8px 0; color: #64748b;'>Destination</td>
                    <td style='padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(booking.Snapshot?.Destination ?? booking.Destination ?? "")}</td>
                </tr>
                <tr style='border-top: 1px solid #e2e8f0;'>
                    <td style='padding: 12px 0; color: #0f172a; font-weight: 800; font-size: 16px;'>Total Paid/Committed</td>
                    <td style='padding: 12px 0; color: {site.PrimaryColor}; font-weight: 900; font-size: 18px; text-align: right;'>{Escape(price)}</td>
                </tr>
            </table>

            <!-- E-Ticket Button CTA -->
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{voucherUrl}' style='background-color: {site.PrimaryColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>
                    View & Print Official E-Ticket Voucher →
                </a>
            </div>

            <!-- Cancellation Policy Note -->
            {(!string.IsNullOrWhiteSpace(site.CancellationPolicy) ? $@"
            <div style='background-color: #f8fafc; border-left: 3px solid {site.PrimaryColor}; border-radius: 4px; padding: 12px 16px; margin-top: 24px; font-size: 12px; color: #475569;'>
                <strong style='color: #0f172a;'>Cancellation Policy:</strong> {Escape(site.CancellationPolicy)}
            </div>" : "")}";

        var html = BuildBaseLayout(site, "Reservation Confirmed!", "Your journey is officially scheduled", body, "Status: Confirmed");

        var plainText = $@"Reservation Confirmed! - {site.SiteName}
Reference: {booking.Reference}
Tour: {tourTitle}
Travel Date: {travelDate}
Travelers: {booking.Travelers}
Total: {price}

Your e-ticket voucher with QR check-in is ready:
{voucherUrl}

Cancellation Policy: {site.CancellationPolicy}
Support: {site.SupportContact}";

        return (html, plainText, subject);
    }

    // ─── 3. Customer: Booking Rejected ───────────────────────────────────────────
    public (string Html, string PlainText, string Subject) RenderCustomerBookingRejected(Booking booking, string reason, WebsiteConfig site)
    {
        var subject = $"Update regarding your reservation: {booking.Reference}";
        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        var body = $@"
            <div style='background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                <div style='font-size: 12px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.05em;'>Reservation Could Not Be Confirmed</div>
                <div style='color: #7f1d1d; font-size: 13px; margin-top: 4px;'>
                    We regret to inform you that your booking for <strong>{Escape(tourTitle)}</strong> (Ref: <code>{Escape(booking.Reference)}</code>) could not be approved.
                </div>
            </div>

            <div style='margin-bottom: 24px; font-size: 14px;'>
                <div style='font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;'>Reason for Decision</div>
                <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; color: #0f172a; font-weight: 600; line-height: 1.5;'>
                    {Escape(reason)}
                </div>
            </div>

            <div style='font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 24px;'>
                <strong style='color: #0f172a;'>What happens next:</strong>
                <ul style='margin: 8px 0 0; padding-left: 20px;'>
                    <li>If any payment was authorized or captured, a full refund will be processed to your original payment method within 3–5 business days.</li>
                    <li>No cancellation fees apply to rejected requests.</li>
                    <li>Our concierge desk would be delighted to recommend alternative departure dates or similar packages.</li>
                </ul>
            </div>

            <div style='background-color: #eff6ff; border-radius: 8px; padding: 14px; font-size: 13px; color: #1e40af;'>
                Need assistance or have questions? Contact our dedicated support team at <a href='mailto:{Escape(site.SupportContact)}' style='color: #1d4ed8; font-weight: 700;'>{Escape(site.SupportContact)}</a>.
            </div>";

        var html = BuildBaseLayout(site, "Reservation Status Update", "Your booking could not be confirmed", body, "Status: Rejected");

        var plainText = $@"Reservation Status Update - {site.SiteName}
Reference: {booking.Reference}
Tour: {tourTitle}
Status: Rejected

Reason: {reason}

If any funds were charged, a full refund will be processed within 3-5 business days.
Contact us at {site.SupportContact} for assistance.";

        return (html, plainText, subject);
    }

    // ─── 4. Customer: Booking Cancelled ──────────────────────────────────────────
    public (string Html, string PlainText, string Subject) RenderCustomerBookingCancelled(Booking booking, string reason, WebsiteConfig site)
    {
        var subject = $"Booking Cancelled: {booking.Reference} - {site.SiteName}";
        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        var body = $@"
            <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                <div style='font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;'>Reservation Cancelled</div>
                <div style='color: #0f172a; font-size: 14px; margin-top: 4px;'>
                    Your reservation for <strong>{Escape(tourTitle)}</strong> (Ref: <code>{Escape(booking.Reference)}</code>) has been successfully cancelled.
                </div>
            </div>

            <div style='margin-bottom: 24px;'>
                <div style='font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;'>Cancellation Note / Reason</div>
                <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; color: #0f172a; font-size: 13px;'>
                    {Escape(reason)}
                </div>
            </div>

            <div style='font-size: 13px; color: #475569; line-height: 1.6;'>
                Any refund eligibility is determined according to our cancellation policy: <em>{Escape(site.CancellationPolicy)}</em>. Please allow 3–5 banking days for processing.
            </div>";

        var html = BuildBaseLayout(site, "Reservation Cancelled", "Your booking has been cancelled", body, "Status: Cancelled");

        var plainText = $@"Booking Cancelled - {site.SiteName}
Reference: {booking.Reference}
Tour: {tourTitle}
Reason: {reason}
Policy: {site.CancellationPolicy}
Support: {site.SupportContact}";

        return (html, plainText, subject);
    }

    // ─── 5. Customer: Booking Expired ────────────────────────────────────────────
    public (string Html, string PlainText, string Subject) RenderCustomerBookingExpired(Booking booking, WebsiteConfig site)
    {
        var subject = $"Booking Request Expired: {booking.Reference}";
        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        var body = $@"
            <div style='background-color: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                <div style='font-size: 12px; font-weight: 800; color: #854d0e; text-transform: uppercase;'>Request Window Expired</div>
                <div style='color: #713f12; font-size: 13px; margin-top: 4px;'>
                    Your booking request for <strong>{Escape(tourTitle)}</strong> (Ref: <code>{Escape(booking.Reference)}</code>) was not confirmed within the {site.PendingExpiryHours}-hour reservation window and has automatically expired.
                </div>
            </div>

            <p style='font-size: 13px; color: #475569; line-height: 1.6;'>
                No charges have been finalized. If you still wish to join this expedition, please submit a new reservation on our website or contact our desk directly to secure your slot.
            </p>";

        var html = BuildBaseLayout(site, "Booking Request Expired", "Reservation window has elapsed", body, "Status: Expired");

        var plainText = $@"Booking Request Expired - {site.SiteName}
Reference: {booking.Reference}
Tour: {tourTitle}
Your booking request has expired because it was not confirmed within {site.PendingExpiryHours} hours. No charges were captured.
Visit {site.CanonicalHostname} to re-book.";

        return (html, plainText, subject);
    }

    // ─── 6. Customer: Cancellation Request Received ──────────────────────────────
    public (string Html, string PlainText, string Subject) RenderCustomerCancellationRequestReceived(Booking booking, string reason, WebsiteConfig site)
    {
        var subject = $"Cancellation Request Received: {booking.Reference}";
        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        var body = $@"
            <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                <div style='font-size: 12px; font-weight: 800; color: #1e40af; text-transform: uppercase;'>Cancellation Request Under Review</div>
                <div style='color: #1e3a8a; font-size: 13px; margin-top: 4px;'>
                    We have received your request to cancel reservation <code>{Escape(booking.Reference)}</code> for <strong>{Escape(tourTitle)}</strong>.
                </div>
            </div>

            <div style='margin-bottom: 20px; font-size: 13px;'>
                <strong>Your Reason:</strong> {Escape(reason)}
            </div>

            <p style='font-size: 13px; color: #475569; line-height: 1.6;'>
                Our concierge desk will review your request against the booking policy within 24 hours. We will email you immediately once reviewed.
            </p>";

        var html = BuildBaseLayout(site, "Cancellation Request Received", "Review in progress", body, "Status: Under Review");

        var plainText = $@"Cancellation Request Received - {site.SiteName}
Reference: {booking.Reference}
Tour: {tourTitle}
Reason: {reason}
Our team will review your request within 24 hours.";

        return (html, plainText, subject);
    }

    // ─── 7. Admin: New Booking Alert With Action Buttons ─────────────────────────
    public (string Html, string PlainText, string Subject) RenderAdminNewBookingAlert(
        Booking booking,
        WebsiteConfig site,
        string approveUrl,
        string rejectUrl)
    {
        var subject = $"[ACTION REQUIRED] New Booking {booking.Reference} - {booking.GuestName} ({FormatPrice(booking, site)})";
        var travelDate = FormatTravelDate(booking);
        var price = FormatPrice(booking, site);
        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;

        var body = $@"
            <div style='background-color: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                <div style='font-size: 12px; font-weight: 800; color: #854d0e; text-transform: uppercase;'>Action Required: New Reservation Request</div>
                <div style='color: #713f12; font-size: 13px; margin-top: 4px;'>
                    A new customer booking requires administrative review and approval. Please confirm or reject this booking.
                </div>
            </div>

            <table width='100%' cellspacing='0' cellpadding='0' border='0' style='margin-bottom: 24px; font-size: 14px;'>
                <tr>
                    <td style='padding: 6px 0; color: #64748b;'>Reference</td>
                    <td style='padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right; font-family: monospace;'>{Escape(booking.Reference)}</td>
                </tr>
                <tr>
                    <td style='padding: 6px 0; color: #64748b;'>Lead Guest</td>
                    <td style='padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(booking.GuestName)} ({Escape(booking.Email)})</td>
                </tr>
                <tr>
                    <td style='padding: 6px 0; color: #64748b;'>Phone</td>
                    <td style='padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(booking.Phone)}</td>
                </tr>
                <tr>
                    <td style='padding: 6px 0; color: #64748b;'>Tour</td>
                    <td style='padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(tourTitle)}</td>
                </tr>
                <tr>
                    <td style='padding: 6px 0; color: #64748b;'>Travel Date</td>
                    <td style='padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;'>{Escape(travelDate)}</td>
                </tr>
                <tr>
                    <td style='padding: 6px 0; color: #64748b;'>Guests</td>
                    <td style='padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;'>{booking.Travelers} ({booking.Adults}A, {booking.Children}C)</td>
                </tr>
                <tr>
                    <td style='padding: 6px 0; color: #64748b;'>Source</td>
                    <td style='padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right; text-transform: uppercase;'>{Escape(booking.Source)}</td>
                </tr>
                <tr style='border-top: 1px solid #e2e8f0;'>
                    <td style='padding: 10px 0; color: #0f172a; font-weight: 800; font-size: 15px;'>Total Amount</td>
                    <td style='padding: 10px 0; color: {site.PrimaryColor}; font-weight: 900; font-size: 17px; text-align: right;'>{Escape(price)}</td>
                </tr>
            </table>

            <!-- Decision Action Buttons -->
            <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;'>
                <div style='font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 14px;'>Admin Quick Decision Links (Expires in 48h)</div>
                <table role='presentation' width='100%' cellspacing='0' cellpadding='0' border='0'>
                    <tr>
                        <td align='center' style='padding-right: 8px;'>
                            <a href='{approveUrl}' style='background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px; display: inline-block; width: 80%; text-align: center;'>
                                ✓ Approve & Confirm
                            </a>
                        </td>
                        <td align='center' style='padding-left: 8px;'>
                            <a href='{rejectUrl}' style='background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px; display: inline-block; width: 80%; text-align: center;'>
                                ✕ Reject with Reason
                            </a>
                        </td>
                    </tr>
                </table>
                <div style='color: #64748b; font-size: 11px; margin-top: 12px;'>
                    Note: Clicking a link opens a secure confirmation page on {Escape(site.SiteName)}. No data changes automatically upon link prefetch.
                </div>
            </div>";

        var html = BuildBaseLayout(site, "New Booking Request", $"Website: {site.SiteName}", body, "Action Required");

        var plainText = $@"[ACTION REQUIRED] New Booking Request - {site.SiteName}
Reference: {booking.Reference}
Guest: {booking.GuestName} ({booking.Email}, {booking.Phone})
Tour: {tourTitle}
Travel Date: {travelDate}
Travelers: {booking.Travelers}
Total: {price}

To Approve this booking:
{approveUrl}

To Reject this booking:
{rejectUrl}

Links expire in 48 hours.";

        return (html, plainText, subject);
    }

    // ─── 8. Admin: Customer Cancellation Request ─────────────────────────────────
    public (string Html, string PlainText, string Subject) RenderAdminCancellationRequestAlert(
        Booking booking,
        string reason,
        WebsiteConfig site,
        string inboxUrl)
    {
        var subject = $"[CANCELLATION REQUEST] {booking.Reference} - {booking.GuestName}";
        var tourTitle = booking.Snapshot?.Title ?? booking.TourName;
        var price = FormatPrice(booking, site);

        var body = $@"
            <div style='background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px;'>
                <div style='font-size: 12px; font-weight: 800; color: #b91c1c; text-transform: uppercase;'>Customer Cancellation Request</div>
                <div style='color: #7f1d1d; font-size: 13px; margin-top: 4px;'>
                    Customer <strong>{Escape(booking.GuestName)}</strong> has requested to cancel reservation <code>{Escape(booking.Reference)}</code>.
                </div>
            </div>

            <div style='margin-bottom: 20px; font-size: 13px;'>
                <strong>Reason Provided:</strong>
                <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 6px; color: #0f172a;'>
                    {Escape(reason)}
                </div>
            </div>

            <div style='text-align: center; margin: 24px 0;'>
                <a href='{inboxUrl}' style='background-color: {site.PrimaryColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px; display: inline-block;'>
                    Open Booking in Admin Inbox →
                </a>
            </div>";

        var html = BuildBaseLayout(site, "Customer Cancellation Request", $"Website: {site.SiteName}", body, "Action Required");

        var plainText = $@"[CANCELLATION REQUEST] {booking.Reference} - {site.SiteName}
Guest: {booking.GuestName} ({booking.Email})
Tour: {tourTitle}
Total: {price}
Reason: {reason}

Open Inbox: {inboxUrl}";

        return (html, plainText, subject);
    }

    public (string Html, string PlainText, string Subject) RenderCustomerWelcomeAndVerify(
        User user, string verifyUrl, WebsiteConfig site)
    {
        var subject = $"Welcome to {site.SiteName} - Please verify your email address";
        var primary = !string.IsNullOrWhiteSpace(site.PrimaryColor) ? site.PrimaryColor : "#0d9488";
        var name = !string.IsNullOrWhiteSpace(user.FullName) ? user.FullName : user.Name;

        var body = $@"
            <div style='margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #334155;'>
                <p style='margin-top: 0;'>Hello <strong>{Escape(name)}</strong>,</p>
                <p>Thank you for creating an account with <strong>{Escape(site.SiteName)}</strong>. To activate all platform features, track your reservations, and unlock your personalized boarding passes, please verify your email address.</p>
            </div>

            <div style='text-align: center; margin: 32px 0;'>
                <a href='{verifyUrl}' style='background-color: {primary}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block; letter-spacing: 0.02em;'>
                    Verify My Email Address →
                </a>
            </div>

            <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 28px; font-size: 12px; color: #64748b; line-height: 1.5;'>
                <p style='margin: 0;'><strong>Security note:</strong> For your protection, clicking the link opens a secure confirmation page where you will confirm verification. This verification link expires in 24 hours.</p>
                <p style='margin: 8px 0 0;'>If button does not work, copy and paste this link into your browser:<br/><span style='color: {primary}; word-break: break-all;'>{Escape(verifyUrl)}</span></p>
            </div>";

        var html = BuildBaseLayout(site, "Welcome to " + site.SiteName, "Please confirm your email address", body, "Email Verification");

        var plainText = $@"Welcome to {site.SiteName}!

Hello {name},

Thank you for registering. Please verify your email address using the following link:
{verifyUrl}

This link is valid for 24 hours.

Best regards,
The {site.SiteName} Team";

        return (html, plainText, subject);
    }

    public (string Html, string PlainText, string Subject) RenderCustomerPasswordReset(
        User user, string resetUrl, WebsiteConfig site)
    {
        var subject = $"Reset your password for {site.SiteName}";
        var primary = !string.IsNullOrWhiteSpace(site.PrimaryColor) ? site.PrimaryColor : "#0d9488";
        var name = !string.IsNullOrWhiteSpace(user.FullName) ? user.FullName : user.Name;

        var body = $@"
            <div style='margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #334155;'>
                <p style='margin-top: 0;'>Hello <strong>{Escape(name)}</strong>,</p>
                <p>We received a request to reset the password for your <strong>{Escape(site.SiteName)}</strong> account.</p>
                <p>Click the button below to choose a new password. For security, this link is single-use and expires in <strong>30 minutes</strong>.</p>
            </div>

            <div style='text-align: center; margin: 32px 0;'>
                <a href='{resetUrl}' style='background-color: {primary}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; display: inline-block;'>
                    Reset My Password →
                </a>
            </div>

            <div style='background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 16px; margin-top: 28px; font-size: 12px; color: #991b1b; line-height: 1.5;'>
                <p style='margin: 0;'><strong>Didn't request this change?</strong> You can safely ignore this email. Your current password remains completely unchanged and secure.</p>
            </div>";

        var html = BuildBaseLayout(site, "Password Reset Request", $"Account: {user.Email}", body, "Security");

        var plainText = $@"Password Reset Request - {site.SiteName}

Hello {name},

We received a request to reset your password. Use the link below to set a new password:
{resetUrl}

This link expires in 30 minutes. If you did not request this, you can ignore this email.

{site.SiteName} Support";

        return (html, plainText, subject);
    }

    public (string Html, string PlainText, string Subject) RenderCustomerPasswordChanged(
        User user, WebsiteConfig site)
    {
        var subject = $"Security Notice: Password changed for {site.SiteName}";
        var name = !string.IsNullOrWhiteSpace(user.FullName) ? user.FullName : user.Name;

        var body = $@"
            <div style='margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #334155;'>
                <p style='margin-top: 0;'>Hello <strong>{Escape(name)}</strong>,</p>
                <p>Your password for <strong>{Escape(site.SiteName)}</strong> was successfully changed on {DateTime.UtcNow:MMMM dd, yyyy 'at' HH:mm} UTC.</p>
                <p>All previous active login sessions across your devices have been signed out for your safety.</p>
            </div>

            <div style='background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 16px; font-size: 12px; color: #991b1b; line-height: 1.5;'>
                <p style='margin: 0;'><strong>Wasn't you?</strong> If you did not make this change, please contact our 24/7 security concierge immediately at <a href='mailto:{Escape(site.ContactEmail)}' style='color: #b91c1c; font-weight: bold;'>{Escape(site.ContactEmail)}</a>.</p>
            </div>";

        var html = BuildBaseLayout(site, "Password Changed", "Security Notice", body, "Account Security");

        var plainText = $@"Security Notice: Password Changed - {site.SiteName}

Hello {name},

Your password for {site.SiteName} has been successfully changed.
All previous active sessions have been signed out.

If you did not perform this change, contact us immediately at {site.ContactEmail}.

{site.SiteName} Security";

        return (html, plainText, subject);
    }
}
