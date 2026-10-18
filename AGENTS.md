# AGENTS.md

## Project Overview

ThaiWater GIS is a production-oriented water-resources GIS portal built with Next.js App Router, TypeScript, Tailwind CSS, MapLibre GL, Prisma, and PostgreSQL/PostGIS.

The application contains four main areas:

- Public portal: `/`, `/about`, `/login`, `/register`
- Protected GIS workspace: `/gis`
- User profile: `/profile`
- Administration console: `/admin/*`

Read `README.md` before making architectural or environment changes.

## Required Commands

Use npm. Do not introduce another package manager or commit generated build output.

```bash
npm install
npm run dev
npm run lint
npm run build
```

Database commands:

```bash
npm run db:push
npm run db:seed
psql "$DATABASE_URL" -f db/init-postgis.sql
```

Before finishing a code change, run at minimum:

```bash
npm run lint
npm run build
```

Both commands must complete without errors. Do not suppress TypeScript or ESLint failures merely to make CI pass.

## Directory Guide

- `app/`: App Router pages, layouts, and Route Handlers
- `components/landing/`: public portal UI
- `components/auth/`: authentication and profile UI
- `components/map/`: MapLibre GIS workspace
- `components/admin/`: administration shell and shared admin UI
- `config/basemaps.ts`: basemap registry
- `config/layers.ts`: GIS layer registry
- `lib/auth/`: session and authorization helpers
- `lib/db/`: shared Prisma client
- `lib/gis/`: reusable spatial operations
- `proxy.ts`: lightweight route authentication and role redirects
- `prisma/schema.prisma`: users, GIS layers, and audit-log models
- `db/init-postgis.sql`: PostGIS extension, spatial table, and indexes
- `types/`: shared TypeScript contracts

Prefer the `@/` path alias for internal imports.

## Architecture Rules

### Next.js

- Use App Router and Server Components by default.
- Add `"use client"` only when browser APIs, event handlers, or React client state are required.
- Keep privileged data access in Server Components or Route Handlers.
- Validate request bodies and query parameters with Zod.
- Return intentional HTTP status codes and safe error messages from APIs.

### Authentication and Authorization

- Passwords must only be stored as bcrypt hashes. Never log or return passwords or password hashes.
- Sessions must remain in signed, HTTP-only cookies. Do not store credentials or sensitive session data in browser storage.
- Protected APIs must call `requireUser()`.
- Every `/api/admin/*` handler must call `requireAdmin()` before reading or mutating data.
- UI role checks are for presentation only and never replace server-side authorization.
- Self-registration must always assign the `MEMBER` role. Never accept an admin role from the public registration request.
- Do not allow the last active administrator to be demoted, suspended, or disabled.
- Prefer account status changes or soft deletion over deleting users.
- Record important authentication and administrative mutations in `AuditLog`.

### GIS and MapLibre

- Do not hard-code basemaps inside map components. Add them to `config/basemaps.ts`.
- Do not add individual datasets through one-off conditional code in `GISMap`. Extend the layer definition and registry-driven renderer instead.
- Preserve layer access levels: `PUBLIC`, `MEMBER`, and `ADMIN`.
- New layer definitions should include metadata, zoom limits, opacity, legend, and popup fields.
- Avoid loading large GeoJSON datasets in full. Use bbox/viewport queries, clustering, pagination, or vector tiles.
- For large production datasets, prefer PostGIS with Martin or pg_tileserv and MVT delivery.
- Keep reusable spatial calculations in `lib/gis/` and use Turf.js for client-side analysis.
- Map coordinates and stored geometries use WGS84 (`EPSG:4326`) unless a feature explicitly documents another CRS.

### PostgreSQL and PostGIS

- All raw SQL values must use parameterized placeholders. Never interpolate user input into SQL strings.
- Spatial columns should have appropriate GiST indexes.
- Bound API result sizes and validate bbox coordinates.
- Use Prisma for users, configuration, and audit records. Raw `pg` queries are acceptable for PostGIS operations Prisma cannot express cleanly.
- Production schema changes should use reviewed Prisma migrations; `db:push` is for local setup only.

## UI Guidelines

- Maintain the existing modern government/enterprise visual language.
- Reuse the design tokens and shared classes in `app/globals.css`.
- Keep public pages responsive across mobile, tablet, and desktop.
- Optimize the GIS workspace primarily for desktop and tablet while preserving basic mobile usability.
- All user-facing copy is primarily Thai. Technical identifiers, layer types, and standard GIS terms may remain English.
- Preserve keyboard-accessible controls, explicit form labels, readable contrast, and visible error/success states.
- Do not add decorative dependencies when CSS or an existing icon is sufficient.

## Security and Performance

- Never commit `.env`, real secrets, database credentials, or production seed passwords.
- `AUTH_SECRET` must be a strong random value in deployed environments.
- Treat all client input as untrusted, including layer URLs and query-string filters.
- Avoid returning internal exception details to clients.
- Keep dependencies minimal and run `npm audit` when dependency versions change.
- Do not bypass authorization, validation, pagination, or data-size limits for convenience.
- Avoid unnecessary client-side bundles; dynamically load heavy browser-only GIS modules when it materially improves startup time.

## Change Discipline

- Preserve unrelated user changes in the working tree.
- Prefer focused edits over broad rewrites.
- Update types, validation, API behavior, and documentation together when a contract changes.
- If adding an environment variable, update `.env.example` and `README.md` in the same change.
- If adding a route, document its access level and enforce that access on the server.
- If adding a database model or field, update the seed/setup documentation when relevant.
- Do not edit generated files in `.next`, `node_modules`, or generated Prisma client output.

## Definition of Done

A change is complete only when:

- The requested behavior works beyond a visual mockup.
- Authentication and authorization are enforced server-side where applicable.
- API input is validated.
- Large GIS data is handled with an appropriate bounded or tiled strategy.
- Error, empty, and loading states are considered.
- `npm run lint` passes.
- `npm run build` passes with no TypeScript or build errors.
- Relevant setup or architecture documentation is updated.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
