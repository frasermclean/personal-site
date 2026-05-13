import { processContactForm } from './contact-form';
import { getWebMentions } from './get-webmentions';
import { updatePostSyndication } from './update-post-syndication';

export const server = {
  processContactForm,
  getWebMentions,
  updatePostSyndication
};
