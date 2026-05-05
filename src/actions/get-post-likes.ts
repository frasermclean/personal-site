import type { WebMentionResponse } from '@/lib/webmention-types';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';

export const getPostLikes = defineAction({
  input: z.object({
    slug: z.string()
  }),
  handler: async ({ slug }) => {
    const target = `https://frasermclean.com/posts/${slug}`;
    const property = 'like-of';

    try {
      const response = await fetch(`https://webmention.io/api/mentions.jf2?target=${target}&wm-property=${property}`);
      const data = (await response.json()) as WebMentionResponse;
      const likes = data.children.map((child) => ({
        authorName: child.author.name,
        authorUrl: child.author.url,
        authorPhoto: child.author.photo,
        receivedDate: child['wm-received']
      }));

      return likes;
    } catch (error) {
      console.error('Error fetching post likes:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch post likes'
      });
    }
  }
});
