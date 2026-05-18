CREATE TABLE IF NOT EXISTS post_syndication_links (
  slug TEXT NOT NULL,
  url TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (slug, url)
);

CREATE INDEX IF NOT EXISTS idx_post_syndication_links_slug_position
  ON post_syndication_links (slug, position);
