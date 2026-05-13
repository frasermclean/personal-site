import type { components } from '@octokit/openapi-types';
import { generateState, GitHub } from 'arctic';

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
  const tokens = await github.validateAuthorizationCode(code);

  return {
    accessToken: tokens.accessToken(),
    tokenType: tokens.tokenType()
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
      'User-Agent': 'frasermclean-site-oauth',
      'X-GitHub-Api-Version': '2022-11-28'
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
