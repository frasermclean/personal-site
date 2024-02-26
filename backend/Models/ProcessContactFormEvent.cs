namespace PersonalSite.Backend.Models;

public class ProcessContactFormEvent
{
    public string Token { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string SiteKey { get; init; } = string.Empty;
}