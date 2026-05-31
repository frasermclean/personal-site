import type { AppUser } from '@/lib/auth/auth-types';
import { AuthMessage } from '@/lib/auth/auth-types';
import { exchangeCodeForToken, fetchGithubUser, type GitHubUser } from '@/lib/auth/github-oauth';
import type { APIRoute } from 'astro';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI, OWNER_GITHUB_ID } from 'astro:env/server';

const oauthConfig = {
  clientId: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  redirectUri: GITHUB_REDIRECT_URI
};

export const GET: APIRoute = async (context) => {
  // get returnTo URL from session (if present) to redirect user back after login
  const returnTo = await context.session?.get('returnTo');
  const redirectUrl = new URL(returnTo ?? '/', context.url.origin);

  // ensure code and state parameters are present
  const code = context.url.searchParams.get('code');
  const state = context.url.searchParams.get('state');
  if (!code || !state) {
    return new Response('Missing code or state parameter', { status: 400 });
  }

  try {
    // retrieve stored state from session and compare to prevent CSRF attacks
    const storedState = await context.session?.get('oauthState');
    if (state !== storedState) {
      throw new Error('State parameter mismatch');
    }

    // fetch github user profile
    const { accessToken, tokenType } = await exchangeCodeForToken(code, oauthConfig);
    const githubUser = await fetchGithubUser(accessToken, tokenType);
    const user = mapUserSession(githubUser);

    // store session and set cookie
    context.session?.set('user', user);

    // redirect user back to original page with success message
    redirectUrl.searchParams.set('auth', AuthMessage.SignInSuccess);
    return context.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('GitHub callback failed:', error);
    redirectUrl.searchParams.set('auth', AuthMessage.GitHubCallbackError);
    return context.redirect(redirectUrl.toString());
  } finally {
    // clean up session data used during login flow
    context.session?.delete('oauthState');
    context.session?.delete('returnTo');
  }
};

const mapUserSession = (user: GitHubUser): AppUser => ({
  name: user.name,
  email: user.email,
  avatarUrl: user.avatar_url,
  githubId: user.id,
  githubUsername: user.login,
  isOwner: isOwner(user.id)
});

const isOwner = (githubId: number): boolean =>
  OWNER_GITHUB_ID ? Number.parseInt(OWNER_GITHUB_ID, 10) === githubId : false;
