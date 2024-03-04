namespace PersonalSite.Backend.Contracts.Requests;

public class SendEmailRequest
{
    public string FromName { get; init; } = string.Empty;
    public string FromAddress { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
}