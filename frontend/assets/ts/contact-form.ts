import * as params from '@params';

// declare the grecaptcha object
declare var grecaptcha: any;

function updateVisibility(state: 'initial' | 'busy' | 'complete') {
  const formContainer = document.getElementById('form-container');
  const loaderContainer = document.getElementById('loader-container');
  const resultContainer = document.getElementById('result-container');

  switch (state) {
    case 'busy':
      setElementDisplay(formContainer, 'none');
      setElementDisplay(loaderContainer, 'flex');
      setElementDisplay(resultContainer, 'none');
      break;
    case 'complete':
      setElementDisplay(formContainer, 'none');
      setElementDisplay(loaderContainer, 'none');
      setElementDisplay(resultContainer, 'flex');
      break;
    default:
      setElementDisplay(formContainer, 'block');
      setElementDisplay(loaderContainer, 'none');
      setElementDisplay(resultContainer, 'none');
      break;
  }
}

function setElementDisplay(element: HTMLElement, display: 'none' | 'block' | 'flex') {
  element.style.display = display;
}

function updateResult(isSuccess: boolean) {
  const resultTitle = document.getElementById('result-title');
  const resultMessage = document.getElementById('result-message');

  if (isSuccess) {
    resultTitle.innerText = 'Message sent';
    resultMessage.innerText = 'Thank you for your message!';
  } else {
    resultTitle.innerText = 'Failed to send message';
    resultMessage.innerText = 'An error occurred while sending the message.';
  }
}

function createPayload(): { name: string; email: string; message: string } {
  return {
    name: (document.getElementById('name') as HTMLInputElement).value,
    email: (document.getElementById('email') as HTMLInputElement).value,
    message: (document.getElementById('message') as HTMLInputElement).value,
  };
}

updateVisibility('initial');

// attach event listener to the form
document.getElementById('contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  updateVisibility('busy');

  const siteKey = params.siteKey;
  const action = 'submit_contact_form';

  grecaptcha.enterprise.ready(async () => {
    // get the token
    const token = await grecaptcha.enterprise.execute(siteKey, { action });

    // send the token to the backend for processing
    const url = `${params.apiBaseUrl}/assess-action`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: {
            token,
            action,
            siteKey,
          },
          payload: createPayload(),
        }),
      });
      updateVisibility('complete');
      updateResult(response.ok);
    } catch (error) {
      updateVisibility('complete');
      updateResult(false);
    }
  });
});
