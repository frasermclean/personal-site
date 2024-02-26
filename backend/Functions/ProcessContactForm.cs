using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using PersonalSite.Backend.Models;

namespace PersonalSite.Backend.Functions;

public class ProcessContactForm(ILogger<ProcessContactForm> logger)
{
    [Function(nameof(ProcessContactForm))]
    public HttpResponseData Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "contact-form")]
        HttpRequestData request,
        [FromBody] ProcessContactFormRequest body)
    {
        return request.CreateResponse(HttpStatusCode.NoContent);
    }
}