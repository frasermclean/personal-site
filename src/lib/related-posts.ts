import { getCollection, type CollectionEntry } from 'astro:content';

const SAME_CATEGORY_SCORE = 5;
const SAME_TAG_SCORE = 2;

/**
 * Calculate related posts based on category and tag similarity
 * @param slug - The slug of the current post to exclude
 * @param category - The category of the current post
 * @param tags - The tags of the current post
 * @param maxResults - Maximum number of related posts to return (default: 3)
 * @returns Array of related posts sorted by relevance
 */
export async function getRelatedPosts(
  slug: string,
  category?: string,
  tags: string[] = [],
  maxResults = 3
): Promise<CollectionEntry<'posts'>[]> {
  // Fetch all posts
  const allPosts = await getCollection('posts');

  // Filter out the current post
  const otherPosts = allPosts.filter((post) => post.id !== slug);

  // Calculate relevance score for each post
  const scoredPosts = otherPosts.map((post) => {
    let score = 0;

    // Same category adds points
    if (category && post.data.category === category) {
      score += SAME_CATEGORY_SCORE;
    }

    // Each shared tag adds points
    const sharedTags = post.data.tags.filter((tag) => tags.includes(tag));
    score += sharedTags.length * SAME_TAG_SCORE;

    return { post, score };
  });

  // Sort by score (descending) and take the top results
  return scoredPosts
    .filter((item) => item.score > 0) // Only include posts with some relevance
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.post);
}
