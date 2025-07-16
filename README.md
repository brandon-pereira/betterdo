# BetterDo

This is the monorepo powering [BetterDo](https://betterdo.app), a simple, yet powerful, task management application.

I use this app daily to manage my tasks and projects, and I hope you find it useful too!

## 🚧 Active Migration

This project is currently being migrated from two separate repositories into a monorepo. The goal is to simplify the development process and make it easier to manage dependencies and releases.

See original repositories:

- [betterdo-api](https://github.com/brandon-pereira/betterdo-api)
- [betterdo-ui](https://github.com/brandon-pereira/betterdo-ui)

## Getting Started

This project is built with a modern stack, including Typescript, Node, React, Vite, and more. It is designed to be easy to set up and run locally, as well as deploy to production.

## Getting Started

To get started, you'll need to have the following installed:

- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (for managing [Node.js](https://nodejs.org/en/download/) versions)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Docker](https://www.docker.com/get-started)

Once you have these installed, you can clone the repository and run the following commands:

```bash
nvm use
yarn install
```

Then, you can run the development server:

```bash
docker compose up -d
yarn start
```

If everything was successful, you should be able to access the application at the following URLs:

- [http://localhost:4000/](http://localhost:4000/) is the API server
- [http://localhost:4001/](http://localhost:4001/) is the Web App server
- [http://localhost:4002/](http://localhost:4002/) is the public website (we recommend starting here)

## Features

- ⚛️ React Application leveraging Hooks and SWR.
- 🤓 Uses TypeScript to reduce bugs and improve code satisfaction
- 👷‍♂️ Leverages a Service Worker for offline support, push notifications, and an installable PWA.
- 🧱 Uses Vite for blazing fast development and builds
- 🎼 Leverages GitHub actions for automated production deploys and testing
