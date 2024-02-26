using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Options;
using PersonalSite.Backend.Options;

namespace PersonalSite.Backend.Services;

public interface IGoogleCredentialProvider
{
    GoogleCredential GetCredential();
}

public class GoogleCredentialProvider(IOptions<GoogleProjectOptions> options) : IGoogleCredentialProvider
{
    private readonly GoogleCredential credential = GoogleCredential.FromJsonParameters(new JsonCredentialParameters
    {
        Type = JsonCredentialParameters.ServiceAccountCredentialType,
        ProjectId = options.Value.ProjectId,
        PrivateKeyId = options.Value.PrivateKeyId,
        PrivateKey = options.Value.PrivateKey,
        ClientEmail = options.Value.ClientEmail,
        ClientId = options.Value.ClientId,
        TokenUrl = options.Value.TokenUrl
    });

    public GoogleCredential GetCredential() => credential;
}

