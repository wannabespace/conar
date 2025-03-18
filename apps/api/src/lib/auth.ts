import type { User } from 'better-auth'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer, organization, twoFactor } from 'better-auth/plugins'
import { db } from '~/drizzle'
import { env } from '~/env'
import { loops } from '~/lib/loops'

async function loopsUpdateUser(user: User) {
  try {
    if (process.env.NODE_ENV === 'production') {
      await loops.updateContact(user.email, {
        name: user.name,
      })
    }
  }
  catch (error) {
    if (error instanceof Error) {
      console.error('Failed to update loops contact', error.message)
    }
    throw error
  }
}

export const auth = betterAuth({
  appName: 'Connnect',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.API_URL,
  basePath: '/auth',
  plugins: [
    twoFactor(),
    bearer(),
    organization({
      schema: {
        organization: {
          modelName: 'workspaces',
        },
      },
    }),
    emailHarmony(),
  ],
  user: {
    additionalFields: {
      secret: {
        type: 'string',
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: loopsUpdateUser,
      },
      update: {
        after: loopsUpdateUser,
      },
    },
  },
  trustedOrigins: [env.WEB_URL, ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3002'])],
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
