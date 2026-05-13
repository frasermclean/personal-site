import { hasOwnerConfiguration, isOwner } from '@/lib/auth/owner-check';
import { saveLinks } from '@/lib/syndication';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';
import { getEntry } from 'astro:content';

export const updatePostSyndication = defineAction({
  input: z.object({
    slug: z.string().min(1),
    links: z.array(z.url()).max(50)
  }),
  handler: async ({ slug, links }, context) => {
    if (!hasOwnerConfiguration()) {
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Missing OWNER_GITHUB_ID configuration'
      });
    }

    if (!isOwner(context.locals.user)) {
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

    const updatedAt = await saveLinks(slug, links);

    return {
      slug,
      links,
      updatedAt
    };
  }
});
