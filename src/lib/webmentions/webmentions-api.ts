const API_BASE_URL = 'https://webmention.io/api/';

export async function fetchWebMentions(
  target: string,
  properties: WebMentionProperty[] = ['like-of', 'in-reply-to']
): Promise<WebMentionResponse> {
  const propertyFilter = properties.map((prop) => `wm-property[]=${encodeURIComponent(prop)}`).join('&');
  const url = new URL(`mentions.jf2?target=${encodeURIComponent(target)}&${propertyFilter}`, API_BASE_URL);
  const response = await fetch(url);

  if (!response.ok) {
    throw new WebMentionError('Failed to fetch web mentions', { targetUrl: target, response });
  }

  try {
    return await response.json<WebMentionResponse>();
  } catch (error) {
    throw new WebMentionError(
      'Failed to parse web mentions response',
      { targetUrl: target },
      error instanceof Error ? { cause: error } : undefined
    );
  }
}

export interface WebMentionResponse {
  type: string;
  name: string;
  children: WebMentionEntry[];
}

export type WebMentionProperty = 'in-reply-to' | 'like-of' | 'repost-of' | 'bookmark-of' | 'mention-of' | 'rsvp';

interface WebMentionEntry {
  type: 'entry';
  author: WebMentionEntryAuthor;
  url: string;
  published: string | null;
  'wm-received': string;
  'wm-id': number;
  'wm-source': string;
  'wm-target': string;
  'wm-property': WebMentionProperty;
  'wm-protocol': string;
  content?: {
    text: string;
    html: string;
  };
}

interface WebMentionEntryAuthor {
  type: string;
  name: string;
  photo: string;
  url: string;
}

export class WebMentionError extends Error {
  constructor(
    message: string,
    public readonly context: { targetUrl: string; response?: Response },
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'WebMentionError';
  }
}
