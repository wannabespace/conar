import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/renderer/src/drizzle/schema/*.ts',
  out: './src/renderer/src/drizzle/migrations',
  dialect: 'postgresql',
  casing: 'snake_case',
  driver: 'pglite',
  dbCredentials: {
    url: 'idb://conar',
  },
})
