interface MessageData {
  name: string;
  email: string;
  message: string;
}

export const onRequestPost: PagesFunction = async (context) => {
  // extract message data from the form
  const formData = await context.request.formData();
  const messageData = {
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
  const isSuccess = await sendEmail(messageData);
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

async function sendEmail(data: MessageData): Promise<boolean> {
  return false;
}