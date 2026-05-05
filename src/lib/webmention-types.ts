export interface WebMentionResponse {
  type: string;
  name: string;
  children: WebMentionEntry[];
}

interface WebMentionEntry {
  type: string;
  author: WebMentionEntryAuthor;
  url: string;
  published: string;
  'wm-received': string;
  'wm-id': number;
}

interface WebMentionEntryAuthor {
  type: string;
  name: string;
  photo: string;
  url: string;
}
