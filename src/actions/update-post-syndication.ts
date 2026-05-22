import { saveLinks } from '@/lib/db/syndication-links';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';
import { getEntry } from 'astro:content';

export const updatePostSyndication = defineAction({
  input: z.object({
    slug: z.string().min(1),
    links: z.array(z.url()).max(50)
  }),
  handler: async ({ slug, links }, context) => {
    if (!context.locals.user?.isOwner) {
      throw new ActionError({
        code: 'UNAUTHORIZED',
        message: 'Only the site owner can update post syndication links'
      });
    }

    const entry = await getEntry('posts', slug);
    if (!entry) {
      throw new ActionError({
        code: 'NOT_FOUND',
        message: `Post not found for slug \"${slug}\"`
      });
    }

    await saveLinks(slug, links);

    return {
      slug,
      links
    };
  }
});
