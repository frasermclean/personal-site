import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: sendMock } };
  })
}));

const { EmailSender, EmailSendError } = await import('./email-sending');

describe('EmailSender', () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resolves when the Resend API reports success', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    const sender = new EmailSender('api-key', 'contact@example.com');

    await expect(sender.send('Jane Doe', 'jane@example.com', 'Hello there')).resolves.toBeUndefined();
  });

  it('sends the expected fields to the Resend API', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });

    const sender = new EmailSender('api-key', 'contact@example.com');
    await sender.send('Jane Doe', 'jane@example.com', 'Hello there');

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      from: 'Contact Form <contact-form@updates.frasermclean.com>',
      to: 'contact@example.com',
      replyTo: 'jane@example.com',
      subject: 'Message from Jane Doe',
      text: 'Hello there'
    });
  });

  it('throws an EmailSendError with the reported error as context when sending fails', async () => {
    const error = { message: 'Invalid from address', statusCode: 422, name: 'invalid_from_address' } as const;
    sendMock.mockResolvedValue({ data: null, error });

    const sender = new EmailSender('api-key', 'contact@example.com');

    const result = sender.send('Jane Doe', 'jane@example.com', 'Hello there');
    await expect(result).rejects.toBeInstanceOf(EmailSendError);
    await expect(result).rejects.toMatchObject({ context: error });
  });
});
