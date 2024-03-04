using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using PersonalSite.Backend.Contracts.Requests;
using PersonalSite.Backend.Options;

namespace PersonalSite.Backend.Services;

public interface IEmailSender
{
    Task SendEmailAsync(SendEmailRequest request, CancellationToken cancellationToken = default)
        => SendEmailAsync(request.FromName, request.FromAddress, request.Subject, request.Body, cancellationToken);

    Task SendEmailAsync(string fromName, string fromAddress, string subject, string body,
        CancellationToken cancellationToken = default);
}

public sealed class EmailSender(IOptions<EmailOptions> options, ILogger<EmailSender> logger) : IEmailSender, IDisposable
{
    private readonly EmailOptions options = options.Value;
    private readonly SmtpClient client = new();

    public async Task SendEmailAsync(string fromName, string fromAddress, string subject, string body,
        CancellationToken cancellationToken = default)
    {
        var message = CreateMessage(fromName, fromAddress, subject, body);
        await SendMessageAsync(message, cancellationToken);

        logger.LogInformation("Successfully sent email from {FromName} ({FromAddress})", fromName, fromAddress);
    }

    private MimeMessage CreateMessage(string fromName, string fromAddress, string subject, string body) => new()
    {
        To =
        {
            new MailboxAddress(options.RecipientName, options.RecipientAddress)
        },
        From =
        {
            new MailboxAddress(fromName, fromAddress)
        },
        Subject = subject,
        Body = new TextPart("plain")
        {
            Text = body
        }
    };

    private async Task SendMessageAsync(MimeMessage message, CancellationToken cancellationToken)
    {
        await client.ConnectAsync(options.Host, options.Port, SecureSocketOptions.SslOnConnect, cancellationToken);
        await client.AuthenticateAsync(options.Username, options.Password, cancellationToken);
        var response = await client.SendAsync(message, cancellationToken);

        logger.LogInformation("Received response from server: {Response}", response);

        await client.DisconnectAsync(true, cancellationToken);
    }

    public void Dispose()
    {
        client.Dispose();
    }
}