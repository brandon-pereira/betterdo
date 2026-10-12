# @betterdo/shared

Code shared between the `api` (Hono/Node) and `app` (React/Vite) workspaces:
constants, types, and Zod validation primitives that must stay in lockstep on
both sides of the wire (e.g. the task priority enum, password length).

## Consumed as TypeScript source

This package ships **no build step**. The `exports` map points directly at the
`.ts` files, and each consumer compiles them with its own toolchain:

- **app** — Vite/esbuild bundles the source at build time.
- **api (dev)** — `tsx` runs the source directly.
- **api (prod)** — `tsc` emits `dist/`, leaving the `@betterdo/shared/*` imports
  by name; Node then loads the `.ts` files via **type-stripping**.

> **Runtime requirement:** the API's production runtime needs **Node >= 22.18**
> (type-stripping enabled by default). On older Node the compiled API would fail
> with `Unknown file extension ".ts"`. `.nvmrc` pins a compatible version.

## Conventions (important)

- **No barrel files.** Add a new module as its own file and give it a dedicated
  entry in the `exports` map. Don't create an `index.ts` that re-exports others —
  barrels break Node's type-stripping (it won't rewrite a relative `./x.js`
  specifier to the `.ts` file that actually exists).
- **Internal relative imports use explicit `.ts` extensions**, e.g.
  `import { PRIORITIES } from "./constants.ts"`. This is required for Node
  type-stripping at runtime. The local `tsconfig.json` sets
  `allowImportingTsExtensions` to permit it. Consumers that typecheck this source
  also enable that flag (the `api` build additionally sets
  `rewriteRelativeImportExtensions`).
