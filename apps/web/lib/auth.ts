import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer, organization, twoFactor } from 'better-auth/plugins'
import { v7 } from 'uuid'
import { db } from '~/drizzle'
import { env } from '~/env'
import 'server-only'

export const auth = betterAuth({
  appName: 'Connnect',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_URL,
  plugins: [
    twoFactor(),
    bearer(),
    organization(),
    emailHarmony(),
    // magicLink({
    //   disableSignUp: true,
    //   sendMagicLink: async ({ email, token, url }, request) => {
    //     console.log('sendMagicLink', email, token, url, request)
    //   },
    // }),
  ],
  user: {
    additionalFields: {
      secret: {
        type: 'string',
        required: true,
        defaultValue: v7,
        input: false,
      },
    },
  },
  trustedOrigins: process.env.NODE_ENV === 'production' ? ['tauri://localhost'] : ['http://localhost:3100'],
  advanced: {
    generateId: false,
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
