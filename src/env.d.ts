/// <reference types="astro/client" />
/// <reference types="@types/umami" />

declare namespace App {
  interface Locals {
    user: import('./lib/auth/auth-types').AppUser | undefined;
  }

  interface SessionData {
    user: import('./lib/auth/auth-types').AppUser;
    oauthState: string;
    returnTo: string;
  }
}
