using Azure.Storage.Queues;
using PersonalSite.Backend.Contracts.Requests;

namespace PersonalSite.Backend.Services;

public interface IQueueDispatcher
{
    Task DispatchRequestAsync(SendEmailRequest request, CancellationToken cancellationToken = default);
}

public class QueueDispatcher(QueueServiceClient queueServiceClient)
    : IQueueDispatcher
{
    public async Task DispatchRequestAsync(SendEmailRequest request, CancellationToken cancellationToken = default)
    {
        var queueClient = queueServiceClient.GetQueueClient("email-outbox");
        var message = BinaryData.FromObjectAsJson(request);
        await queueClient.SendMessageAsync(message, cancellationToken: cancellationToken);
    }
}