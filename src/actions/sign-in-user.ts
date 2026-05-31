import { buildGithubAuthUrl, createOAuthConfig, generateRandomState } from '@/lib/auth/github-oauth';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from 'astro:env/server';

export const signInUser = defineAction({
  input: z.object({
    returnTo: z.string()
  }),
  handler: async ({ returnTo }, context) => {
    if (!context.session) {
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Session is not available'
      });
    }

    const state = generateRandomState();
    context.session.set('oauthState', state);
    context.session.set('returnTo', returnTo);

    const oauthConfig = createOAuthConfig(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, context.url.origin);
    const authUrl = buildGithubAuthUrl(oauthConfig, state);

    return {
      authUrl
    };
  }
});
