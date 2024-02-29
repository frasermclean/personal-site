function updateVisibility(state) {
  const formContainer = document.getElementById('form-container');
  const loaderContainer = document.getElementById('loader-container');
  const resultContainer = document.getElementById('result-container');

  switch (state) {
    case 'busy':
      formContainer.style.display = 'none';
      loaderContainer.style.display = 'flex';
      resultContainer.style.display = 'none';
      break;
    case 'complete':
      formContainer.style.display = 'none';
      loaderContainer.style.display = 'none';
      resultContainer.style.display = 'flex';
      break;
    default:
      formContainer.style.display = 'block';
      loaderContainer.style.display = 'none';
      resultContainer.style.display = 'none';
      break;
  }
}

function updateResult(isSuccess) {
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

updateVisibility('initial');

// attach event listener to the form
document.getElementById('contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  updateVisibility('busy');

  const siteKey = '{{ .Site.Params.recaptcha.siteKey }}';
  const action = 'submit_contact_form';

  grecaptcha.enterprise.ready(async () => {
    // get the token
    const token = await grecaptcha.enterprise.execute(siteKey, { action });

    // send the token to the backend for processing
    const url = '{{ .Site.Params.backend.baseUrl }}/assess-action';
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
          payload: {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value,
          },
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
