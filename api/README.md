# betterdo-api

The next-generation API for [BetterDo](https://betterdo.app/). This repository houses the application logic by providing a simple REST API. It's a ground-up rewrite of the original API, swapping Express and MongoDB for Hono, Drizzle, and Postgres.

It's recommended you run this with the UI. See [the app workspace](../app/).

## Features

- ⚡️ Fast, lightweight REST API built on [Hono](https://hono.dev/)
- 🗄️ Type-safe database access with [Drizzle ORM](https://orm.drizzle.team/) and Postgres
- 🔐 Authentication powered by [Better Auth](https://www.better-auth.com/) with support for:
  - Email & password accounts
  - Passkeys (passwordless sign in)
  - Google OAuth
  - Email verification and password reset flows
- ✉️ Branded transactional emails via [Resend](https://resend.com/)
- 🔔 Web push notifications
- 🖼️ Gravatar-based default profile pictures
- ✅ End-to-end test coverage with [Vitest](https://vitest.dev/)
- ⌨️ Built on TypeScript

## Setup

1.  Copy `.env.sample` to `.env` and then fill it in.

    ```bash
    cp .env.sample .env
    ```

2.  Generate VAPID key details and fill them into `.env`

    ```bash
    npx web-push generate-vapid-keys
    ```

3.  Generate a Better Auth secret and fill it into `.env`

    ```bash
    npx @better-auth/cli@latest secret
    ```

4.  Create Google OAuth tokens ([see here](https://console.cloud.google.com/auth/clients/create)) and enter the details into the Google OAuth `.env` sections.
5.  Add your [Resend](https://resend.com/) API key to `.env`.
6.  Run `yarn install`
7.  Run `yarn push` to sync the schema to your database
8.  Run `yarn start`

## Scripts

- `yarn start` - Start the development server (with watch mode)
- `yarn build` - Compile the TypeScript to `dist`
- `yarn lint` - Lint and type-check the codebase
- `yarn test` - Run the test suite via Vitest
- `yarn push` - Push the Drizzle schema to the database
- `yarn generate` - Regenerate the Better Auth schema
- `yarn migrate:v1` - Migrate existing v1 (MongoDB) data into the new Postgres backend

## Endpoints

- `/api/auth/**` - Better Auth endpoints (sign in, sign up, verify email, reset password, passkeys, Google OAuth, etc.)
- `/api/lists` - Methods around updating lists
  - `GET`: get lists
  - `PUT` add list
  - `POST` update list
  - `DELETE` delete list
- `/api/tasks` - Methods around updating tasks
  - `GET`: get task
  - `PUT` add task
  - `POST` update task
  - `DELETE` delete task
- `/api/users` - Methods around the current user
- `/api/config` - Public client configuration
