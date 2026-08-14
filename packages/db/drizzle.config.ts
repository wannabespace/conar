import { defineConfig } from 'drizzle-kit'

import { env, nodeEnv } from './env'

export default defineConfig({
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  dialect: 'postgresql',
  ...(nodeEnv === 'test' && { driver: 'pglite' }),
  out: './migrations',
  schema: './schema/index.ts',
})
