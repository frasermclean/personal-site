# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Fraser McLean's personal website: an Astro site (SSR, `output: 'server'`) deployed to Cloudflare Workers. Uses
Cloudflare D1 (SQLite) for data, Cloudflare KV for sessions, GitHub OAuth for admin auth, Resend for email, and
Cloudflare Turnstile for bot protection.

## Commands

```sh
pnpm dev                    # wrangler types + astro dev (local dev server)
pnpm build                  # wrangler types + astro build
pnpm preview                # wrangler types + astro preview (runs the built worker locally)
pnpm test                   # vitest run (all tests)
pnpm exec vitest run src/lib/email-sending.test.ts   # run a single test file
pnpm db:migrate             # apply migrations/*.sql to the local D1 database
pnpm db:migrate:remote      # apply migrations to the remote D1 database
```

There is no separate lint script; formatting is via Prettier (`.prettierrc`, includes `prettier-plugin-astro` and
`prettier-plugin-tailwindcss`). Run `pnpm exec prettier --write .` if needed.

Node >=22 is required (see `engines`/`volta` in `package.json`).

### Local environment

Requires a `.env` file at the repo root — see `README.md` for the full variable list (Resend, Turnstile, GitHub
OAuth, Umami analytics). Turnstile test keys always pass validation.

The local D1 database lives under `.wrangler/state/v3/d1`; run `pnpm db:migrate` after pulling new files from
`migrations/`.

Optional backend services (Umami analytics, Comentario comments, Postgres, Redis) run via Docker Compose in
`backend/` (`docker compose up -d` from that directory) — see `backend/README.md`.

## Architecture

### Astro Actions are the mutation boundary

All server-side mutations (form submissions, likes, sign-in/out, admin settings updates) go through **Astro
Actions** defined in `src/actions/*.ts` and registered in `src/actions/index.ts`. Each action:

- Defines a Zod `input` schema with explicit constraints (max lengths, regexes to block header/line-break
  injection, etc.) — do not skip these constraints when adding new inputs.
- Wraps handler logic in try/catch, mapping known error types (e.g. `TurnstileError`, `EmailSendError`) to specific
  `ActionError` codes, with a generic `INTERNAL_SERVER_ERROR` fallback that logs the raw error server-side.
- Client-side, pages call actions via `astro:actions` (`import { actions } from 'astro:actions'`) from inline
  `<script>` blocks, typically inside `.astro` files (see `src/pages/settings.astro` for the pattern: read
  `Astro.locals.user` for auth-gating, render initial state server-side, then wire up event listeners client-side).

### Auth flow

- GitHub OAuth is implemented from scratch using `arctic` in `src/lib/auth/github-oauth.ts` (build auth URL,
  exchange code for token, fetch GitHub user) — no auth library/framework wraps this.
- `src/pages/api/auth/callback.ts` handles the OAuth redirect callback.
- Sessions are stored via Astro's session support backed by the Cloudflare `SESSION` KV namespace
  (`wrangler.json`). `src/middleware.ts` loads `context.session.get('user')` into `context.locals.user` on every
  request.
- "Owner" is a specific GitHub user ID (`OWNER_GITHUB_ID` env var); `user.isOwner` gates admin-only pages/actions
  (e.g. `src/pages/settings.astro` rewrites to `/404` for non-owners rather than redirecting, to avoid revealing
  the page exists).

### Data access (Cloudflare D1)

- D1 is accessed via the `cloudflare:workers` `env` import (`import { env } from 'cloudflare:workers'`), not
  through Astro's `context.locals`. See `src/lib/db/*.ts` for examples.
- Uses D1 Sessions API: `env.DB.withSession()` for reads, `env.DB.withSession('first-primary')` for writes that
  need read-your-writes consistency.
- Each module in `src/lib/db/` owns one table/concern (`post-likes.ts`, `site-settings.ts`, `syndication-links.ts`)
  and defines its own typed error class (e.g. `PostLikePersistenceError`) thrown on failure, with query errors
  logged and read failures generally degrading gracefully (e.g. returning `[]`) rather than throwing.
- Schema changes go in `migrations/NNNN_description.sql`, applied via `pnpm db:migrate`.

### Content collections

`src/content.config.ts` defines three Astro content collections:

- `posts` — Markdown/MDX files under `src/content/posts/`, schema includes `heroImage`, `category`
  (`guide`/`project`/`review`), `tags`, `showReactions`, `isFeatured`.
- `projects` — loaded from `src/data/projects.json`.
- `bookmarks` — loaded from `src/data/bookmarks.json`, grouped by `category`.

Markdown processing (`astro.config.mjs`) uses custom remark plugins (`src/lib/remark-plugins.ts`: reading time, git
last-updated date, external link handling) and `rehype-figure`; Shiki themes are `light-plus`/`dark-plus`.

### Caching strategy (`src/middleware.ts`)

Central middleware sets `Cache-Control`/`CDN-Cache-Control` per response based on rules evaluated in order:
5xx responses and logged-in users get `no-store`/private caching; non-GET/HEAD requests and `/_actions`/`/api/`
paths are never cached; `.xml`/RSS routes get moderate edge caching; everything else gets short edge caching with
stale-while-revalidate. Routes that set their own `Cache-Control` are left alone. When adding new routes, be aware
this middleware will set caching headers unless the route sets them first.

### Env vars

Declared and validated via Astro's typed env (`astro.config.mjs` → `env.schema`), split into `client`/`server`
context and `public`/`secret` access. Import server secrets from `astro:env/server` and public client vars from
`astro:env/client` — do not read `process.env` directly in app code.

### UI components

- `src/components/starwind/*` are UI primitives (button, card, dialog, dropdown, switch, table, toast, tooltip,
  etc.) generated by the Starwind UI toolkit (`starwind.config.json`) — treat these similarly to shadcn/ui
  components: customize in place rather than treating them as an external package.
- Path alias `@/*` maps to `src/*`.
- Tailwind CSS v4 via the Vite plugin (no separate `tailwind.config`); stylesheet is `src/styles/starwind.css`.

### Testing

Vitest (`vitest.config.ts`) runs `src/**/*.test.ts` in a Node environment. Existing tests
(`email-sending.test.ts`, `turnstile.test.ts`) mock `fetch`/external HTTP calls rather than hitting real services —
follow that pattern for new server-side unit tests.
