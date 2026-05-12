import { setOauthStateCookie } from '@/lib/auth';
import { buildGithubAuthUrl, generateRandomState } from '@/lib/github-oauth';
import type { APIContext } from 'astro';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } from 'astro:env/server';

/**
 * Initiate GitHub OAuth login flow
 * Generates state token and returns authorization URL
 */
export async function initiateGithubLogin(context: Pick<APIContext, 'cookies' | 'url'>) {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URI) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  // Generate random state for CSRF protection
  const state = generateRandomState();

  // Store state in a cookie (browser will send it back with callback request)
  // We'll validate it during callback
  setOauthStateCookie(context.cookies, state, context.url);

  // Build authorization URL
  const authUrl = buildGithubAuthUrl(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI, state);

  return { authUrl };
}
