import { env } from 'cloudflare:workers';
import type { UserSession } from './auth-types';

const SESSION_COOKIE_NAME = 'session_id';
const OAUTH_STATE_COOKIE_NAME = 'github_oauth_state';
const RETURN_TO_COOKIE_NAME = 'return_to';
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const TEN_MINUTES_IN_SECONDS = 10 * 60;

export async function storeUserSession(session: UserSession): Promise<void> {
  await env.SESSION.put(session.id, JSON.stringify(session), {
    expirationTtl: SESSION_MAX_AGE_SECONDS
  });
}

export async function deleteUserSession(sessionId: string): Promise<void> {
  await env.SESSION.delete(sessionId);
}

export async function getUserSession(sessionId: string): Promise<UserSession | null> {
  const sessionJson = await env.SESSION.get(sessionId);

  if (!sessionJson) {
    console.warn(`No session found for ID: ${sessionId}`);
    return null;
  }

  try {
    const session = JSON.parse(sessionJson) as UserSession;

    if (session.expiresAt <= Date.now()) {
      await deleteUserSession(sessionId);
      console.warn(`Session expired for ID: ${sessionId}`);
      return null;
    }

    return session;
  } catch (error) {
    console.error(`Failed to parse stored user session for ID: ${sessionId}`, error);
    await deleteUserSession(sessionId);
    return null;
  }
}
