import { Resend } from 'resend';

interface Env {
  CONTACT_ADDRESS: string;
  RESEND_API_KEY: string;
}

interface MessageData {
  to: string;
  name: string;
  email: string;
  message: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // extract message data from the form
  const formData = await context.request.formData();
  const messageData = {
    to: context.env.CONTACT_ADDRESS,
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  };

  // validate data
  const errorMessage = validateData(messageData);
  if (errorMessage) {
    console.warn(errorMessage, messageData);
    return new Response(errorMessage, { status: 400 });
  }

  // send email
  const isSuccess = await sendEmail(context.env.RESEND_API_KEY, messageData);
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
 * @param data Message data
 * @returns True if the email was sent successfully
 */
async function sendEmail(apiKey: string, data: MessageData): Promise<boolean> {
  const resend = new Resend(apiKey);

  const response = await resend.emails.send({
    from: 'Contact Form <no-reply@resend.dev>',
    to: data.to,
    reply_to: data.email,
    subject: `Message from ${data.name}`,
    text: data.message,
  })

  if (response.error) {
    console.error('Error sending email', response.error);
    return false;
  }

  console.log('Email sent successfully', response.data.id);
  return true;
}