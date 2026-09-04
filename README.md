# <img src="https://tamery.app/logo.png" alt="Tamery Logo" width="25"/> Tamery.app

![image](https://tamery.app/github-demo.png)

Tamery is an AI-powered open-source project that simplifies database interactions. Built for PostgreSQL, MySQL, MSSQL, Clickhouse with support for other databases coming in the near future. Store your connections securely in our cloud and ask AI to help you write and optimize SQL queries.

<div align="center">
  <a href="https://tamery.app/download">
    <img src="https://img.shields.io/badge/Download-Tamery-green?style=for-the-badge" alt="Download Tamery" />
  </a>
</div>

## Features

- **🔐 Secure & Open**
  - Open-source codebase
  - Encrypted connection strings
  - Password protection

- **💾 Multi-Database Support**
  - PostgreSQL
  - MySQL
  - MSSQL
  - Clickhouse
  - Sqlite (coming soon)
  - MongoDB (coming soon)

- **🤖 AI-Powered Features**
  - Intelligent SQL assistance
  - Ability to change AI model
  - More coming soon..

## Stack

- React with TypeScript
- Electron
- TailwindCSS and shadcn/ui
- Vite
- TanStack Start/Router/Query/Form/Virtual
- Arktype
- Bun
- Hono
- oRPC
- Drizzle ORM
- Better Auth
- Vercel AI SDK with Anthropic
- Railway
- PostHog
- Resend
- ToDesktop
- Stripe

## Development Setup

- **📦 Package Installation**

  ```bash
  pnpm install
  ```

- **🌐 Browser Automation (recommended)**

  [agent-browser](https://www.npmjs.com/package/agent-browser) drives the running app for agents and manual debugging. Install it globally, once per machine:

  ```bash
  npm install -g agent-browser && agent-browser install
  ```

  It is not a project dependency — agents call its CLI directly (`agent-browser open <url>`, `snapshot`, `click`, `console`); without it, any other browser automation can be used instead.

- **🐳 Start Backing Services**

  Postgres and Redis must be reachable from `apps/api/.env` (copy `.env.example`). Either point it at hosted instances, or start local ones with Docker (https://docs.docker.com/get-docker/):

  ```bash
  pnpm run docker:start
  ```

- **🗄️ Prepare Database**

  This will run database migrations to set up the required tables and schema.

  ```bash
  pnpm run drizzle:migrate
  ```

- **🚀 Run the Project**

  This opens a package picker (all packages pre-selected — press Enter to accept) and starts the selected development servers through [portless](https://portless.sh) (HTTPS on `.local.tamery.app` domains):

  | Service | URL                            |
  | ------- | ------------------------------ |
  | API     | https://api.local.tamery.app   |
  | App     | https://app.local.tamery.app   |
  | Main    | https://main.local.tamery.app  |
  | Proxy   | https://proxy.local.tamery.app |

  ```bash
  pnpm run dev
  ```

  Pass `-a` to skip the prompt and start everything. To run a subset, deselect the rest in the picker, or `cd` into a single app's directory (e.g. `apps/api`) and run `pnpm run dev`.

## Testing

- **Unit Tests**
  ```bash
  pnpm run test
  ```

> Before running E2E tests, make sure to start the test server: `pnpm run test:start`

- **E2E Tests**
  ```bash
  pnpm run test:e2e
  ```

<div align="center">
  <sub>Built with ❤️</sub>
</div>
