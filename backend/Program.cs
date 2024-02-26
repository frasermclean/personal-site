using Google.Apis.Auth.OAuth2;
using Google.Cloud.RecaptchaEnterprise.V1;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PersonalSite.Backend.Options;
using PersonalSite.Backend.Services;

namespace PersonalSite.Backend;

public static class Program
{
    public static void Main()
    {
        var host = new HostBuilder()
            .ConfigureFunctionsWorkerDefaults()
            .ConfigureServices((context, services) =>
            {
                services.AddApplicationInsightsTelemetryWorkerService();
                services.ConfigureFunctionsApplicationInsights();

                services.AddScoped<IAssessmentService, AssessmentService>();
                services.AddOptions<AssessmentServiceOptions>()
                    .Bind(context.Configuration.GetSection(AssessmentServiceOptions.SectionName));

                services.AddScoped<IEmailSender, EmailSender>();
                services.AddOptions<EmailOptions>()
                    .Bind(context.Configuration.GetSection(EmailOptions.SectionName));

                services.AddSingleton<RecaptchaEnterpriseServiceClient>(serviceProvider =>
                {
                    var options = serviceProvider.GetRequiredService<IOptions<GoogleProjectOptions>>().Value;
                    var googleCredential = GoogleCredential.FromJsonParameters(
                        new JsonCredentialParameters
                        {
                            Type = JsonCredentialParameters.ServiceAccountCredentialType,
                            ProjectId = options.ProjectId,
                            PrivateKeyId = options.PrivateKeyId,
                            PrivateKey = options.PrivateKey,
                            ClientEmail = options.ClientEmail,
                            ClientId = options.ClientId,
                            TokenUrl = options.TokenUrl
                        });

                    return new RecaptchaEnterpriseServiceClientBuilder
                    {
                        GoogleCredential = googleCredential
                    }.Build();
                });
                services.AddOptions<GoogleProjectOptions>()
                    .Bind(context.Configuration.GetSection(GoogleProjectOptions.SectionName));
            })
            .Build();

        host.Run();
    }
}