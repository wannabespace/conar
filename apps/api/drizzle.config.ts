import { defineConfig } from 'drizzle-kit'
import { env, nodeEnv } from '~/env'

export default defineConfig({
  schema: './src/drizzle/schema/*.ts',
  out: './src/drizzle/migrations',
  dialect: 'postgresql',
  ...(nodeEnv === 'test' && { driver: 'pglite' }),
  casing: 'snake_case',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
