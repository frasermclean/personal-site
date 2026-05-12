import {
  clearOauthStateCookie,
  getAndClearReturnToCookie,
  getOauthStateCookie,
  setSessionCookie
} from '@/lib/auth/auth-cookies';
import { storeUserSession } from '@/lib/auth/auth-session';
import type { UserSession } from '@/lib/auth/auth-types';
import { AuthMessage } from '@/lib/auth/auth-types';
import { exchangeCodeForToken, fetchGithubUser, type GitHubUser } from '@/lib/auth/github-oauth';
import type { APIContext, APIRoute } from 'astro';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } from 'astro:env/server';

export const GET: APIRoute = async (context) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URI) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  // ensure code and state parameters are present
  const code = context.url.searchParams.get('code');
  const state = context.url.searchParams.get('state');
  if (!code || !state) {
    throw new Error('Missing code or state parameter');
  }

  // get returnTo URL from cookie (if present) to redirect user back after login
  const returnTo = getAndClearReturnToCookie(context.cookies, context.url);
  const redirectUrl = new URL(returnTo, context.url.origin);

  try {
    // retrieve stored state from cookie and compare to prevent CSRF attacks
    const storedState = getOauthStateCookie(context.cookies);
    if (state !== storedState) {
      throw new Error('State parameter mismatch');
    }

    // clear the state cookie
    clearOauthStateCookie(context.cookies, context.url);

    // exchange code for access token
    const tokenData = await exchangeCodeForToken(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, code, GITHUB_REDIRECT_URI);
    if (!tokenData.access_token) {
      throw new Error('No access token received from GitHub');
    }

    // fetch github user profile
    const githubUser = await fetchGithubUser(tokenData.access_token);
    const session = mapUserSession(githubUser);

    // store session and set cookie
    await storeUserSession(session);
    setSessionCookie(context.cookies, session.id, context.url);

    // redirect user back to original page with success message
    redirectUrl.searchParams.set('auth', AuthMessage.LoginSuccess);
    return context.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('GitHub callback failed:', error);
    redirectUrl.searchParams.set('auth', AuthMessage.GitHubCallbackError);
    return context.redirect(redirectUrl.toString());
  }
};

function mapUserSession(user: GitHubUser): UserSession {
  const now = Date.now();
  const sessionId = crypto.randomUUID();
  return {
    id: sessionId,
    githubId: user.id,
    githubUsername: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    email: user.email,
    createdAt: now,
    expiresAt: now + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
}

/**
 * Handle GitHub OAuth callback
 * Exchanges authorization code for access token and creates user session
 */
export async function handleGithubCallback(code: string, state: string, context: Pick<APIContext, 'cookies' | 'url'>) {
  try {
    const githubUser = await fetchGithubUser(code);
    const session = mapUserSession(githubUser);
    await storeUserSession(session);
    setSessionCookie(context.cookies, session.id, context.url);

    return {
      success: true,
      user: {
        id: githubUser.id,
        username: githubUser.login,
        name: githubUser.name,
        avatarUrl: githubUser.avatar_url,
        email: githubUser.email
      }
    };
  } catch (error) {
    throw new Error(`GitHub authentication failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
