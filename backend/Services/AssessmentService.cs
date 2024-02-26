using Google.Api.Gax.ResourceNames;
using Google.Cloud.RecaptchaEnterprise.V1;
using Grpc.Core;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PersonalSite.Backend.Options;

namespace PersonalSite.Backend.Services;

public interface IAssessmentService
{
    Task<bool> AssessActionAsync(string token, string siteKey, string action);
}

public class AssessmentService(
    IOptions<AssessmentServiceOptions> options,
    ILogger<AssessmentService> logger,
    RecaptchaEnterpriseServiceClientProvider clientProvider)
    : IAssessmentService
{
    private readonly float scoreThreshold = options.Value.ScoreThreshold;
    private readonly RecaptchaEnterpriseServiceClient client = clientProvider.CreateClient();

    public async Task<bool> AssessActionAsync(string token, string siteKey, string action)
    {
        // create assessment request
        var request = new CreateAssessmentRequest
        {
            ParentAsProjectName = ProjectName.FromProject(clientProvider.ProjectId),
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
            return false;
        }

        // ensure token is valid
        if (!assessment.TokenProperties.Valid)
        {
            logger.LogError("Token is invalid - {InvalidReason}", assessment.TokenProperties.InvalidReason);
            return false;
        }

        // ensure expected action is executed
        if (assessment.TokenProperties.Action != action)
        {
            logger.LogError(
                "Invalid action was executed. Executed action: {ExecutedAction}, Expected action: {ExpectedAction}",
                assessment.TokenProperties.Action, action);
            return false;
        }

        // ensure score is above threshold
        var hasPassed = assessment.RiskAnalysis.Score >= scoreThreshold;
        if (!hasPassed)
        {
            logger.LogWarning("Assessment failed. Score: {Score}, Threshold: {Threshold}",
                assessment.RiskAnalysis.Score, scoreThreshold);
        }

        return hasPassed;
    }
}