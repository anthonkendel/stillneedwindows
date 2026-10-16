# CLAUDE.md

stillneedwindows: paste a Steam profile, see how much of the library runs on Linux
(ProtonDB tiers, native builds, Steam Deck rating, anti-cheat). Live at
https://stillneedwindows.vercel.app. See README.md for the full picture.

## Commands

- `npm run dev`: Vite on :5173 plus the Hono API on :8787 (needs `.env` with `STEAM_API_KEY`)
- `npm test`: Vitest (shared logic, API with mocked upstreams, every screen in en and sv with axe)
- `npm run typecheck`, `npm run format`, `npm run build`
- Before pushing: `npm run format && npm run typecheck && npm test`. CI runs the same checks.

## Layout

- `api/index.ts`: Vercel Function entry (Hono `handle`)
- `server/`: Hono app, Steam / ProtonDB / anti-cheat clients, two-level cache (memory + Upstash)
- `shared/`: types, input parsing, verdict maths, used by both sides
- `src/`: Vue 3 app (Pinia stores `stores/library.ts`, `wishlist.ts`, `group.ts`; views; `locales/en.ts` + `sv.ts`)
  - `views/UserLayout.vue` holds the profile row and tabs; verdict and wishlist are its child routes
  - `lib/compat.ts` batches `/api/compat` calls and reuses answers already fetched in the tab

## Conventions

- Node 24 (`.nvmrc`, `engines`). TypeScript strict. Prettier: no semicolons, single quotes, 120 columns.
- Imports in `server/` and `shared/` use `.js` extensions (ESM on Vercel). `src/` imports don't.
- All UI text goes through i18n. Add every key to both `en.ts` and `sv.ts`; a test enforces matching keys.
  ProtonDB tier names stay English.
- Colors come from the tokens in `src/style.css`. They are checked for WCAG AA contrast, so
  re-check contrast before adding or changing a color.
- New controls need hover (pointer only), active and focus-visible states, and targets of at least 44 px.
  Animations must respect `prefers-reduced-motion`.

## Things that must stay true

- **Verdict rules:** `shared/verdict.ts` (library, wishlist and group verdicts), the How it works page and the README must agree.
- **No personal data stored:** profiles and game lists are never cached server-side or on the CDN.
  Only per-game compatibility is cached. The same goes for wishlists and friends lists.
- **Content Security Policy** (`vercel.json`): same-origin only, plus Steam avatar images. No inline
  scripts, no `data:` fonts, no third-party requests. If a change needs a new origin, update the
  policy deliberately.
- **API:** answers same-origin requests only, sends no CORS headers, validates input with Zod.
- **Cache:** write Redis in batches with `mset`. Bump the key version (`compat:vN`, `awacy:vN`) when
  the cached shape changes.
- **Indexing:** `/u/*` pages stay `noindex`. New public pages go in `PUBLIC_PAGES` (vite.config.ts)
  for the sitemap.

## Deployment (Vercel)

- Hobby plan. Functions run in US East; Upstash Redis is in us-east-1 (connected via `KV_*` env vars).
- Env vars: `STEAM_API_KEY`, `VITE_SITE_URL` (currently https://stillneedwindows.vercel.app, no
  custom domain yet), optional `VITE_CONTACT` (privacy contact defaults to GitHub issues).
- Firewall: one rate-limit rule on `/api/`, 60 requests per 60 s per IP.
- Pushes to `main` deploy automatically. Pushing straight to `main` is fine; the ruleset only blocks
  force pushes and deletion.
