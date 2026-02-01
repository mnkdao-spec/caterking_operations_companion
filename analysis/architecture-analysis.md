# Architecture Analysis (Phase 1)

## Architectural overview
The repo appears to use a "full-stack TypeScript" approach: an Expo client (mobile + web) consuming a Node/Express backend, with shared types/utilities in `shared/` and typed API calls via tRPC.

## Runtime components
### 1) Client app (Expo Router)
- Entry: `expo-router/entry`, routes under `app/`.
- UI/utilities: `components/`, `hooks/`, `lib/`, `constants/`, `assets/`.
- Data fetching: TanStack React Query + tRPC bindings.

### 2) Backend service (Express + tRPC)
- Dev entry: `server/_core/index.ts` executed via `tsx watch`.
- Prod build: esbuild bundles server entry to `dist/index.js`, then `node dist/index.js`.
- API surface: tRPC packages (`@trpc/server`, `@trpc/client`, `@trpc/react-query`) indicate an end-to-end typed API layer.

### 3) Data & integrations
- Drizzle ORM is configured (`drizzle.config.ts` and `drizzle/` directory) and `mysql2` is present, suggesting a MySQL-compatible DB accessed via Drizzle.
- Supabase client libs are present (auth + realtime), and there is a `supabase/` directory plus setup docs, suggesting Supabase is used for authentication and realtime messaging/streams.
- Operational documentation indicates specialized flows such as offline queuing and realtime KDS setup.

## Key documents to read next
- INTEGRATION_GUIDE.md, INVENTORY_INTEGRATION.md, KDS_REALTIME_SETUP.md, OFFLINE_QUEUE_GUIDE.md, SUPABASE_SETUP.md.

## Open questions (to validate in Phase 2)
- Where the tRPC router is defined and how it is mounted into Express (likely under `server/_core/`), and what auth middleware is used (jose + cookie deps suggest JWT/cookie auth).
- Whether Supabase is the source of truth for certain realtime events (KDS), and how that relates to the MySQL/Drizzle persistence layer.