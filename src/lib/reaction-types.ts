export interface PostComment {
  authorName: string;
  authorInitials: string;
  avatarUrl: string;
  commentText: string;
  publishDate: Date;
  sourceUrl: string;
  sourcePlatform: SourcePlatform | null;
}

export interface PostLike {
  authorName: string;
  authorInitials: string;
  avatarUrl: string;
  publishDate: Date;
  sourceUrl: string;
  sourcePlatform: SourcePlatform | null;
}

export enum SourcePlatform {
  Reddit = 'Reddit',
  Bluesky = 'Bluesky',
  Mastodon = 'Mastodon'
}
