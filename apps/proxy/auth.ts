import type { BetterAuthOptions } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { db } from '@conar/db'
import * as schema from '@conar/db/schema'
import { AUTH_COOKIE_PREFIX } from '@conar/shared/constants'
import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'
import { env } from '~/env'

export const auth = betterAuth({
  appName: 'Conar',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.API_URL,
  basePath: '/auth',
  plugins: [
    bearer(),
  ],
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema: {
      ...schema,
      api_keys: schema.apiKeys,
    },
  }),
} satisfies BetterAuthOptions as BetterAuthOptions)
