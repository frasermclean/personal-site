import { PostLikePersistenceError, upsertPostLike } from '@/lib/db/post-likes';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';
import { getEntry } from 'astro:content';

export const addPostLike = defineAction({
  input: z.object({
    visitorId: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    name: z.string().trim().min(1).max(100).optional(),
    email: z.email().optional()
  }),
  handler: async ({ visitorId, slug, name, email }, context) => {
    await ensurePostExists(slug);

    try {
      await upsertPostLike(visitorId, slug, name, email);
    } catch (error) {
      if (error instanceof PostLikePersistenceError) {
        console.error('Failed to persist post like', {
          visitorId: error.context.visitorId,
          postSlug: error.context.postSlug,
          cause: error.cause
        });
      } else {
        console.error('Unexpected error while persisting post like', error);
      }

      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to save post like right now'
      });
    }
  }
});

async function ensurePostExists(slug: string) {
  const entry = await getEntry('posts', slug);
  if (!entry) {
    throw new ActionError({
      code: 'NOT_FOUND',
      message: 'Post not found'
    });
  }
}
