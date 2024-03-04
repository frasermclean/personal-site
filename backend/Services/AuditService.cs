using Azure.Data.Tables;
using PersonalSite.Backend.Models;
using PersonalSite.Backend.Models.Entities;

namespace PersonalSite.Backend.Services;

public interface IAuditService
{
    Task LogAssessmentAsync(AssessmentResult result, CancellationToken cancellationToken = default);
}

public class AuditService(TableServiceClient tableServiceClient)
    : IAuditService
{
    public async Task LogAssessmentAsync(AssessmentResult result, CancellationToken cancellationToken)
    {
        var tableClient = tableServiceClient.GetTableClient("assessments");
        var entity = AssessmentEntity.FromResult(result);
        await tableClient.AddEntityAsync(entity, cancellationToken);
    }
}