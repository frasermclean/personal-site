using Google.Api.Gax.ResourceNames;
using Google.Cloud.RecaptchaEnterprise.V1;
using Grpc.Core;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PersonalSite.Backend.Models;
using PersonalSite.Backend.Options;

namespace PersonalSite.Backend.Services;

public interface IAssessmentService
{
    Task<AssessmentResult> AssessActionAsync(string token, string siteKey, string expectedAction);
}

public class AssessmentService(
    IOptions<RecaptchaOptions> options,
    ILogger<AssessmentService> logger,
    RecaptchaEnterpriseServiceClient client)
    : IAssessmentService
{
    private readonly float scoreThreshold = options.Value.ScoreThreshold;
    private readonly string googleProjectId = options.Value.GoogleProjectId;

    public async Task<AssessmentResult> AssessActionAsync(string token, string siteKey, string expectedAction)
    {
        var request = CreateRequest(token, siteKey, expectedAction);

        try
        {
            var assessment = await client.CreateAssessmentAsync(request);
            return CreateResult(assessment, expectedAction);
        }
        catch (RpcException exception)
        {
            logger.LogError(exception, "RPC error occurred while creating assessment");
            var assessmentName = $"{nameof(RpcException)}-{Guid.NewGuid()}";
            return AssessmentResult.CreateFailure(expectedAction, assessmentName, $"RPC error - {exception.Message}");
        }
    }
    private CreateAssessmentRequest CreateRequest(string token, string siteKey, string expectedAction) => new()
    {
        ParentAsProjectName = ProjectName.FromProject(googleProjectId),
        Assessment = new Assessment
        {
            Event = new Event
            {
                Token = token, SiteKey = siteKey, ExpectedAction = expectedAction
            }
        }
    };

    private AssessmentResult CreateResult(Assessment assessment, string expectedAction)
    {
        // ensure token is valid
        if (!assessment.TokenProperties.Valid)
        {
            logger.LogError("Token is invalid - {InvalidReason}", assessment.TokenProperties.InvalidReason);
            return AssessmentResult.CreateFailure(expectedAction, assessment.Name,
                $"Token is invalid - {assessment.TokenProperties.InvalidReason}");
        }

        // ensure expected action is executed
        if (assessment.TokenProperties.Action != expectedAction)
        {
            logger.LogError(
                "Invalid action was executed. Executed action: {ExecutedAction}, Expected action: {ExpectedAction}",
                assessment.TokenProperties.Action, expectedAction);
            return AssessmentResult.CreateFailure(expectedAction, assessment.Name, "Expected action mismatch");
        }

        // ensure score is above threshold
        var isSuccess = assessment.RiskAnalysis.Score >= scoreThreshold;
        return isSuccess
            ? AssessmentResult.CreateSuccess(expectedAction, assessment.Name, assessment.RiskAnalysis.Score)
            : AssessmentResult.CreateFailure(expectedAction, assessment.Name, "Score is below threshold",
                assessment.RiskAnalysis.Score);
    }
}