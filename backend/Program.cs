using Azure.Identity;
using Azure.Storage.Queues;
using Google.Cloud.RecaptchaEnterprise.V1;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Azure;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
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

                services.AddAzureClients(builder =>
                {
                    builder.AddQueueServiceClient(new Uri(context.Configuration["Storage:QueueServiceEndpoint"]))
                        .ConfigureOptions(options => options.MessageEncoding = QueueMessageEncoding.Base64);
                    builder.AddTableServiceClient(new Uri(context.Configuration["Storage:TableServiceEndpoint"]));
                    builder.UseCredential(new DefaultAzureCredential());
                });

                services.AddScoped<IAssessmentService, AssessmentService>();
                services.AddOptions<RecaptchaOptions>()
                    .Bind(context.Configuration.GetSection(RecaptchaOptions.SectionName));

                services.AddScoped<IEmailSender, EmailSender>();
                services.AddOptions<EmailOptions>()
                    .Bind(context.Configuration.GetSection(EmailOptions.SectionName));

                services.AddScoped<IAuditService, AuditService>();
                services.AddScoped<IQueueDispatcher, QueueDispatcher>();

                services.AddSingleton<RecaptchaEnterpriseServiceClient>(_ => new RecaptchaEnterpriseServiceClientBuilder
                {
                    JsonCredentials = Environment.GetEnvironmentVariable("GOOGLE_JSON_CREDENTIALS")
                }.Build());
            })
            .Build();

        host.Run();
    }
}