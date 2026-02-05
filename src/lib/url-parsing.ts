/**
 * Function to determine if a given URL is external (i.e., starts with http:// or https://).
 * @param url The URL to check, can be a string or a URL object.
 * @returns True if the URL is external, false otherwise.
 */
function isExternalUrl(url: string | URL | undefined | null): boolean {
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

/**
 * Get addition attributes for URL links, such as rel, target, and data-umami-event attributes for external links.
 * @param url The URL to check, can be a string or a URL object.
 * @param rel Optional rel attribute to use. If not provided, defaults to 'nofollow noopener noreferrer' for external links.
 * @returns An object containing the appropriate attributes for the link.
 */
export function getAttributesForUrl(url: string | URL | undefined | null, rel: string | null | undefined = null) {
  const isExternal = isExternalUrl(url);

  const attributes = {
    rel: rel ?? (isExternal ? 'nofollow noopener noreferrer' : null),
    target: isExternal ? '_blank' : null,
    'data-umami-event': isExternal ? 'external-link-click' : null,
    'data-umami-event-url': isExternal ? url : null
  };

  return attributes;
}
