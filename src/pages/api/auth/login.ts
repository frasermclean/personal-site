import { initiateGithubLogin } from '@/actions/initiate-github-login';
import { AuthMessage } from '@/constants';
import { setReturnToCookie } from '@/lib/auth';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const returnTo = context.url.searchParams.get('returnTo');

  if (returnTo) {
    setReturnToCookie(context.cookies, returnTo, context.url);
  }

  try {
    const { authUrl } = await initiateGithubLogin(context);
    return context.redirect(authUrl);
  } catch (error) {
    console.error('Failed to start GitHub login flow:', error);
    return context.redirect(`/?auth=${AuthMessage.GitHubLoginError}`);
  }
};
