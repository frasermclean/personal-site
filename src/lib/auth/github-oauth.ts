import type { components } from '@octokit/openapi-types';
import { ArcticFetchError, generateState, GitHub, OAuth2RequestError } from 'arctic';

const API_VERSION = '2026-03-10';
const USER_AGENT = 'FM-Site-OAuth';

/**
 * OAuth utilities for GitHub authentication
 */

/**
 * Generate a cryptographically random string for OAuth state parameter
 */
export function generateRandomState(): string {
  return generateState();
}

/**
 * Validate that GitHub OAuth credentials are provided
 * @param clientId GitHub Client ID
 * @param clientSecret GitHub Client Secret
 * @param redirectUri GitHub Redirect URI
 */
export function validateConfig(config: OAuthConfig): void {
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
  const { clientId, clientSecret, redirectUri } = config;
  const github = new GitHub(clientId, clientSecret, redirectUri);
  const authUrl = github.createAuthorizationURL(state, scopes);
  authUrl.searchParams.set('allow_signup', 'true');
  return authUrl.toString();
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(code: string, config: OAuthConfig): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = config;
  const github = new GitHub(clientId, clientSecret, redirectUri);
  try {
    const tokens = await github.validateAuthorizationCode(code);
    return {
      accessToken: tokens.accessToken(),
      tokenType: tokens.tokenType()
    };
  } catch (error) {
    if (error instanceof OAuth2RequestError) {
      console.error('Invalid code, credentials, or redirect URI', error);
      throw error;
    }

    if (error instanceof ArcticFetchError) {
      console.error('Failed to fetch data from GitHub', error);
      throw error;
    }

    console.log('Unexpected error during code for token exchange', error);
    throw error;
  }
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
    throw new Error(`Failed to fetch GitHub user: ${response.statusText}`);
  }

  return response.json();
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
