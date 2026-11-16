using System.Threading.Tasks;
using ToursApi.Models;

namespace ToursApi.Services;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, string websiteHostname, string websiteName);
    Task SendBookingConfirmationEmailAsync(Booking booking);
}
