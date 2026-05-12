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
 * Build GitHub OAuth authorization URL
 */
export function buildGithubAuthUrl(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  state: string,
  scopes = ['user:email']
): string {
  const github = new GitHub(clientId, clientSecret, redirectUri);
  const authUrl = github.createAuthorizationURL(state, scopes);
  authUrl.searchParams.set('allow_signup', 'true');
  return authUrl.toString();
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; tokenType: string }> {
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
