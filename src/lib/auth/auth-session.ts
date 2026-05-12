import { env } from 'cloudflare:workers';
import { daysToSeconds } from '../time-seconds';
import type { UserSession } from './auth-types';

const SESSION_MAX_AGE = daysToSeconds(30);

export async function storeUserSession(session: UserSession): Promise<void> {
  await env.SESSION.put(session.id, JSON.stringify(session), {
    expirationTtl: SESSION_MAX_AGE
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
