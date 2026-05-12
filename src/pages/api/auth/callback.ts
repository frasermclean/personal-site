import { handleGithubCallback } from '@/actions/handle-github-callback';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const code = context.url.searchParams.get('code');
  const state = context.url.searchParams.get('state');

  if (!code || !state) {
    return context.redirect('/?auth=github-missing-params');
  }

  try {
    await handleGithubCallback(code, state, context);
    return context.redirect('/');
  } catch (error) {
    console.error('GitHub callback failed:', error);
    return context.redirect('/?auth=github-callback-error');
  }
};
