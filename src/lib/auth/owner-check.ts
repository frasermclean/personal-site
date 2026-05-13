import { OWNER_GITHUB_ID } from 'astro:env/server';
import type { UserSession } from './auth-types';

export function isOwner(user: UserSession | null): user is UserSession {
  const ownerGithubId = parseOwnerGithubId();
  return ownerGithubId !== null && !!user && user.githubId === ownerGithubId;
}

export function hasOwnerConfiguration(): boolean {
  return parseOwnerGithubId() !== null;
}

function parseOwnerGithubId(): number | null {
  if (!OWNER_GITHUB_ID) {
    return null;
  }

  const ownerGithubId = Number.parseInt(OWNER_GITHUB_ID, 10);
  return Number.isNaN(ownerGithubId) ? null : ownerGithubId;
}
