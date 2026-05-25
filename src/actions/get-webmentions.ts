import { fetchWebMentions } from '@/lib/webmentions/webmentions-api';
import { mapComments, mapLikes } from '@/lib/webmentions/webmentions-mapping';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';

export const getWebMentions = defineAction({
  input: z.object({
    slug: z.string()
  }),
  handler: async ({ slug }) => {
    const target = `https://frasermclean.com/posts/${slug}`;
    try {
      const response = await fetchWebMentions(target);
      return {
        likes: mapLikes(response),
        comments: mapComments(response)
      };
    } catch (error) {
      console.error('Error fetching web mentions:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch web mentions'
      });
    }
  }
});
