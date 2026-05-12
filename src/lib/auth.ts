import type { UserSession } from '@/lib/github-oauth';
import type { AstroCookies } from 'astro';
import { env } from 'cloudflare:workers';

export type CurrentUser = UserSession;

export const SESSION_COOKIE_NAME = 'session_id';
export const OAUTH_STATE_COOKIE_NAME = 'github_oauth_state';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

export function getSessionId(cookies: Pick<AstroCookies, 'get'>): string | undefined {
  return cookies.get(SESSION_COOKIE_NAME)?.value;
}

export async function storeUserSession(session: UserSession): Promise<void> {
  await env.SESSION.put(session.id, JSON.stringify(session), {
    expirationTtl: SESSION_MAX_AGE_SECONDS
  });
}

export async function deleteUserSession(sessionId: string): Promise<void> {
  await env.SESSION.delete(sessionId);
}

export async function getUserSession(sessionId: string): Promise<CurrentUser | null> {
  const rawSession = await env.SESSION.get(sessionId);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as UserSession;

    if (session.expires_at <= Date.now()) {
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

export async function getCurrentUser(cookies: Pick<AstroCookies, 'get'>): Promise<CurrentUser | null> {
  const sessionId = getSessionId(cookies);

  if (!sessionId) {
    return null;
  }

  return getUserSession(sessionId);
}

export function setSessionCookie(cookies: AstroCookies, sessionId: string, url: URL): void {
  cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isSecureCookieRequest(url),
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/'
  });
}

export function clearSessionCookie(cookies: AstroCookies, url: URL): void {
  cookies.delete(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecureCookieRequest(url),
    sameSite: 'lax',
    path: '/'
  });
}

export function setOauthStateCookie(cookies: AstroCookies, state: string, url: URL): void {
  cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: isSecureCookieRequest(url),
    sameSite: 'lax',
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    path: '/'
  });
}

export function clearOauthStateCookie(cookies: AstroCookies, url: URL): void {
  cookies.delete(OAUTH_STATE_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecureCookieRequest(url),
    sameSite: 'lax',
    path: '/'
  });
}

function isSecureCookieRequest(url: URL): boolean {
  return url.protocol === 'https:';
}
