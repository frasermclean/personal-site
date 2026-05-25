import { getPostLikes as getLocalDbLikes } from '@/lib/db/post-likes';
import { getGravatarUrl } from '@/lib/gravatar';
import { type Like } from '@/lib/reaction-types';
import { nameToInitials } from '@/lib/string-handling';
import { fetchWebMentions } from '@/lib/webmentions/webmentions-api';
import { mapWebMentionLikes } from '@/lib/webmentions/webmentions-mapping';
import { z } from 'astro/zod';
import { defineAction } from 'astro:actions';

export const getPostLikes = defineAction({
  input: z.object({
    slug: z.string()
  }),
  handler: async ({ slug }) => {
    const dbLikes = await getLocalLikes(slug);
    const wmLikes = await getWebMentionLikes(slug);
    const allLikes = [...dbLikes, ...wmLikes].sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
    console.log(`Fetched ${dbLikes.length} local likes and ${wmLikes.length} webmention likes for post ${slug}`);

    return {
      likes: allLikes
    };
  }
});

async function getWebMentionLikes(slug: string) {
  const target = `https://frasermclean.com/posts/${slug}`;
  try {
    const response = await fetchWebMentions(target, ['like-of']);
    return mapWebMentionLikes(response);
  } catch (error) {
    console.error('Error fetching web mentions:', error);
    return [];
  }
}

async function getLocalLikes(slug: string): Promise<Like[]> {
  try {
    const records = await getLocalDbLikes(slug);
    console.log(`Records`, records);
    const likes = await Promise.all(
      records.map(
        async (record): Promise<Like> => ({
          authorName: record.name ?? 'Anonymous',
          authorInitials: nameToInitials(record.name ?? 'Anonymous'),
          publishDate: new Date(record.liked_at),
          avatarUrl: record.email ? await getGravatarUrl(record.email ?? '') : null,
          sourceUrl: null,
          sourcePlatform: null
        })
      )
    );
    return likes;
  } catch (error) {
    console.error('Error fetching local likes:', error);
  }
  return [];
}
