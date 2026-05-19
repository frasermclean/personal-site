import { env } from 'cloudflare:workers';

interface SyndicationLinkRow {
  url: string;
}

export async function getLinks(slug: string): Promise<string[]> {
  const result = await env.DB.withSession()
    .prepare('SELECT url FROM post_syndication_links WHERE slug = ?1 ORDER BY position ASC')
    .bind(slug)
    .all<SyndicationLinkRow>();

  return sanitizeLinks(result.results.map((row) => row.url));
}

export async function saveLinks(slug: string, links: string[]): Promise<void> {
  const sanitizedLinks = sanitizeLinks(links);

  const statements: D1PreparedStatement[] = [
    env.DB.prepare('DELETE FROM post_syndication_links WHERE slug = ?1').bind(slug)
  ];

  statements.push(
    ...sanitizedLinks.map((url, position) =>
      env.DB.prepare('INSERT INTO post_syndication_links (slug, url, position) VALUES (?1, ?2, ?3)').bind(
        slug,
        url,
        position
      )
    )
  );

  await env.DB.withSession('first-primary').batch(statements);
}

function sanitizeLinks(links: string[]): string[] {
  const deduplicated = new Set<string>();

  for (const value of links) {
    if (typeof value !== 'string') {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      continue;
    }

    try {
      const url = new URL(trimmed);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        deduplicated.add(trimmed);
      }
    } catch (error) {
      console.warn(`Invalid URL: ${trimmed}`, error);
    }
  }

  return Array.from(deduplicated);
}
