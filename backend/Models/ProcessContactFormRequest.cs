namespace PersonalSite.Backend.Models;

public class ProcessContactFormRequest
{
    public ProcessContactFormEvent Event { get; init; } = new();
    public ProcessContactFormPayload Payload { get; init; } = new();
}