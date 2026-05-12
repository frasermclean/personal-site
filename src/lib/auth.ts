import type { AstroCookies } from 'astro';
import { env } from 'cloudflare:workers';

export interface UserSession {
  id: string;
  githubId: number;
  githubUsername: string;
  name: string | null;
  avatarUrl: string;
  email: string | null;
  createdAt: number;
  expiresAt: number;
}

const SESSION_COOKIE_NAME = 'session_id';
const OAUTH_STATE_COOKIE_NAME = 'github_oauth_state';
const RETURN_TO_COOKIE_NAME = 'return_to';
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const TEN_MINUTES_IN_SECONDS = 10 * 60;

export function getSessionId(cookies: Pick<AstroCookies, 'get'>): string | undefined {
  return cookies.get(SESSION_COOKIE_NAME)?.value;
}

export async function storeUserSession(session: UserSession): Promise<void> {
  await getSessionStore().put(session.id, JSON.stringify(session), {
    expirationTtl: SESSION_MAX_AGE_SECONDS
  });
}

export async function deleteUserSession(sessionId: string): Promise<void> {
  await getSessionStore().delete(sessionId);
}

export async function getUserSession(sessionId: string): Promise<UserSession | null> {
  const sessionJson = await getSessionStore().get(sessionId);

  if (!sessionJson) {
    return null;
  }

  try {
    const session = JSON.parse(sessionJson) as UserSession;

    if (session.expiresAt <= Date.now()) {
      await deleteUserSession(sessionId);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to parse stored user session:', error);
    await deleteUserSession(sessionId);
    return null;
  }
}

export async function getCurrentUser(cookies: Pick<AstroCookies, 'get'>): Promise<UserSession | null> {
  const sessionId = getSessionId(cookies);

  if (!sessionId) {
    return null;
  }

  return getUserSession(sessionId);
}

export function setSessionCookie(cookies: AstroCookies, sessionId: string, url: URL): void {
  setCookie(cookies, SESSION_COOKIE_NAME, sessionId, url, SESSION_MAX_AGE_SECONDS);
}

export function clearSessionCookie(cookies: AstroCookies, url: URL): void {
  clearCookie(cookies, SESSION_COOKIE_NAME, url);
}

export function setOauthStateCookie(cookies: AstroCookies, state: string, url: URL): void {
  setCookie(cookies, OAUTH_STATE_COOKIE_NAME, state, url, TEN_MINUTES_IN_SECONDS);
}

export function getOauthStateCookie(cookies: AstroCookies): string | undefined {
  return cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
}

export function clearOauthStateCookie(cookies: AstroCookies, url: URL): void {
  clearCookie(cookies, OAUTH_STATE_COOKIE_NAME, url);
}

export function setReturnToCookie(cookies: AstroCookies, returnTo: string, url: URL): void {
  setCookie(cookies, RETURN_TO_COOKIE_NAME, returnTo, url, TEN_MINUTES_IN_SECONDS);
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

function getSessionStore(): KVNamespace {
  return env.SESSION;
}

function setCookie(cookies: AstroCookies, name: string, value: string, url: URL, maxAge: number): void {
  cookies.set(name, value, getCookieOptions(url, maxAge));
}

function clearCookie(cookies: AstroCookies, name: string, url: URL): void {
  cookies.delete(name, getCookieOptions(url));
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
