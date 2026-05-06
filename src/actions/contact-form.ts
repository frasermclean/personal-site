import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';
import { CONTACT_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { Resend } from 'resend';

export const processContactForm = defineAction({
  input: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email address'),
    message: z.string().min(1, 'Message is required'),
    token: z.string().min(1, 'Turnstile token is required')
  }),
  handler: async (input, context) => {
    await validateToken(input.token, getClientIp(context.request));
    await sendEmail(input.name, input.email, input.message);
  }
});

/**
 * Validate Turnstile token
 * @param token Turnstile token from client
 * @param remoteIp Client's IP address
 */
async function validateToken(token: string, remoteIp?: string): Promise<void> {
  const formData = new FormData();
  formData.append('response', token);
  formData.append('secret', TURNSTILE_SECRET_KEY);

  if (remoteIp) {
    formData.append('remoteip', remoteIp);
  }

  // send request to siteverify API endpoint
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    console.error('Error calling Turnstile siteverify API:', response.status, response.statusText);
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'Failed to validate token'
    });
  }

  const result = (await response.json()) as { success: boolean; 'error-codes': string[] };

  if (!result.success) {
    console.error('Turnstile validation failed:', result['error-codes']);
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'Failed to validate token'
    });
  }
}

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
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

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
