namespace PersonalSite.Backend.Options;

public class RecaptchaOptions
{
    public const string SectionName = "Recaptcha";

    public string GoogleProjectId { get; init; } = string.Empty;
    public float ScoreThreshold { get; init; }

}