import { getPostLikes, type PostLikeRecord } from '@/lib/db/post-likes';
import { getGravatarUrl } from '@/lib/gravatar';
import { type Like } from '@/lib/reaction-types';
import { nameToInitials } from '@/lib/string-handling';
import { fetchWebMentions } from '@/lib/webmentions/webmentions-api';
import { mapComments, mapLikes } from '@/lib/webmentions/webmentions-mapping';
import { z } from 'astro/zod';
import { defineAction } from 'astro:actions';

export const getPostReactions = defineAction({
  input: z.object({
    slug: z.string()
  }),
  handler: async ({ slug }) => {
    const dbLikes = await getDbLikes(slug);
    const { likes: wmLikes, comments: wmComments } = await getWebMentionReactions(slug);

    return {
      likes: [...dbLikes, ...wmLikes].sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime()),
      comments: wmComments
    };
  }
});

async function getWebMentionReactions(slug: string) {
  const target = `https://frasermclean.com/posts/${slug}`;
  try {
    const response = await fetchWebMentions(target, ['like-of', 'in-reply-to']);
    return {
      likes: mapLikes(response),
      comments: mapComments(response)
    };
  } catch (error) {
    console.error('Error fetching web mentions:', error);
    return { likes: [], comments: [] };
  }
}

async function getDbLikes(slug: string): Promise<Like[]> {
  try {
    const records = await getPostLikes(slug);
    return await Promise.all(records.map(mapRecordToLike));
  } catch (error) {
    console.error('Error fetching local likes:', error);
    return [];
  }
}

const mapRecordToLike = async (record: PostLikeRecord): Promise<Like> => ({
  authorName: record.name ?? 'Anonymous',
  authorInitials: nameToInitials(record.name ?? 'Anonymous'),
  publishDate: new Date(record.liked_at),
  avatarUrl: record.email ? await getGravatarUrl(record.email ?? '') : null,
  sourceUrl: null,
  sourcePlatform: null
});
