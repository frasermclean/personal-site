/// <reference types="astro/client" />
/// <reference types="@types/umami" />

declare namespace App {
  interface Locals {
    user: import('./lib/auth/auth-session').UserSession | null;
  }
}
