import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { v7 } from 'uuid'
import { db } from '~/drizzle'
import { env } from '~/env'

export const auth = betterAuth({
  appName: 'Connnect',
  secret: env.BETTER_AUTH_SECRET,
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
    autoSignIn: true,
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
