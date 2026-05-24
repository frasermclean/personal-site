import { z } from 'astro/zod';
import { defineAction } from 'astro:actions';

export const addPostLike = defineAction({
  input: z.object({
    slug: z.string()
  }),
  handler: async ({ slug }) => {
    console.log(`Liking post with slug: ${slug}`);
  }
});
