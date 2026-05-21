import { AuthMessage } from '@/lib/auth/auth-types';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  context.session?.destroy();
  return context.redirect(`/?auth=${AuthMessage.LogoutSuccess}`);
};
