/**
 * Function to determine if a given URL is external (i.e., starts with http:// or https://).
 * @param url The URL to check, can be a string or a URL object.
 * @returns True if the URL is external, false otherwise.
 */
export function isExternalUrl(url: string | URL | undefined | null): boolean {
  if (!url) {
    return false;
  }

  // handle URL objects
  if (url instanceof URL) {
    return url.protocol === 'http:' || url.protocol === 'https:';
  }

  // handle string URLs
  return /^https?:\/\//.test(url);
}
