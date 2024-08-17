import * as params from '@params';

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

function setElementDisplay(
  element: HTMLElement,
  display: 'none' | 'block' | 'flex'
) {
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

function createPayload(): {
  token: string;
  data: { name: string; email: string; message: string };
} {
  return {
    token: turnstile.getResponse(turnstileContainer),
    data: {
      name: contactForm.querySelector<HTMLInputElement>('#name').value,
      email: contactForm.querySelector<HTMLInputElement>('#email').value,
      message: contactForm.querySelector<HTMLTextAreaElement>('#message').value,
    },
  };
}

updateVisibility('initial');

const contactForm = document.querySelector<HTMLFormElement>('#contact-form');
const turnstileContainer = contactForm.querySelector<HTMLDivElement>(
  '#turnstile-container'
);

(window as any).turnstileCallback = () => {
  turnstile.render(turnstileContainer, {
    sitekey: params.siteKey,
    action: 'contact-form',
    callback: (token) => {
      console.log(`Challenge Success ${token}`);
    },
  });
};

// attach event listener to the form submit button
contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  updateVisibility('busy');

  try {
    const response = await fetch('/api/contact-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload()),
    });
    updateVisibility('complete');
    updateResult(response.ok);
  } catch (error) {
    console.error('Failed to send message', error);
    updateVisibility('complete');
    updateResult(false);
  }
});
