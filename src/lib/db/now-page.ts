import { env } from 'cloudflare:workers';

export interface NowPageRevision {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NowPageRevisionRow {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches the current now page revision.
 * @returns The latest now page revision, or null if none exists.
 */
export async function getCurrentRevision(): Promise<NowPageRevision | null> {
  try {
    const row = await env.DB.withSession()
      .prepare('SELECT id, content, created_at, updated_at FROM now_page_revisions ORDER BY id DESC LIMIT 1')
      .first<NowPageRevisionRow>();

    return row ? mapRow(row) : null;
  } catch (error) {
    console.error('Error fetching current now page revision', { error });
    return null;
  }
}

/**
 * Fetches the revision history of the now page.
 * @param limit The maximum number of revisions to fetch.
 * @returns An array of now page revisions, ordered from newest to oldest.
 */
export async function getRevisionHistory(limit = 20): Promise<NowPageRevision[]> {
  try {
    const result = await env.DB.withSession()
      .prepare('SELECT id, content, created_at, updated_at FROM now_page_revisions ORDER BY id DESC LIMIT ?1')
      .bind(limit)
      .all<NowPageRevisionRow>();

    return result.results.map(mapRow);
  } catch (error) {
    console.error('Error fetching now page history', { error });
    return [];
  }
}

/**
 * Publishes a new revision, adding an entry to the history.
 */
export async function createNowPageRevision(content: string): Promise<void> {
  try {
    await env.DB.withSession('first-primary')
      .prepare('INSERT INTO now_page_revisions (content) VALUES (?1)')
      .bind(content)
      .run();
  } catch (error) {
    throw new NowPagePersistenceError('Failed to create now page revision', { cause: error });
  }
}

/**
 * Corrects the current revision in place (e.g. fixing a typo) without adding a history entry.
 */
export async function updateCurrentRevision(content: string): Promise<void> {
  try {
    await env.DB.withSession('first-primary')
      .prepare(
        `UPDATE now_page_revisions
         SET content = ?1, updated_at = CURRENT_TIMESTAMP
         WHERE id = (SELECT id FROM now_page_revisions ORDER BY id DESC LIMIT 1)`
      )
      .bind(content)
      .run();
  } catch (error) {
    throw new NowPagePersistenceError('Failed to update current now page revision', { cause: error });
  }
}

function mapRow(row: NowPageRevisionRow): NowPageRevision {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class NowPagePersistenceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NowPagePersistenceError';
  }
}
