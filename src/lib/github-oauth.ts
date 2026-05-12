/**
 * OAuth utilities for GitHub authentication
 */

/**
 * Generate a cryptographically random string for OAuth state parameter
 */
export function generateRandomState(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

/**
 * Build GitHub OAuth authorization URL
 */
export function buildGithubAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  scopes = ['user:email']
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: scopes.join(' '),
    allow_signup: 'true'
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; token_type: string }> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for token: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch GitHub user profile
 */
export async function fetchGithubUser(accessToken: string): Promise<GithubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub user: ${response.statusText}`);
  }

  return response.json();
}

export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  blog: string | null;
  email: string | null;
}

export interface UserSession {
  id: string;
  github_id: number;
  github_username: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  created_at: number;
  expires_at: number;
}
