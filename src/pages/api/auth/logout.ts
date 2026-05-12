import { clearSessionCookie, getSessionId } from '@/lib/auth/auth-cookies';
import { deleteUserSession } from '@/lib/auth/auth-session';
import { AuthMessage } from '@/lib/auth/auth-types';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const sessionId = getSessionId(context.cookies);

  if (sessionId) {
    await deleteUserSession(sessionId);
  }

  clearSessionCookie(context.cookies, context.url);
  return context.redirect(`/?auth=${AuthMessage.LogoutSuccess}`);
};
