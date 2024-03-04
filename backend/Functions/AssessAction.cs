using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using PersonalSite.Backend.Models;
using PersonalSite.Backend.Services;

namespace PersonalSite.Backend.Functions;

public class AssessAction(
    ILogger<AssessAction> logger,
    IAssessmentService assessmentService,
    IAuditService auditService,
    IEmailSender emailSender)
{
    [Function(nameof(AssessAction))]
    public async Task<HttpResponseData> ExecuteAsync(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "assess-action")]
        HttpRequestData request,
        [FromBody] ProcessContactFormRequest body,
        CancellationToken cancellationToken)
    {
        // perform action assessment
        var (token, action, siteKey) = body.Event;
        var assessmentResult = await assessmentService.AssessActionAsync(token, siteKey, action);
        await auditService.LogAssessmentAsync(assessmentResult, cancellationToken);
        if (!assessmentResult.IsSuccess)
        {
            logger.LogError("Action assessment failed - {ErrorMessage}, Score: {Score}",
                assessmentResult.ErrorMessage, assessmentResult.Score);
            return request.CreateResponse(HttpStatusCode.BadRequest);
        }

        // send email
        var (name, email, message) = body.Payload;
        await emailSender.SendEmailAsync(name, email, message, cancellationToken);

        return request.CreateResponse(HttpStatusCode.OK);
    }
}