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
    Task<AssessmentResult> AssessActionAsync(string token, string siteKey, string action);
}

public class AssessmentService(
    IOptions<RecaptchaOptions> options,
    ILogger<AssessmentService> logger,
    RecaptchaEnterpriseServiceClient client)
    : IAssessmentService
{
    private readonly float scoreThreshold = options.Value.ScoreThreshold;
    private readonly string googleProjectId = options.Value.GoogleProjectId;

    public async Task<AssessmentResult> AssessActionAsync(string token, string siteKey, string action)
    {
        // create assessment request
        var request = new CreateAssessmentRequest
        {
            ParentAsProjectName = ProjectName.FromProject(googleProjectId),
            Assessment = new Assessment
            {
                Event = new Event
                {
                    Token = token, SiteKey = siteKey, ExpectedAction = action
                }
            }
        };

        Assessment assessment;
        try
        {
            assessment = await client.CreateAssessmentAsync(request);
        }
        catch (RpcException exception)
        {
            logger.LogError(exception, "RPC error occurred while creating assessment");
            return AssessmentResult.CreateFailure($"RPC error - {exception.Message}");
        }

        // ensure token is valid
        if (!assessment.TokenProperties.Valid)
        {
            logger.LogError("Token is invalid - {InvalidReason}", assessment.TokenProperties.InvalidReason);
            return AssessmentResult.CreateFailure($"Token is invalid - {assessment.TokenProperties.InvalidReason}");
        }

        // ensure expected action is executed
        if (assessment.TokenProperties.Action != action)
        {
            logger.LogError(
                "Invalid action was executed. Executed action: {ExecutedAction}, Expected action: {ExpectedAction}",
                assessment.TokenProperties.Action, action);
            return AssessmentResult.CreateFailure("Expected action mismatch");
        }

        // ensure score is above threshold
        return assessment.RiskAnalysis.Score >= scoreThreshold
            ? AssessmentResult.CreateSuccess(assessment.RiskAnalysis.Score)
            : AssessmentResult.CreateFailure("Score is below threshold", assessment.RiskAnalysis.Score);
    }
}