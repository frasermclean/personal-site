export interface WebMentionResponse {
  type: string;
  name: string;
  children: WebMentionEntry[];
}

export interface WebMentionEntry {
  type: 'entry';
  author: WebMentionEntryAuthor;
  url: string;
  published: string | null;
  'wm-received': string;
  'wm-id': number;
  'wm-source': string;
  'wm-target': string;
  'wm-property': 'in-reply-to' | 'like-of' | 'repost-of' | 'bookmark-of' | 'mention-of' | 'rsvp';
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
