# <img src="https://conar.app/logo.png" alt="Conar Logo" width="25"/> Conar.app

![image](https://conar.app/github-demo.png)

Conar is an AI-powered open-source project that simplifies database interactions. Built for PostgreSQL, MySQL, MSSQL, Clickhouse with support for other databases coming in the near future. Store your connections securely in our cloud and ask AI to help you write and optimize SQL queries.

<div align="center">
  <a href="https://conar.app/download">
    <img src="https://img.shields.io/badge/Download-Conar-green?style=for-the-badge" alt="Download Conar" />
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

  This will start the PostgreSQL database & Redis in the background.
  ```bash
  pnpm run docker:start
  ```

- **🗄️ Prepare Database**

  This will run database migrations to set up the required tables and schema.
  ```bash
  pnpm run drizzle:migrate
  ```

- **🚀 Run the Project**

  This will start all development servers using Turbo.
  ```bash
  pnpm run dev
  ```

## Testing

- **Unit Tests**
  ```bash
  pnpm run test
  ```

> Before running E2E tests, make sure to start the test server: `pnpm run test:start` and db `postgresql://postgres:postgres@localhost:5432/conar`

- **E2E Tests**
  ```bash
  pnpm run test:e2e
  ```

<div align="center">
  <sub>Built with ❤️</sub>
</div>
