import { SourcePlatform, type Comment, type Like } from '@/lib/reaction-types';
import type { WebMentionResponse } from '@/lib/webmention-types';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';

const REDDIT_DELETED_STRING = '[deleted]';
const authorUrlsToIgnore = ['https://reddit.com/user/asimovs-auditor/', 'https://reddit.com/user/AutoModerator/'];

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

      const likes = data.children
        .filter((entry) => entry['wm-property'] === 'like-of' && !authorUrlsToIgnore.includes(entry.author.url))
        .map<Like>((entry) => ({
          authorName: sanitizeText(entry.author.name),
          authorInitials: convertNameToInitials(sanitizeText(entry.author.name)),
          avatarUrl: entry.author.photo,
          publishDate: entry.published ? new Date(entry.published) : new Date(entry['wm-received']),
          sourceUrl: entry['wm-source'],
          sourcePlatform: parseSourcePlatform(entry['wm-source'])
        }));

      const comments = data.children
        .filter(
          (entry) =>
            entry['wm-property'] === 'in-reply-to' &&
            !authorUrlsToIgnore.includes(entry.author.url) &&
            entry.author.name &&
            entry.author.photo &&
            entry.content?.text &&
            entry.author.name !== REDDIT_DELETED_STRING &&
            entry.content?.text !== REDDIT_DELETED_STRING
        )
        .map<Comment>((entry) => ({
          authorName: sanitizeText(entry.author.name),
          authorInitials: convertNameToInitials(sanitizeText(entry.author.name)),
          avatarUrl: entry.author.photo,
          commentText: sanitizeText(entry.content?.text),
          publishDate: entry.published ? new Date(entry.published) : new Date(entry['wm-received']),
          sourceUrl: entry['wm-source'],
          sourcePlatform: parseSourcePlatform(entry['wm-source'])
        }));

      return {
        likes,
        comments
      };
    } catch (error) {
      console.error('Error parsing web mentions response:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse web mentions response'
      });
    }
  }
});

function sanitizeText(input?: string): string {
  if (!input) {
    return '';
  }

  return input.trim().replaceAll('????', '');
}

function parseSourcePlatform(input: string): SourcePlatform | null {
  if (input.startsWith('https://brid.gy/comment/reddit/')) {
    return SourcePlatform.Reddit;
  } else if (input.includes('https://brid.gy/comment/bluesky/')) {
    return SourcePlatform.Bluesky;
  } else if (input.startsWith('https://brid.gy/comment/mastodon/')) {
    return SourcePlatform.Mastodon;
  }

  return null;
}

export function convertNameToInitials(name: string): string {
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  } else {
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }
}
