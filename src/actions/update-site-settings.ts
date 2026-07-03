import { saveSiteSettings } from '@/lib/db/site-settings';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';

export const updateSiteSettings = defineAction({
  input: z.object({
    analyticsPerformance: z.boolean(),
    analyticsReplays: z.boolean()
  }),
  handler: async (input, context) => {
    if (!context.locals.user?.isOwner) {
      throw new ActionError({
        code: 'UNAUTHORIZED',
        message: 'Only the site owner can update site settings'
      });
    }

    await saveSiteSettings(input);

    return input;
  }
});
