import { SITE_URL } from '@/constants';
import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts');
  const urlEntries = posts
    .map((post) => {
      const updatedAt = post.data.publishDate.toISOString();
      return `<url><loc>${SITE_URL}/posts/${post.id}</loc><lastmod>${updatedAt}</lastmod></url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
