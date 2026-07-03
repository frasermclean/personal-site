CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(key)) > 0)
);

INSERT INTO site_settings (key, value) VALUES ('analytics_performance', 'true');
INSERT INTO site_settings (key, value) VALUES ('analytics_replays', 'false');
