import { createNowPageRevision } from '@/lib/db/now-page';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';

export const publishNowPageRevision = defineAction({
  input: z.object({
    content: z.string().trim().min(1).max(20000)
  }),
  handler: async ({ content }, context) => {
    if (!context.locals.user?.isOwner) {
      throw new ActionError({
        code: 'UNAUTHORIZED',
        message: 'Only the site owner can update the now page'
      });
    }

    try {
      await createNowPageRevision(content);
    } catch (error) {
      console.error('Failed to publish now page revision', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to publish the now page update'
      });
    }

    return { content };
  }
});
