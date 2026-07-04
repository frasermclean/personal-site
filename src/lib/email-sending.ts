import { Resend, type ErrorResponse } from 'resend';

export class EmailSender {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly toAddress: string
  ) {
    this.resend = new Resend(apiKey);
  }

  /**
   * Send an email using the Resend API
   * @param senderName Sender name
   * @param senderAddress Sender email address
   * @param message Message content
   */
  public async send(senderName: string, senderAddress: string, message: string) {
    const response = await this.resend.emails.send({
      from: 'Contact Form <contact-form@updates.frasermclean.com>',
      to: this.toAddress,
      replyTo: senderAddress,
      subject: `Message from ${senderName}`,
      text: message
    });

    if (response.error) {
      throw new EmailSendError('Error sending email', response.error);
    }
  }
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    public readonly context?: ErrorResponse
  ) {
    super(message);
    this.name = 'EmailSendError';
  }
}
