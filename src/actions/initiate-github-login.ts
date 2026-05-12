import { buildGithubAuthUrl, generateRandomState } from '@/lib/github-oauth';
import { GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI } from 'astro:env/server';

/**
 * Initiate GitHub OAuth login flow
 * Generates state token and returns authorization URL
 */
export async function initiateGithubLogin(context?: any) {
  if (!GITHUB_CLIENT_ID || !GITHUB_REDIRECT_URI) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  // Generate random state for CSRF protection
  const state = generateRandomState();

  // Store state in a cookie (browser will send it back with callback request)
  // We'll validate it during callback
  if (context?.cookies) {
    context.cookies.set('github_oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    });
  }

  // Build authorization URL
  const authUrl = buildGithubAuthUrl(GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI, state);

  return { authUrl };
}
