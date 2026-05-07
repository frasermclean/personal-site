import type { WebMentionResponse } from '@/lib/webmention-types';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';

const authorUrlsToIgnore = ['https://reddit.com/user/asimovs-auditor/'];

export const getWebMentions = defineAction({
  input: z.object({
    slug: z.string()
  }),
  handler: async ({ slug }) => {
    const target = `https://frasermclean.com/posts/${slug}`;
    const response = await fetch(`https://webmention.io/api/mentions.jf2?target=${target}`);

    if (!response.ok) {
      console.error('Error fetching web mentions:', response.statusText);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch web mentions'
      });
    }

    try {
      const data = (await response.json()) as WebMentionResponse;
      const entries = data.children
        .filter((entry) => !authorUrlsToIgnore.includes(entry.author.url))
        .map((entry) => ({
          ...entry,
          author: {
            ...entry.author,
            name: entry.author.name.replaceAll('????', '') // unicode / emoji characters seem to appear as ???? so just remove them
          },
          content: {
            text: entry.content?.text ? entry.content.text.replaceAll('????', '') : undefined
          }
        }));
      return entries;
    } catch (error) {
      console.error('Error parsing web mentions response:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse web mentions response'
      });
    }
  }
});
