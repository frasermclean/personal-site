import { Resend } from 'resend';

interface Env {
  CONTACT_ADDRESS: string;
  RESEND_API_KEY: string;
}

interface RequestBody {
  token: string;
  data: MessageData;
}

interface MessageData {
  name: string;
  email: string;
  message: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // ensure we have the correct content type
  const contentType = context.request.headers.get('content-type');
  if (contentType !== 'application/json') {
    console.error('Invalid content type: ', contentType);
    return new Response(null, { status: 415 });
  }

  // parse JSON body
  const body = await context.request.json<RequestBody>();

  // validate data
  const errorMessage = validateData(body.data);
  if (errorMessage) {
    console.warn(errorMessage, body);
    return new Response(errorMessage, { status: 400 });
  }

  // send email
  const isSuccess = await sendEmail(
    context.env.RESEND_API_KEY,
    context.env.CONTACT_ADDRESS,
    body.data
  );
  if (!isSuccess) {
    return new Response('Failed to send email', { status: 500 });
  }

  return new Response('Message sent successfully');
};

function validateData(data: MessageData): string {
  // validate name
  if (!data.name || data.name.length < 2) {
    return 'Invalid name';
  }

  // validate email
  const emailRegex =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
  if (!data.email || data.email.match(emailRegex) === null) {
    return 'Invalid email address';
  }

  // validate message
  if (!data.message || data.message.length < 10) {
    return 'Message is too short';
  }

  return '';
}

/**
 * Send an email using the Resend API
 * @param apiKey The Resend API key
 * @param to Email address to send the message to
 * @param data Message data
 * @returns True if the email was sent successfully
 */
async function sendEmail(
  apiKey: string,
  to: string,
  data: MessageData
): Promise<boolean> {
  const resend = new Resend(apiKey);

  const response = await resend.emails.send({
    from: 'Contact Form <contact-form@updates.frasermclean.com>',
    to,
    reply_to: data.email,
    subject: `Message from ${data.name}`,
    text: data.message,
  });

  if (response.error) {
    console.error('Error sending email', response.error);
    return false;
  }

  console.log('Email sent successfully', response.data.id);
  return true;
}
