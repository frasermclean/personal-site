import { POSTS_PATH, SITE_DESCRIPTION, SITE_TITLE } from '@/constants';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts')).sort(
    (a, b) => new Date(b.data.publishDate) - new Date(a.data.publishDate)
  );
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: `${POSTS_PATH}/${post.id}`
    })),
    stylesheet: '/pretty-feed-v3.xsl'
  });
}
