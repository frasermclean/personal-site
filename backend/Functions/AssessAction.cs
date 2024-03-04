using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using PersonalSite.Backend.Contracts.Requests;
using PersonalSite.Backend.Services;

namespace PersonalSite.Backend.Functions;

public class AssessAction(
    ILogger<AssessAction> logger,
    IAssessmentService assessmentService,
    IAuditService auditService,
    IQueueDispatcher queueDispatcher)
{
    [Function(nameof(AssessAction))]
    public async Task<HttpResponseData> ExecuteAsync(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "assess-action")]
        HttpRequestData httpRequest,
        [FromBody] AssessActionRequest request,
        CancellationToken cancellationToken)
    {
        // perform action assessment
        var assessmentResult = await assessmentService.AssessActionAsync(request.Action, request.Token, cancellationToken);
        await auditService.LogAssessmentAsync(assessmentResult, cancellationToken);
        if (!assessmentResult.IsSuccess)
        {
            logger.LogError("Action assessment failed - {ErrorMessage}, Score: {Score}",
                assessmentResult.ErrorMessage, assessmentResult.Score);
            return httpRequest.CreateResponse(HttpStatusCode.BadRequest);
        }

        var sendEmailRequest = new SendEmailRequest
        {
            FromName = request.Payload["name"]?.ToString() ?? string.Empty,
            FromAddress = request.Payload["email"]?.ToString() ?? string.Empty,
            Subject = "Personal Site Contact Form",
            Body = request.Payload["message"]?.ToString() ?? string.Empty
        };

        // queue email dispatch
        await queueDispatcher.DispatchRequestAsync(sendEmailRequest, cancellationToken);

        return httpRequest.CreateResponse(HttpStatusCode.OK);
    }
}