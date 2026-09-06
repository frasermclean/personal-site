CREATE TABLE IF NOT EXISTS now_page_revisions (
  id INTEGER PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(content)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_now_page_revisions_created_at
  ON now_page_revisions (created_at DESC);

INSERT INTO now_page_revisions (content) VALUES (
'## What I''m up to

This is a [now page](https://nownownow.com/about) - a snapshot of what I''m focused on at the moment, updated
whenever something changes.

- Building out new features for this site, including this now page
- Working through a backlog of blog post drafts
- Tinkering with a self-hosted homelab setup

## Reading

- *The Pragmatic Programmer* - a re-read, this time with more experience under my belt

Check back for updates - this page changes as things do.'
);
