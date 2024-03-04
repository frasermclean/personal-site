using System.Text.Json.Nodes;

namespace PersonalSite.Backend.Contracts.Requests;

public class AssessActionRequest
{
    public string Action { get; init; } = string.Empty;
    public string Token { get; init; } = string.Empty;
    public JsonObject Payload { get; init; } = new();
}