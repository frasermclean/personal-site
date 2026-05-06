import { defineMiddleware } from 'astro:middleware';

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const FIFTEEN_MINUTES_IN_SECONDS = 60 * 15;
const THIRTY_MINUTES_IN_SECONDS = 60 * 30;

/**
 * Route-aware caching strategy for Cloudflare SSR:
 * - Never cache mutating requests or action/API-like endpoints
 * - Cache public HTML briefly at edge with stale-while-revalidate
 * - Cache feeds/sitemaps slightly longer at edge
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  const response = await next();

  // respect explicit cache headers already set by a route
  if (response.headers.has('Cache-Control') || response.headers.has('CDN-Cache-Control')) {
    return response;
  }

  const method = request.method.toUpperCase();
  const pathname = url.pathname;

  // mutating requests should never be cached
  if (method !== 'GET' && method !== 'HEAD') {
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  // astro actions and API-like endpoints should never be cached
  if (pathname.startsWith('/_actions') || pathname.startsWith('/api/') || pathname.startsWith('/actions/')) {
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  // rss and sitemap XML can be cached moderately
  if (pathname.endsWith('.xml') || pathname.startsWith('/rss')) {
    response.headers.set('Cache-Control', 'public, max-age=300, must-revalidate');
    response.headers.set(
      'CDN-Cache-Control',
      `public, s-maxage=${THIRTY_MINUTES_IN_SECONDS}, stale-while-revalidate=${ONE_DAY_IN_SECONDS}, stale-if-error=${ONE_DAY_IN_SECONDS}`
    );
    return response;
  }

  // public SSR pages: quick browser revalidation, warmer edge cache
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  response.headers.set(
    'CDN-Cache-Control',
    `public, s-maxage=${FIFTEEN_MINUTES_IN_SECONDS}, stale-while-revalidate=${ONE_DAY_IN_SECONDS}, stale-if-error=${ONE_DAY_IN_SECONDS}`
  );

  return response;
});
