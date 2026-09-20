# AGENTS.md

BetterDo is a Yarn workspaces monorepo: `api/` (Hono + Drizzle + Postgres), `app/` (React + Vite PWA), `website/` (Astro). Node 22.14.0 (`.nvmrc`), ESM everywhere.

## Commands

- Dev (all): `yarn start` (runs docker compose + all workspaces)
- Lint: `yarn lint` (per-workspace `eslint . && tsc --noemit`, plus `knip`)
- Lint one workspace: `yarn workspace <api|app|website> lint`
- Test (api only): `yarn workspace api test` (Vitest, watch by default)
- Single test file: `yarn workspace api vitest run tasks.test.ts`
- Single test by name: `yarn workspace api test -t "Default priority is normal"`
- Build: `yarn build:api` / `yarn build:app` / `yarn build:website`
- DB migrate: `yarn migrate` (drizzle-kit push)

## Code Style

- Prettier-enforced: double quotes, semicolons, 2-space indent, 120 print width, no trailing commas, `arrowParens: avoid` (omit parens on single-arg arrows).
- Strict TypeScript. Prefer `interface` for object/prop shapes. Use `import type { ... }` for type-only imports.
- API/Node relative imports MUST use explicit `.js` extensions (nodenext), even in `.ts` files: `import { db } from "../db.js";`.
- App uses path aliases (`@components`, `@hooks`, `@utilities`, `@customTypes`), not deep relative paths.
- Naming: `camelCase` vars/functions, `PascalCase` components/types/interfaces, `use*` hooks (one per file, default export), verb-first service functions (`createTask`).
- Drizzle: `camelCase` TS props → `snake_case` columns; use inferred types (`typeof tasks.$inferInsert`).

## Architecture & Patterns

- API layers: `routes/` (Hono routers, one per resource, default-exported) → `services/` (business logic + DB) → `schema/` (Drizzle) → `db.ts`.
- Validate with `zValidator("json", schema, errHandler)`; Zod schemas in `validators/`. Guard routes with `authMiddleware`; get user via `c.get("user")`.
- Errors: return `c.json({ error: "..." }, statusCode)` with explicit codes; global `app.onError` → 500. Log prefix `[api]`. Services `throw new Error(...)` for invariant violations.
- App components: own folder with `Component.tsx`, `Component.styles.ts`, `index.ts` barrel; styled-components use `$`-prefixed transient props.

## Testing

- Vitest, files `*.test.ts` in `api/test/`. Explicit imports (`import { describe, test, expect } from "vitest"`) despite `globals: true`.
- Tests run serially (`fileParallelism: false`) against in-memory PGlite; use `test/helpers/createRouter.ts` factory.
- Descriptive names: `describe("Feature API", ...)`, `test("Can be created with valid data", ...)`.
