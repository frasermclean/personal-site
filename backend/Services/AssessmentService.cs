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
            logger.LogError(exception, "Error creating assessment");
            return false;
        }

        if (!assessment.TokenProperties.Valid)
        {
            logger.LogError("Token is invalid");
            return false;
        }

        return assessment.RiskAnalysis.Score >= scoreThreshold;
    }
}