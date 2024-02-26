using Google.Apis.Auth.OAuth2;
using Google.Cloud.RecaptchaEnterprise.V1;
using Microsoft.Extensions.Options;
using PersonalSite.Backend.Options;

namespace PersonalSite.Backend.Services;

public class RecaptchaEnterpriseServiceClientProvider(IOptions<GoogleProjectOptions> options)
{
    private readonly GoogleCredential googleCredential = GoogleCredential.FromJsonParameters(
        new JsonCredentialParameters
        {
            Type = JsonCredentialParameters.ServiceAccountCredentialType,
            ProjectId = options.Value.ProjectId,
            PrivateKeyId = options.Value.PrivateKeyId,
            PrivateKey = options.Value.PrivateKey,
            ClientEmail = options.Value.ClientEmail,
            ClientId = options.Value.ClientId,
            TokenUrl = options.Value.TokenUrl
        });

    public string ProjectId => options.Value.ProjectId;

    public RecaptchaEnterpriseServiceClient CreateClient() => new RecaptchaEnterpriseServiceClientBuilder
    {
        GoogleCredential = googleCredential
    }.Build();
}

