import type { BetterAuthPlugin } from 'better-auth'
import { db } from '@/drizzle'
import { env } from '@/env'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthEndpoint } from 'better-auth/api'
import { bearer } from 'better-auth/plugins'
import { v7 } from 'uuid'

function token() {
  return {
    id: 'get-session-token',
    endpoints: {
      getSessionToken: createAuthEndpoint('/session/token', {
        method: 'GET',
        requireHeaders: true,
      }, async (ctx) => {
        const token = ctx.getCookie(
          ctx.context.authCookies.sessionToken.name,
        )
        return ctx.json(token ? encodeURIComponent(token) : null)
      }),
    },
  } satisfies BetterAuthPlugin
}

export const auth = betterAuth({
  appName: 'Connnect',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_URL,
  plugins: [token(), bearer(), emailHarmony()],
  trustedOrigins: process.env.NODE_ENV === 'production' ? ['tauri://localhost'] : ['http://localhost:1420'],
  advanced: {
    generateId: () => v7(),
    cookiePrefix: 'connnect',
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
})
