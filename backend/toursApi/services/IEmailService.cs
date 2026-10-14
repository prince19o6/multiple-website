using System.Threading.Tasks;

namespace ToursApi.Services;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, string websiteHostname, string websiteName);
}
