import type { BetterAuthOptions } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { db } from '@conar/db'
import * as schema from '@conar/db/schema'
import { AUTH_COOKIE_PREFIX } from '@conar/shared/constants'
import { betterAuth } from 'better-auth/minimal'
import { env, nodeEnv } from '~/env'

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  user: {
    additionalFields: {
      secret: {
        type: 'string',
        returned: false,
        input: false,
      },
    },
  },
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
    crossSubDomainCookies: {
      enabled: nodeEnv === 'production',
      domain: new URL(env.MAIN_URL).host,
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema,
  }),
} satisfies BetterAuthOptions as BetterAuthOptions)
