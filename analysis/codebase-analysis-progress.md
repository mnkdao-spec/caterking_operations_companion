# Codebase Analysis Progress — CaterKing Operations Companion

## Workflow & methodology (3 phases max)
Phase 1 — Discovery & Architecture:
- Map project structure, identify stack, locate entry points, describe high-level architecture.

Phase 2 — Component Analysis:
- Deep dive into core runtime paths (client routing, API/router, auth, DB, realtime/offline subsystems).

Phase 3 — Documentation & Recommendations:
- Produce onboarding guide + focused technical recommendations.

## Project settings (defaults)
- Analysis output location (proposed): `/analysis/` at repo root.
- Documentation style: developer-focused, actionable, technical-only.

## Completed phases
✅ Phase 1: Discovery & Architecture (this update)

## Current findings (Phase 1)
- Monorepo with Expo client (`app/`, `components/`, etc.) + Node/Express backend (`server/`) and `shared/`.
- tRPC + TanStack React Query used for typed client/server API integration.
- Backend dev entrypoint: `server/_core/index.ts`; prod bundles to `dist/index.js` via esbuild.
- Drizzle ORM present with mysql2 driver; Supabase SDKs present with setup docs and a `supabase/` directory.
- No root README; `server/README.md` and `web/README.md` exist.

## Files produced (Phase 1)
- `project-overview.md` (content drafted in chat; ready to save)
- `architecture-analysis.md` (content drafted in chat; ready to save)
- `codebase-analysis-progress.md` (this file; drafted in chat; ready to save)

## Next steps (Phase 2 priorities)
1) Read `server/_core/index.ts` to confirm server bootstrap, routing, middleware, and tRPC mounting.
2) Identify the tRPC router(s) and procedure structure (auth boundaries, input validation with zod).
3) Inspect `drizzle/` schemas and migrations; confirm DB topology and critical tables.
4) Inspect Supabase usage patterns (auth, realtime channels) and how KDS realtime is implemented.
5) Trace client data flow: key screens/routes in `app/`, API clients, caching strategy, offline queue integration.