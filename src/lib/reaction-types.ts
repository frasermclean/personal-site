export interface Comment {
  authorName: string;
  authorInitials: string;
  avatarUrl: string;
  commentText: string;
  publishDate: Date;
  sourceUrl: string;
  sourcePlatform: SourcePlatform | null;
}

export interface Like {
  authorName: string;
  authorInitials: string;
  avatarUrl: string | null;
  publishDate: Date;
  sourceUrl: string | null;
  sourcePlatform: SourcePlatform | null;
}

export enum SourcePlatform {
  Reddit = 'Reddit',
  Bluesky = 'Bluesky',
  Mastodon = 'Mastodon'
}
