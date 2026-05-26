import { POSTS_PATH, SITE_URL } from '@/constants';

const API_BASE_URL = 'https://bubbles.town/api/';

interface VoteCountResponse {
  id: number | null;
  count: number;
}

export async function getVoteCount(slug: string): Promise<VoteCountResponse> {
  const url = new URL('vote-count', API_BASE_URL);
  url.searchParams.append('url', `${SITE_URL}${POSTS_PATH}/${slug}`);

  const response = await fetch(url);
  if (!response.ok) {
    return { id: null, count: 0 };
  }

  return await response.json<VoteCountResponse>();
}
