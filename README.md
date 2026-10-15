# stillneedwindows

Does your Steam library still need Windows? Paste a Steam profile and get one number: how much of the library runs well on Linux, by game count or by hours played, with a ProtonDB tier for every game.

## How it works

1. `GET /api/profile/:query` resolves a profile URL, custom name or SteamID64 and returns the owned games (Steam Web API). Nothing is stored.
2. The web app sends the app ids in batches of 50 (three at a time, most-played first) to `GET /api/compat?ids=…`, which combines:
   - **ProtonDB** tier per game (trending tier, falling back to all-time)
   - **Native Linux build** and **Steam Deck rating** from Steam's `IStoreBrowseService/GetItems`
   - **Anti-cheat status** from [Are We Anti-Cheat Yet](https://github.com/AreWeAntiCheatYet/AreWeAntiCheatYet)
3. Each game's compatibility is cached for 24 h (6 h when ProtonDB has no reports) in Upstash Redis, or in memory without it. Responses are also CDN-cached for an hour.
4. The verdict maths lives in `shared/verdict.ts`:
   - Native, Platinum and Gold count as "runs well"
   - Games whose anti-cheat blocks Linux count as Borked
   - **Windows is optional:** 70%+ runs well and under 10% is Borked
   - **Mostly ready:** 70%+ runs well and 10%+ is Borked
   - **Dual-boot territory:** 40–69% runs well
   - **You still need Windows:** under 40% runs well

## Stack

Vue 3, TypeScript, Vue Router, Pinia and Tailwind CSS 4 on the front. Hono and Zod on the back, deployed as one Vercel Function (`api/index.ts`).

```
api/       Vercel Function entry
server/    Hono app, Steam / ProtonDB / anti-cheat clients, cache
shared/    types, profile-input parsing and verdict maths (used by both sides)
src/       Vue app
```

## Develop

```sh
cp .env.example .env   # add STEAM_API_KEY from https://steamcommunity.com/dev/apikey
npm install
npm run dev            # Vite on :5173, API on :8787 (proxied under /api)
npm test
npm run build
```

## Deploy

1. Import the repo in Vercel. The Vite preset and `vercel.json` handle the rest.
2. Add `STEAM_API_KEY` as an environment variable.
3. Optional: add Upstash Redis from the Vercel Marketplace for a shared cache. It sets the env vars itself.

Not affiliated with Valve or ProtonDB.
