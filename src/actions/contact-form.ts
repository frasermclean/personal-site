import { EmailSender, EmailSendError } from '@/lib/email-sending';
import { TurnstileError, TurnstileValidator } from '@/lib/turnstile';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';
import { CONTACT_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';

const turnstileValidator = new TurnstileValidator(TURNSTILE_SECRET_KEY);
const emailSender = new EmailSender(RESEND_API_KEY, CONTACT_EMAIL);

export const processContactForm = defineAction({
  input: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less')
      .regex(/^[^\r\n]*$/, 'Name cannot contain line breaks'),
    email: z.email('Invalid email address').max(254, 'Email must be 254 characters or less'),
    message: z.string().min(1, 'Message is required').max(5000, 'Message must be 5000 characters or less'),
    token: z.string().min(1, 'Turnstile token is required')
  }),
  handler: async (input, context) => {
    try {
      await turnstileValidator.validateToken(input.token, getClientIp(context.request));
      await emailSender.send(input.name, input.email, input.message);
    } catch (error) {
      if (error instanceof TurnstileError) {
        console.error(error.message, error.context);
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Failed to validate token'
        });
      }

      if (error instanceof EmailSendError) {
        console.error(error.message, error.context);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send email'
        });
      }

      console.error('Unexpected error while processing contact form', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }
});

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
