import { addPostLike } from './add-post-like';
import { processContactForm } from './contact-form';
import { getPostReactions } from './get-post-reactions';
import { publishNowPageRevision } from './publish-now-page-revision';
import { signInUser } from './sign-in-user';
import { signOutUser } from './sign-out-user';
import { updateNowPageRevision } from './update-now-page-revision';
import { updatePostSyndication } from './update-post-syndication';
import { updateSiteSettings } from './update-site-settings';

export const server = {
  addPostLike,
  processContactForm,
  getPostReactions,
  publishNowPageRevision,
  signInUser,
  signOutUser,
  updateNowPageRevision,
  updatePostSyndication,
  updateSiteSettings
};
