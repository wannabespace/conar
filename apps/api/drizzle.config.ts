import { defineConfig } from 'drizzle-kit'
import { env, nodeEnv } from '~/env'

export default defineConfig({
  schema: './src/drizzle/schema/*.ts',
  out: './src/drizzle/migrations',
  ...(nodeEnv === 'test' && { driver: 'pglite' }),
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
