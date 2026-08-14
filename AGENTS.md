# AGENTS.md

## Run / dev

- Package manager is **bun** (bun.lock). Node v24 available.
- **Do not** use `npm run dev` or `bun run dev`: the scripts pipe through `tee` and use `cp -r`, which are Unix-only and fail on this Windows machine.
- Start the dev server directly: `bunx next dev -p 3000`. It is currently running on port 3000 (view at http://localhost:3000).
- Lint: `bunx next lint` or `eslint .`.
- `next.config.ts` sets `ignoreBuildErrors: true` and `reactStrictMode: false`; `tsconfig.json` sets `noImplicitAny: false` — type/build errors will not fail the build.

## Architecture

- **Single-page game** ("Make Great Zimbabwe Again", a Zimbabwe political strategy game). All UI, screens, and components live in `src/app/page.tsx` (~2,500 lines). Game simulation logic lives in `src/lib/game/` (`engine.ts`, `constants.ts`, `types.ts`). Game state is zustand: `src/store/game-store.ts`.
- `@/*` path alias → `./src/*`. shadcn/ui (style "new-york") components in `src/components/ui/`. Tailwind v4 with CSS variables in `src/app/globals.css`.
- **Prisma/SQLite is effectively unused**: only `src/lib/db.ts` imports `@prisma/client`; nothing else does. `.env`'s `DATABASE_URL=file:/home/z/my-project/db/custom.db` is a stale Linux path that does not exist here — any `prisma db:*` command will fail on this machine. Don't add DB/Prisma code without fixing `.env` first, and only the app's `db/` folder.
- **Leaderboard uses Supabase**: `src/lib/leaderboard-db.ts` talks to the Supabase project (URL + anon publishable key in `.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`) via `@supabase/supabase-js` (server-side, in the API routes). Tables `leaderboard_entries` and `leaderboard_snapshots` + RLS policies are created by running `supabase/schema.sql` once in the Supabase SQL Editor (re-runnable: drops policies first). API: `GET /api/leaderboard?difficulty=` (24h-cached snapshot), `POST /api/leaderboard/submit`.

## Conventions (verified in worklog.md)

- **i18n**: languages are English (en), chiShona (sn), isiNdebele (nd) in `src/lib/i18n.ts` (3 translation objects). Any new user-visible string must be added to all three languages, retrieved via `useTranslation()` (`src/hooks/useTranslation.ts`).
- **No em dashes (—) in user-visible text** — use colons or commas instead. This is an enforced rule from past reviews.
- **Currency is ZiG** (Zimbabwe Gold), exchange rate constant 26.37 ZiG/USD (in `constants.ts`).
- **Zimbabwe flag stripes** (hero bar): hard color stops `#006400`, `#FFD200`, `#DE2010`, `#000000` (3px, full width). In-game/general palette green `#2E8B37`, yellow `#E8A800`-ish, red `#CC2936`.
- **Start screen hero is clean-light-institutional**: `.zim-hero-light` (globals.css) pins light tokens (white/cream `#FAFAF7` background, `--foreground: #1A1A1A`, `--card: #FFFFFF`, `--border: #E5E0D8`, `color-scheme: light`) on the start screen wrapper AND the New Game dialog (Radix portal). `.zim-hero-*` classes in `globals.css` own the hero look: Anton (`--font-anton`) headline with solid green `#4A9D3F` / gold `#E8A93C` lines, Plus Jakarta Sans (`--font-jakarta`) subtitle/badges, green chevron SVG texture at 5% opacity on a `#FAFAF7` → `#EDE8DF` gradient, `#FFFFFF` cards with 1px flag-color top border, solid `#3D7A32` CTA with 8px radius. Game-over screen still forces dark via its own wrapper; dark mode applies in-game.
- **Version bump**: footer + all 3 translation files carry "v1.x" — bump all together (currently v1.7).
- `worklog.md` is the append-only task log (front-matter style: Task ID / Agent / Task header, Work Log, Stage). Append new entries there when finishing significant tasks.
- Dev proxy: `Caddyfile` serves :81 → localhost:3000 (with optional `XTransformPort` query passthrough) — only relevant when running behind Caddy.