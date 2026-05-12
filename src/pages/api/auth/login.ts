import { initiateGithubLogin } from '@/actions/initiate-github-login';
import { AuthMessage } from '@/constants';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  try {
    const { authUrl } = await initiateGithubLogin(context);
    return context.redirect(authUrl);
  } catch (error) {
    console.error('Failed to start GitHub login flow:', error);
    return context.redirect(`/?auth=${AuthMessage.GithubLoginError}`);
  }
};
