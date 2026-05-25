import { SourcePlatform, type PostComment, type PostLike } from '@/lib/reaction-types';
import { fetchWebMentions, type WebMentionResponse } from '@/lib/webmentions';
import { z } from 'astro/zod';
import { ActionError, defineAction } from 'astro:actions';

const IGNORED_AUTHOR_URLS = ['https://reddit.com/user/asimovs-auditor/', 'https://reddit.com/user/AutoModerator/'];
const REDDIT_DELETED_STRING = '[deleted]';

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

function mapLikes(response: WebMentionResponse): PostLike[] {
  const likes = response.children
    .filter((entry) => entry['wm-property'] === 'like-of' && !IGNORED_AUTHOR_URLS.includes(entry.author.url))
    .map<PostLike>((entry) => ({
      authorName: sanitizeText(entry.author.name),
      authorInitials: convertNameToInitials(sanitizeText(entry.author.name)),
      avatarUrl: entry.author.photo,
      publishDate: entry.published ? new Date(entry.published) : new Date(entry['wm-received']),
      sourceUrl: entry.url,
      sourcePlatform: parseSourcePlatform(entry['wm-source'])
    }));
  return likes;
}

function mapComments(response: WebMentionResponse): PostComment[] {
  const comments = response.children
    .filter(
      (entry) =>
        entry['wm-property'] === 'in-reply-to' &&
        !IGNORED_AUTHOR_URLS.includes(entry.author.url) &&
        entry.author.name &&
        entry.author.photo &&
        entry.content?.text &&
        entry.author.name !== REDDIT_DELETED_STRING &&
        entry.content?.text !== REDDIT_DELETED_STRING
    )
    .map<PostComment>((entry) => ({
      authorName: sanitizeText(entry.author.name),
      authorInitials: convertNameToInitials(sanitizeText(entry.author.name)),
      avatarUrl: entry.author.photo,
      commentText: sanitizeText(entry.content?.text),
      publishDate: entry.published ? new Date(entry.published) : new Date(entry['wm-received']),
      sourceUrl: entry.url,
      sourcePlatform: parseSourcePlatform(entry['wm-source'])
    }));
  return comments;
}

function sanitizeText(input?: string): string {
  if (!input) {
    return '';
  }

  return input.trim().replaceAll('????', '');
}

function parseSourcePlatform(input: string): SourcePlatform | null {
  if (/https:\/\/brid\.gy\/(comment|like)\/reddit\//.test(input)) {
    return SourcePlatform.Reddit;
  } else if (/https:\/\/brid\.gy\/(comment|like)\/bluesky\//.test(input)) {
    return SourcePlatform.Bluesky;
  } else if (/https:\/\/brid\.gy\/(comment|like)\/mastodon\//.test(input)) {
    return SourcePlatform.Mastodon;
  }

  return null;
}

function convertNameToInitials(name: string): string {
  const names = name.trim().split(' ');

  if (names.length >= 2) {
    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  return names[0].charAt(0).toUpperCase();
}
