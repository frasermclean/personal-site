using Microsoft.Azure.Functions.Worker;
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

                services.AddOptions<AssessmentServiceOptions>()
                    .Bind(context.Configuration.GetSection(AssessmentServiceOptions.SectionName));
                services.AddScoped<IAssessmentService, AssessmentService>();
                services.AddOptions<GoogleProjectOptions>()
                    .Bind(context.Configuration.GetSection(GoogleProjectOptions.SectionName));
                services.AddSingleton<RecaptchaEnterpriseServiceClientProvider>();
            })
            .Build();

        host.Run();
    }
}