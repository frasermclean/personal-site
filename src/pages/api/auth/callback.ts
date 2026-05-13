import { getAndClearOauthStateCookie, getAndClearReturnToCookie, setSessionCookie } from '@/lib/auth/auth-cookies';
import { storeUserSession } from '@/lib/auth/auth-session';
import type { UserSession } from '@/lib/auth/auth-types';
import { AuthMessage } from '@/lib/auth/auth-types';
import { exchangeCodeForToken, fetchGithubUser, validateConfig, type GitHubUser } from '@/lib/auth/github-oauth';
import type { APIContext, APIRoute } from 'astro';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } from 'astro:env/server';

const oauthConfig = {
  clientId: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  redirectUri: GITHUB_REDIRECT_URI
};

export const GET: APIRoute = async (context) => {
  validateConfig(oauthConfig);

  // get returnTo URL from cookie (if present) to redirect user back after login
  const returnTo = getAndClearReturnToCookie(context.cookies, context.url);
  const redirectUrl = new URL(returnTo, context.url.origin);

  // ensure code and state parameters are present
  const code = context.url.searchParams.get('code');
  const state = context.url.searchParams.get('state');
  if (!code || !state) {
    redirectUrl.searchParams.set('auth', AuthMessage.GitHubParamsError);
    return context.redirect(redirectUrl.toString());
  }

  try {
    validateState(state, context);

    // fetch github user profile
    const { accessToken, tokenType } = await getAccessToken(code);
    const githubUser = await fetchGithubUser(accessToken, tokenType);
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

function validateState(state: string, context: APIContext): void {
  // retrieve stored state from cookie and compare to prevent CSRF attacks
  const storedState = getAndClearOauthStateCookie(context.cookies, context.url);
  if (state !== storedState) {
    throw new Error('State parameter mismatch');
  }
}

async function getAccessToken(code: string): Promise<{ accessToken: string; tokenType: string }> {
  // exchange code for access token
  const data = await exchangeCodeForToken(code, oauthConfig);

  if (!data) {
    throw new Error('No access token received from GitHub');
  }

  return data;
}

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
