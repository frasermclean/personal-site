using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using PersonalSite.Backend.Models;
using PersonalSite.Backend.Services;

namespace PersonalSite.Backend.Functions;

public class AssessAction(IAssessmentService assessmentService, IEmailSender emailSender)
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
        var assessmentIsValid = await assessmentService.AssessActionAsync(token, siteKey, action);
        if (!assessmentIsValid)
        {
            request.CreateResponse(HttpStatusCode.BadRequest);
        }

        // send email
        var (name, email, message) = body.Payload;
        await emailSender.SendEmailAsync(name, email, message, cancellationToken);

        return request.CreateResponse(HttpStatusCode.OK);
    }
}