/// <reference types="astro/client" />
/// <reference types="@types/umami" />

declare namespace App {
  interface Locals {
    currentUser: import('./lib/auth').CurrentUser | null;
  }
}
