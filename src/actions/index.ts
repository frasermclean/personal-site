import { addPostLike } from './add-post-like';
import { processContactForm } from './contact-form';
import { getPostReactions } from './get-post-reactions';
import { signInUser } from './sign-in-user';
import { signOutUser } from './sign-out-user';
import { updatePostSyndication } from './update-post-syndication';
import { updateSiteSettings } from './update-site-settings';

export const server = {
  addPostLike,
  processContactForm,
  getPostReactions,
  signInUser,
  signOutUser,
  updatePostSyndication,
  updateSiteSettings
};
