import { AuthMessage, clearSessionCookie, deleteUserSession, getSessionId } from '@/lib/auth';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const sessionId = getSessionId(context.cookies);

  if (sessionId) {
    await deleteUserSession(sessionId);
  }

  clearSessionCookie(context.cookies, context.url);
  return context.redirect(`/?auth=${AuthMessage.LogoutSuccess}`);
};
