using Microsoft.Azure.Functions.Worker;
using PersonalSite.Backend.Contracts.Requests;
using PersonalSite.Backend.Services;

namespace PersonalSite.Backend.Functions;

public class SendEmail(IEmailSender emailSender)
{
    [Function(nameof(SendEmail))]
    public async Task ExecuteAsync([QueueTrigger("email-outbox")] SendEmailRequest request)
    {
        await emailSender.SendEmailAsync(request);
    }
}