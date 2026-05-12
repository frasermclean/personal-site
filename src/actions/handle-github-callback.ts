import { clearOauthStateCookie, OAUTH_STATE_COOKIE_NAME, setSessionCookie, storeUserSession } from '@/lib/auth';
import { exchangeCodeForToken, fetchGithubUser, type UserSession } from '@/lib/github-oauth';
import type { APIContext } from 'astro';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } from 'astro:env/server';

/**
 * Handle GitHub OAuth callback
 * Exchanges authorization code for access token and creates user session
 */
export async function handleGithubCallback(code: string, state: string, context: Pick<APIContext, 'cookies' | 'url'>) {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_REDIRECT_URI) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  // Validate state parameter
  const storedState = context.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  if (!storedState || storedState !== state) {
    throw new Error('State parameter mismatch');
  }

  // Clear the state cookie
  clearOauthStateCookie(context.cookies, context.url);

  try {
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, code, GITHUB_REDIRECT_URI);

    if (!tokenData.access_token) {
      throw new Error('No access token received from GitHub');
    }

    // Fetch user profile
    const user = await fetchGithubUser(tokenData.access_token);

    // Create session object
    const now = Date.now();
    const sessionId = crypto.randomUUID();
    const session: UserSession = {
      id: sessionId,
      github_id: user.id,
      github_username: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      email: user.email,
      created_at: now,
      expires_at: now + 30 * 24 * 60 * 60 * 1000 // 30 days
    };

    await storeUserSession(session);
    setSessionCookie(context.cookies, sessionId, context.url);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email
      }
    };
  } catch (error) {
    throw new Error(`GitHub authentication failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
