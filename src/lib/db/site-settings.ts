import { env } from 'cloudflare:workers';

export interface SiteSettings {
  analyticsPerformance: boolean;
  analyticsReplays: boolean;
}

const DEFAULTS: SiteSettings = {
  analyticsPerformance: true,
  analyticsReplays: false
};

interface SiteSettingRow {
  key: string;
  value: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const result = await env.DB.withSession().prepare('SELECT key, value FROM site_settings').all<SiteSettingRow>();

  const settings = { ...DEFAULTS };

  for (const row of result.results) {
    if (row.key === 'analytics_performance') {
      settings.analyticsPerformance = row.value === 'true';
    } else if (row.key === 'analytics_replays') {
      settings.analyticsReplays = row.value === 'true';
    }
  }

  return settings;
}

export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const statements: D1PreparedStatement[] = [];

  if (settings.analyticsPerformance !== undefined) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO site_settings (key, value) VALUES ('analytics_performance', ?1)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind(settings.analyticsPerformance ? 'true' : 'false')
    );
  }

  if (settings.analyticsReplays !== undefined) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO site_settings (key, value) VALUES ('analytics_replays', ?1)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).bind(settings.analyticsReplays ? 'true' : 'false')
    );
  }

  if (statements.length === 0) {
    return;
  }

  await env.DB.withSession('first-primary').batch(statements);
}
