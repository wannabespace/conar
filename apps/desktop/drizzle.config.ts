import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/drizzle/schema/*.ts',
  out: './src/drizzle/migrations',
  dialect: 'postgresql',
  casing: 'snake_case',
  driver: 'pglite',
  dbCredentials: {
    url: 'idb://conar',
  },
})
