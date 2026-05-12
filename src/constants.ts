export const SITE_URL = 'https://frasermclean.com';
export const SITE_TITLE = 'Fraser McLean';
export const SITE_DESCRIPTION = 'The personal website of Fraser McLean - full-stack developer and tech enthusiast.';

export const POSTS_PAGE_SIZE = 6;

// route paths
export const HOME_PATH = '/';
export const ABOUT_PATH = '/about';
export const PROJECTS_PATH = '/projects';
export const POSTS_PATH = '/posts';
export const CONTACT_PATH = '/contact';
export const TAGS_PATH = '/tags';

// auth messages
export enum AuthMessage {
  LoginSuccess = 'login-success',
  LogoutSuccess = 'logout-success',
  GitHubLoginError = 'github-login-error',
  GitHubParamsError = 'github-params-error',
  GitHubCallbackError = 'github-callback-error'
}
