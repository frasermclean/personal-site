CREATE TABLE IF NOT EXISTS post_likes (
  session_id TEXT NOT NULL,
  post_slug TEXT NOT NULL,
  liked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name TEXT,
  email TEXT,
  CHECK (length(trim(session_id)) > 0),
  CHECK (length(trim(post_slug)) > 0),
  PRIMARY KEY (session_id, post_slug)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_slug_liked_at
  ON post_likes (post_slug, liked_at DESC);
