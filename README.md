# BetterDo

**Welcome to the monorepo for BetterDo** — a fast, modern task manager designed to help you stay focused and organized.

I built BetterDo to simplify how I track tasks and manage projects — and I use it every day. Whether you're organizing your work, side projects, or personal goals, I hope it helps you as much as it helps me.

This project is powered by a modern tech stack — TypeScript, Node.js, React, Vite, and more — with a strong focus on developer experience. It’s easy to run locally, contribute to, and deploy in production.

[Launch the app](https://betterdo.app) to see it in action!

## Features

- ⚛️ React Application leveraging Hooks and SWR.
- 🤓 Uses TypeScript to reduce bugs and improve code satisfaction
- ⚡️ API built on [Hono](https://hono.dev/), [Drizzle ORM](https://orm.drizzle.team/), and Postgres.
- 🔐 Authentication powered by [Better Auth](https://www.better-auth.com/) — email & password, Passkeys, and Google login, plus email verification and password reset flows.
- ✉️ Branded transactional emails via [Resend](https://resend.com/).
- 👷‍♂️ Leverages a Service Worker for offline support, push notifications, and an installable PWA.
- 🧱 Uses Vite for blazing fast development and builds
- 🎼 Leverages GitHub actions for automated production deploys and testing

## Getting Started

To get started, you'll need to have the following installed:

- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (for managing [Node.js](https://nodejs.org/en/download/) versions)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Docker](https://www.docker.com/get-started)

Once you have these installed, you can clone the repository and run the following commands:

```bash
nvm use
yarn install
cp api/.env.sample api/.env
```

After copying the `.env` file, you should edit it to set your environment variables. You can use the `.env.sample` file as a reference.

After setting your environment variables, you can run the development server:

```bash
docker compose up -d
yarn migrate
yarn start
```

If everything was successful, you should be able to access the application at the following URLs:

- [http://localhost:4000/](http://localhost:4000/) is the API server
- [http://localhost:4001/](http://localhost:4001/) is the Web App server
- [http://localhost:4002/](http://localhost:4002/) is the public website (we recommend starting here)
