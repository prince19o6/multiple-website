using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ToursApi.Configuration;

namespace ToursApi.Services;

/// <summary>
/// Development mail catcher that persists rendered HTML emails to a local `dev-emails/` directory
/// and writes a highlighted summary to the console for instantaneous local validation.
/// </summary>
public class DevFileEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DevFileEmailSender> _logger;
    private readonly string _outputFolder;

    public string ProviderName => "Dev";

    public DevFileEmailSender(IConfiguration configuration, ILogger<DevFileEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;

        var relativeFolder = _configuration["Email:DevEmailFolder"] ?? "dev-emails";
        _outputFolder = Path.IsPathRooted(relativeFolder)
            ? relativeFolder
            : Path.Combine(AppContext.BaseDirectory, relativeFolder);

        try
        {
            if (!Directory.Exists(_outputFolder))
            {
                Directory.CreateDirectory(_outputFolder);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create dev-emails output directory at {Folder}", _outputFolder);
        }
    }

    public async Task SendAsync(EmailMessage message, WebsiteConfig siteConfig, CancellationToken cancellationToken = default)
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss_fff");
        var safeRecipient = message.ToEmail.Replace("@", "_at_").Replace(".", "_");
        var safeSubject = string.Concat(message.Subject.Split(Path.GetInvalidFileNameChars())).Replace(" ", "_");
        if (safeSubject.Length > 40) safeSubject = safeSubject[..40];

        var fileName = $"{timestamp}_{siteConfig.WebsiteId}_{safeRecipient}_{safeSubject}.html";
        var filePath = Path.Combine(_outputFolder, fileName);

        var fileContent = new StringBuilder();
        fileContent.AppendLine("<!-- ======================================================= -->");
        fileContent.AppendLine($"<!-- TO: {message.ToName} <{message.ToEmail}> -->");
        fileContent.AppendLine($"<!-- FROM: {siteConfig.EmailFromName} <{siteConfig.EmailFromAddress}> -->");
        fileContent.AppendLine($"<!-- REPLY-TO: {siteConfig.ReplyToEmail} -->");
        fileContent.AppendLine($"<!-- SUBJECT: {message.Subject} -->");
        fileContent.AppendLine($"<!-- WEBSITE: {siteConfig.SiteName} ({siteConfig.WebsiteId}) -->");
        fileContent.AppendLine($"<!-- GENERATED_UTC: {DateTime.UtcNow:O} -->");
        fileContent.AppendLine("<!-- ======================================================= -->");
        fileContent.AppendLine();
        fileContent.AppendLine(message.HtmlBody);

        await File.WriteAllTextAsync(filePath, fileContent.ToString(), Encoding.UTF8, cancellationToken);

        _logger.LogInformation(
            "\n[DEV-EMAIL-SENT]\n  Website: {Website}\n  To: {ToEmail} ({ToName})\n  From: {FromEmail}\n  Subject: {Subject}\n  Saved to File: {FilePath}\n",
            siteConfig.SiteName,
            message.ToEmail,
            message.ToName,
            siteConfig.EmailFromAddress,
            message.Subject,
            filePath
        );
    }
}
