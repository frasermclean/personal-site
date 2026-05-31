import type { AuthMessage } from './auth-types';

/**
 * Utility to construct returnTo URL with optional auth message for user feedback after login/logout actions
 * @param href - The current location href
 * @param message - Optional authentication message to include in the URL
 * @returns A relative URL string to redirect the user back to after authentication actions, with any auth messages included as query parameters
 */
export function getReturnToUrl(href: string, message?: AuthMessage): string {
  const url = new URL(href);
  url.searchParams.delete('auth'); // remove existing auth messages

  if (message) {
    url.searchParams.set('auth', message);
  }

  return url.pathname + url.search + url.hash;
}
