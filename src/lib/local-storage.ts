/**
 * Get or create a unique visitor ID and store it in local storage.
 * @returns The visitor ID.
 */
export function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('visitorId', visitorId);
  }
  return visitorId;
}

/**
 * Add a post slug to the list of liked posts in local storage.
 * @param slug The slug of the post to add to the liked posts list.
 */
export function addLikedPost(slug: string): void {
  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
  if (!likedPosts.includes(slug)) {
    likedPosts.push(slug);
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
  }
}

export function hasLikedPost(slug: string): boolean {
  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
  return likedPosts.includes(slug);
}

/**
 * Get the IDs of ECS quiz questions that were most recently answered incorrectly.
 * @returns The missed question IDs, or an empty array if none are stored or storage is unavailable.
 */
export function getMissedEcsQuestions(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem('ecsMissedQuestions') || '[]');
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Store the IDs of ECS quiz questions that were most recently answered incorrectly.
 * @param ids The missed question IDs.
 */
export function setMissedEcsQuestions(ids: string[]): void {
  try {
    localStorage.setItem('ecsMissedQuestions', JSON.stringify(ids));
  } catch {
    // Storage may be unavailable (e.g. private browsing); missed questions just won't persist
  }
}

/**
 * Get the current theme from local storage.
 * @returns The current theme ('light', 'dark', or null if not set).
 */
export function getTheme(): 'light' | 'dark' | null {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }
  return null;
}

/**
 * Set the current theme in local storage.
 * @param theme The theme to set ('light' or 'dark').
 */
export function setTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem('theme', theme);
}
