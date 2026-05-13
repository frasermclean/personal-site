import { env } from 'cloudflare:workers';

interface SyndicationLinksRecord {
  slug: string;
  links: string[];
  updatedAt: string;
  revision: number;
}

export async function getLinks(slug: string): Promise<string[] | null> {
  const value = await env.POST_SYNDICATION.get(slug);
  if (!value) {
    return null;
  }

  try {
    const record = JSON.parse(value) as SyndicationLinksRecord;
    return sanitizeLinks(record.links);
  } catch (error) {
    console.error(`Failed to parse syndication links for slug "${slug}"`, error);
    return null;
  }
}

export async function saveLinks(slug: string, links: string[]): Promise<string> {
  const existing = await env.POST_SYNDICATION.get(slug);
  let previousRevision = 0;

  if (existing) {
    try {
      previousRevision = (JSON.parse(existing) as SyndicationLinksRecord).revision ?? 0;
    } catch {
      previousRevision = 0;
    }
  }

  const sanitizedLinks = sanitizeLinks(links);
  const record: SyndicationLinksRecord = {
    slug,
    links: sanitizedLinks,
    updatedAt: new Date().toISOString(),
    revision: previousRevision + 1
  };

  await env.POST_SYNDICATION.put(slug, JSON.stringify(record));
  return record.updatedAt;
}

export function sanitizeLinks(links: string[]): string[] {
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
    } catch {
      // ignore invalid URL values
    }
  }

  return Array.from(deduplicated);
}
