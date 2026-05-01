import { defineConfig } from 'drizzle-kit'
import { env, nodeEnv } from './env'

export default defineConfig({
  schema: './drizzle/schema/index.ts',
  out: './drizzle/migrations',
  ...(nodeEnv === 'test' && { driver: 'pglite' }),
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
