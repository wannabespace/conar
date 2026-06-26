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
- AI SDK with Anthropic, OpenAI, Gemini and XAI
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

- **🐳 Start Database with Docker Compose**

  Install Docker: https://docs.docker.com/get-docker/

  This will start all services needed for development.

  ```bash
  pnpm run docker:start
  ```

- **🗄️ Prepare Database**

  This will run database migrations to set up the required tables and schema.
  ```bash
  pnpm run drizzle:migrate
  ```

- **🚀 Run the Project**

  This starts all development servers through [portless](https://portless.sh) (HTTPS on `.local.tamery.app` domains):

  | Service | URL |
  | --- | --- |
  | API | https://api.local.tamery.app |
  | App | https://app.local.tamery.app |
  | Main | https://main.local.tamery.app |
  | Proxy | https://proxy.local.tamery.app |

  ```bash
  pnpm run dev
  ```

  To run a single app without Turbo, `cd` into its directory (e.g. `apps/api`) and run `pnpm run dev`.

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
