import { defineMiddleware } from 'astro:middleware';
import { getSessionId } from './lib/auth/auth-cookies';
import { getUserSession } from './lib/auth/auth-session';

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

  const sessionId = getSessionId(context.cookies);
  context.locals.user = sessionId ? await getUserSession(sessionId) : null;

  const response = await next();

  // server errors should never be cached
  if (response.status >= 500) {
    response.headers.set('Cache-Control', 'no-store');
    response.headers.delete('CDN-Cache-Control');
    return response;
  }

  // respect explicit cache headers already set by a route
  if (response.headers.has('Cache-Control') || response.headers.has('CDN-Cache-Control')) {
    return response;
  }

  const method = request.method.toUpperCase();
  const pathname = url.pathname;

  // if user is logged in, cache only on the browser with private caching
  if (context.locals.user) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.delete('CDN-Cache-Control');
    return response;
  }

  // mutating requests should never be cached
  if (method !== 'GET' && method !== 'HEAD') {
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  // astro actions and API routes should never be cached
  if (pathname.startsWith('/_actions') || pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
    response.headers.delete('CDN-Cache-Control');
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
