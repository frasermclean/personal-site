namespace PersonalSite.Backend.Models;

public class ProcessContactFormPayload
{
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;

    public void Deconstruct(out string name, out string email, out string message)
    {
        name = Name;
        email = Email;
        message = Message;
    }
}