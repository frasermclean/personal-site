using Azure;
using Azure.Data.Tables;

namespace PersonalSite.Backend.Models.Entities;

public class AssessmentEntity : ITableEntity
{
    public string PartitionKey { get; set; } = string.Empty;
    public string RowKey { get; set; } = Guid.NewGuid().ToString();
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }

    public float Score { get; init; }
    public bool IsSuccess { get; init; }
    public string? ErrorMessage { get; init; }
    public string? AssessmentName { get; init; }

    public static AssessmentEntity FromResult(AssessmentResult result) => new()
    {
        PartitionKey = result.Action,
        Score = result.Score,
        IsSuccess = result.IsSuccess,
        ErrorMessage = result.ErrorMessage,
        AssessmentName = result.AssessmentName,
    };

}