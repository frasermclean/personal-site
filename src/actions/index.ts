import { processContactForm } from './contact-form';
import { getWebMentions } from './get-webmentions';
import { handleGithubCallback } from './handle-github-callback';
import { initiateGithubLogin } from './initiate-github-login';

export const server = {
  processContactForm,
  getWebMentions,
  initiateGithubLogin,
  handleGithubCallback
};
