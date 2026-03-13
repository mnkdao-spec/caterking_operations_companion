# CaterKing Operations Companion — Project Overview

## What this repo is
This repository is a TypeScript monorepo combining an Expo (React Native + web) client and a Node/Express backend, with shared code and operational/integration documentation.

## High-level layout
- `app/`: Expo Router app routes (client).
- `components/`, `hooks/`, `lib/`, `constants/`, `assets/`: client-side UI + utilities.
- `server/`: backend service code.
- `shared/`: shared code between client and server.
- `drizzle/`, `drizzle.config.ts`: Drizzle ORM schema/migrations + config.
- `supabase/`: Supabase configuration/assets.
- `web/`: additional web-specific project area (separate from Expo web mode).
- Docs/guides at repo root: INTEGRATION_GUIDE.md, INVENTORY_INTEGRATION.md, KDS_REALTIME_SETUP.md, OFFLINE_QUEUE_GUIDE.md, SUPABASE_SETUP.md, etc.
- Readmes: `server/README.md` and `web/README.md` exist (no root README).

## Primary technologies
### Client
- Expo SDK (~54), React 19, React Native 0.81.
- Expo Router for routing (`main`: `expo-router/entry`).
- TanStack React Query and tRPC React Query integration.
- NativeWind + Tailwind CSS configuration present.

### Server
- Express for HTTP server.
- tRPC for typed API between client and server.
- Drizzle ORM + mysql2 driver for database access.
- Supabase SDKs included (auth + realtime).

## Common commands
- `pnpm dev`: runs server + Expo web concurrently.
- `pnpm dev:server`: starts backend from `server/_core/index.ts` in watch mode.
- `pnpm dev:metro`: starts Expo with web enabled.
- `pnpm build` / `pnpm start`: bundle server with esbuild, then run `dist/index.js`.
- `pnpm db:push`: Drizzle generate + migrate.
- `pnpm test`: Vitest test run.