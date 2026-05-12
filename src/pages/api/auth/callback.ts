import { handleGithubCallback } from '@/actions/handle-github-callback';
import { AuthMessage } from '@/constants';
import { getAndClearReturnToCookie } from '@/lib/auth';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const code = context.url.searchParams.get('code');
  const state = context.url.searchParams.get('state');

  if (!code || !state) {
    return context.redirect(`/?auth=${AuthMessage.GitHubParamsError}`);
  }

  try {
    await handleGithubCallback(code, state, context);
    const returnTo = getAndClearReturnToCookie(context.cookies, context.url);
    const redirectUrl = new URL(returnTo, context.url.origin);
    redirectUrl.searchParams.set('auth', AuthMessage.LoginSuccess);
    return context.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('GitHub callback failed:', error);
    return context.redirect(`/?auth=${AuthMessage.GitHubCallbackError}`);
  }
};
