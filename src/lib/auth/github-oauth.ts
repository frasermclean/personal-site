import type { components } from '@octokit/openapi-types';

const API_VERSION = '2026-03-10';
const USER_AGENT = 'FM-Site-OAuth';

const AUTHORIZATION_ENDPOINT = 'https://github.com/login/oauth/authorize';
const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';

/**
 * OAuth utilities for GitHub authentication
 */

export class GitHubOAuthError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'GitHubOAuthError';
  }
}

/**
 * Generate a cryptographically random string for OAuth state parameter
 */
export function generateRandomState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function createOAuthConfig(clientId: string, clientSecret: string, origin: string): OAuthConfig {
  if (!clientId) {
    throw new Error('GitHub Client ID is required');
  }
  if (!clientSecret) {
    throw new Error('GitHub Client Secret is required');
  }
  if (!origin) {
    throw new Error('Origin is required to construct redirect URI');
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${origin}/api/auth/callback`
  };
}

/**
 * Validate that GitHub OAuth credentials are provided
 * @param config GitHub OAuth configuration
 */
function validateConfig(config: OAuthConfig): void {
  const { clientId, clientSecret, redirectUri } = config;
  const errors: string[] = [];

  if (!clientId) {
    errors.push('GitHub Client ID is required');
  }

  if (!clientSecret) {
    errors.push('GitHub Client Secret is required');
  }

  if (!redirectUri) {
    errors.push('GitHub Redirect URI is required');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid GitHub OAuth configuration: ${errors.join(', ')}`);
  }
}

/**
 * Build GitHub OAuth authorization URL
 * @param config GitHub OAuth configuration
 * @param state OAuth state parameter
 * @param scopes OAuth scopes
 */
export function buildGithubAuthUrl(config: OAuthConfig, state: string, scopes = ['user:email']): string {
  validateConfig(config);
  const { clientId, redirectUri } = config;

  const authUrl = new URL(AUTHORIZATION_ENDPOINT);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('allow_signup', 'true');
  return authUrl.toString();
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(code: string, config: OAuthConfig): Promise<TokenResponse> {
  validateConfig(config);
  const { clientId, clientSecret, redirectUri } = config;

  let response: Response;
  try {
    response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      }).toString()
    });
  } catch (error) {
    throw new GitHubOAuthError('Failed to reach GitHub token endpoint', { cause: error });
  }

  if (!response.ok) {
    throw new GitHubOAuthError(`GitHub token endpoint returned ${response.status}: ${response.statusText}`);
  }

  const body = (await response.json()) as GitHubTokenResponseBody;
  if ('error' in body) {
    throw new GitHubOAuthError(`GitHub rejected the authorization code: ${body.error_description ?? body.error}`);
  }

  return {
    accessToken: body.access_token,
    tokenType: body.token_type
  };
}

/**
 * Fetch GitHub user profile
 */
export async function fetchGithubUser(accessToken: string, tokenType: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `${tokenType} ${accessToken}`,
      'User-Agent': USER_AGENT,
      'X-GitHub-Api-Version': API_VERSION
    }
  });

  if (!response.ok) {
    throw new GitHubOAuthError(`Failed to fetch GitHub user: ${response.statusText}`);
  }

  return response.json();
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export type GitHubUser = components['schemas']['private-user'];

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
}

type GitHubTokenResponseBody =
  | { access_token: string; token_type: string; scope: string }
  | { error: string; error_description?: string; error_uri?: string };
