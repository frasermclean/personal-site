import { setOauthStateCookie, setReturnToCookie } from '@/lib/auth/auth-cookies';
import { AuthMessage } from '@/lib/auth/auth-types';
import { buildGithubAuthUrl, generateRandomState } from '@/lib/auth/github-oauth';
import type { APIRoute } from 'astro';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } from 'astro:env/server';

const oauthConfig = {
  clientId: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  redirectUri: GITHUB_REDIRECT_URI
};

export const GET: APIRoute = async (context) => {
  try {
    // generate random state for CSRF protection
    const state = generateRandomState();

    // store state in a cookie - we'll validate it during callback
    setOauthStateCookie(context.cookies, state, context.url);

    // get optional returnTo parameter to redirect user back after login
    const returnTo = context.url.searchParams.get('returnTo');
    if (returnTo) {
      setReturnToCookie(context.cookies, returnTo, context.url);
    }

    // build authorization URL
    const authUrl = buildGithubAuthUrl(oauthConfig, state);

    // redirect user to GitHub authorization page
    return context.redirect(authUrl);
  } catch (error) {
    console.error('Failed to start GitHub login flow:', error);
    return context.redirect(`/?auth=${AuthMessage.GitHubLoginError}`);
  }
};
