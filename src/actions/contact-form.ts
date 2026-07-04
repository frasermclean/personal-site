import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';
import { CONTACT_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { Resend } from 'resend';
import { TurnstileError, TurnstileValidator } from '../lib/turnstile';

const turnstileValidator = new TurnstileValidator(TURNSTILE_SECRET_KEY);

export const processContactForm = defineAction({
  input: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email address'),
    message: z.string().min(1, 'Message is required'),
    token: z.string().min(1, 'Turnstile token is required')
  }),
  handler: async (input, context) => {
    try {
      await turnstileValidator.validateToken(input.token, getClientIp(context.request));
    } catch (error) {
      if (error instanceof TurnstileError) {
        console.error(error.message, error.context);
      }

      throw new ActionError({
        code: 'UNAUTHORIZED',
        message: 'Failed to validate token'
      });
    }

    await sendEmail(input.name, input.email, input.message);
  }
});

/**
 * Send an email using the Resend API
 * @param apiKey The Resend API key
 * @param fromEmail Sender email address
 * @param fromName Sender name
 * @param message Message content
 * @returns True if the email was sent successfully
 */
async function sendEmail(fromName: string, fromEmail: string, message: string) {
  if (!CONTACT_EMAIL) {
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Missing CONTACT_EMAIL server secret configuration'
    });
  }

  if (!RESEND_API_KEY) {
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Missing RESEND_API_KEY server secret configuration'
    });
  }

  const resend = new Resend(RESEND_API_KEY);

  const response = await resend.emails.send({
    from: 'Contact Form <contact-form@updates.frasermclean.com>',
    to: CONTACT_EMAIL,
    replyTo: fromEmail,
    subject: `Message from ${fromName}`,
    text: message
  });

  if (response.error) {
    console.error('Error sending email', response.error);
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to send email'
    });
  }
}

/**
 * Attempt to get the client's IP address from the request headers
 * @param request The incoming request object
 * @returns The client's IP address if available, otherwise undefined
 */
function getClientIp(request: Request): string | undefined {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim();
  }

  return undefined;
}
