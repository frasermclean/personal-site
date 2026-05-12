import { daysToSeconds, minutesToSeconds } from '@/lib/time-seconds';
import type { AstroCookies } from 'astro';

const SESSION_COOKIE_NAME = 'session_id';
const OAUTH_STATE_COOKIE_NAME = 'github_oauth_state';
const RETURN_TO_COOKIE_NAME = 'return_to';
const SESSION_MAX_AGE = daysToSeconds(30);
const STATE_MAX_AGE = minutesToSeconds(10);

export function getSessionId(cookies: Pick<AstroCookies, 'get'>): string | undefined {
  return cookies.get(SESSION_COOKIE_NAME)?.value;
}

export function setSessionCookie(cookies: AstroCookies, sessionId: string, url: URL): void {
  setCookie(cookies, SESSION_COOKIE_NAME, sessionId, url, SESSION_MAX_AGE);
}

export function clearSessionCookie(cookies: AstroCookies, url: URL): void {
  clearCookie(cookies, SESSION_COOKIE_NAME, url);
}

export function setOauthStateCookie(cookies: AstroCookies, state: string, url: URL): void {
  setCookie(cookies, OAUTH_STATE_COOKIE_NAME, state, url, STATE_MAX_AGE);
}

export function getOauthStateCookie(cookies: AstroCookies): string | undefined {
  return cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
}

export function clearOauthStateCookie(cookies: AstroCookies, url: URL): void {
  clearCookie(cookies, OAUTH_STATE_COOKIE_NAME, url);
}

export function setReturnToCookie(cookies: AstroCookies, returnTo: string, url: URL): void {
  setCookie(cookies, RETURN_TO_COOKIE_NAME, returnTo, url, STATE_MAX_AGE);
}

export function getAndClearReturnToCookie(cookies: AstroCookies, url: URL): string {
  const returnTo = cookies.get(RETURN_TO_COOKIE_NAME)?.value;
  clearCookie(cookies, RETURN_TO_COOKIE_NAME, url);

  // Only allow relative paths to prevent open redirect
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }

  return '/';
}

function setCookie(cookies: AstroCookies, name: string, value: string, url: URL, maxAge: number): void {
  cookies.set(name, value, getCookieOptions(url, maxAge));
}

function clearCookie(cookies: AstroCookies, name: string, url: URL): void {
  cookies.delete(name, getCookieOptions(url, undefined));
}

function getCookieOptions(url: URL, maxAge?: number) {
  return {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax' as const,
    path: '/',
    ...(maxAge ? { maxAge } : {})
  };
}
