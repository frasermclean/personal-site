using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using PersonalSite.Backend.Models;
using PersonalSite.Backend.Services;

namespace PersonalSite.Backend.Functions;

public class AssessAction(ILogger<AssessAction> logger, IAssessmentService assessmentService)
{
    [Function(nameof(AssessAction))]
    public async Task<HttpResponseData> ExecuteAsync(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "assess-action")]
        HttpRequestData request,
        [FromBody] ProcessContactFormRequest body)
    {
        var (token, action, siteKey) = body.Event;
        var isValid = await assessmentService.AssessActionAsync(token, siteKey, action);

        return isValid
            ? request.CreateResponse(HttpStatusCode.OK)
            : request.CreateResponse(HttpStatusCode.BadRequest);
    }
}