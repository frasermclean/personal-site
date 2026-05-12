import { handleGithubCallback } from '@/actions/handle-github-callback';
import { AuthMessage } from '@/constants';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const code = context.url.searchParams.get('code');
  const state = context.url.searchParams.get('state');

  if (!code || !state) {
    return context.redirect(`/?auth=${AuthMessage.GitHubParamsError}`);
  }

  try {
    await handleGithubCallback(code, state, context);
    return context.redirect(`/?auth=${AuthMessage.LoginSuccess}`);
  } catch (error) {
    console.error('GitHub callback failed:', error);
    return context.redirect(`/?auth=${AuthMessage.GitHubCallbackError}`);
  }
};
