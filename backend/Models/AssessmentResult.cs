namespace PersonalSite.Backend.Models;

public class AssessmentResult
{
    public bool IsSuccess => ErrorMessage is null;
    public string? ErrorMessage { get; private init; }
    public float Score { get; private init; }

    private AssessmentResult()
    {
    }

    public static AssessmentResult CreateSuccess(float score) => new()
    {
        Score = score
    };

    public static AssessmentResult CreateFailure(string errorMessage, float score = default) => new()
    {
        ErrorMessage = errorMessage,
        Score = score,
    };
}