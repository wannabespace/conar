# <img src="https://conar.app/app-logo.png" alt="Conar Logo" width="25"/> Conar.app

![image](https://conar.app/github-demo.png)

Conar is an AI-powered open-source project that simplifies database interactions. Built for PostgreSQL, with support for other databases coming in the near future. Store your connections securely in our cloud and ask AI to help you write and optimize SQL queries.

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
  - MySQL (coming soon)
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
- Hono
- tRPC
- Drizzle ORM
- Better Auth
- AI SDK with Anthropic, OpenAI, Gemini and XAI
- Supabase
- Railway
- PostHog
- Loops

## Development Setup

- **📦 Package Installation**
  ```bash
  pnpm install
  ```

- **🐳 Start Database with Docker Compose**

  This will start the PostgreSQL database in the background.
  ```bash
  docker-compose -f docker-compose.dev.yml up -d
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

## License

This project is licensed under the Apache-2.0 License — see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️</sub>
</div>
