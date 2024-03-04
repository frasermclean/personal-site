using Grpc.Core;

namespace PersonalSite.Backend.Models;

public class AssessmentResult
{
    public string Action { get; }
    public string AssessmentName { get; }
    public bool IsSuccess => ErrorMessage is null;
    public string? ErrorMessage { get; }
    public float Score { get; }

    private AssessmentResult(string action, string assessmentName, string? errorMessage, float score)
    {
        Action = action;
        AssessmentName = assessmentName;
        ErrorMessage = errorMessage;
        Score = score;
    }

    public static AssessmentResult CreateSuccess(string action, string assessmentName, float score)
        => new(action, assessmentName, null, score);

    public static AssessmentResult CreateFailure(string action, string assessmentName, string errorMessage,
        float score = default) => new(action, assessmentName, errorMessage, score);
}