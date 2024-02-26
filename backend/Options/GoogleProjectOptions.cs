namespace PersonalSite.Backend.Options;

public class GoogleProjectOptions
{
    public const string SectionName = "GoogleProject";

    public string ProjectId { get; init; } = string.Empty;
    public string PrivateKeyId { get; init; } = string.Empty;
    public string PrivateKey { get; init; } = string.Empty;
    public string ClientEmail { get; init; } = string.Empty;
    public string ClientId { get; init; } = string.Empty;
    public string TokenUrl { get; init; } = string.Empty;
}