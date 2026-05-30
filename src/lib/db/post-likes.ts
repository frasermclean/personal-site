import { env } from 'cloudflare:workers';

export interface PostLikeRecord {
  name: string | null;
  email: string | null;
  liked_at: string;
}

export async function getPostLikes(postSlug: string): Promise<PostLikeRecord[]> {
  try {
    const result = await env.DB.withSession()
      .prepare(`SELECT name, email, liked_at FROM post_likes WHERE post_slug = ?1`)
      .bind(postSlug)
      .all<PostLikeRecord>();

    return result.results;
  } catch (error) {
    console.error('Error fetching post likes', { postSlug, error });
    return [];
  }
}

export async function upsertPostLike(visitorId: string, postSlug: string, name?: string, email?: string) {
  const normalizedName = name?.trim() ?? null;
  const normalizedEmail = email?.trim().toLowerCase() ?? null;

  try {
    await env.DB.withSession('first-primary')
      .prepare(
        `INSERT INTO post_likes (visitor_id, post_slug, liked_at, name, email)
           VALUES (?1, ?2, CURRENT_TIMESTAMP, ?3, ?4)
           ON CONFLICT(visitor_id, post_slug) DO UPDATE SET
             liked_at = excluded.liked_at,
             name = COALESCE(excluded.name, post_likes.name),
             email = COALESCE(excluded.email, post_likes.email)`
      )
      .bind(visitorId, postSlug, normalizedName, normalizedEmail)
      .run();
  } catch (error) {
    throw new PostLikePersistenceError(
      'Failed to upsert post like',
      {
        visitorId,
        postSlug
      },
      { cause: error }
    );
  }
}

export class PostLikePersistenceError extends Error {
  constructor(
    message: string,
    public readonly context: { visitorId: string; postSlug: string },
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'PostLikePersistenceError';
  }
}
