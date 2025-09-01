import type { BetterAuthPlugin, User } from 'better-auth'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer, createAuthMiddleware, twoFactor } from 'better-auth/plugins'
import { db } from '~/drizzle'
import { env } from '~/env'
import { loops } from '~/lib/loops'

async function loopsUpdateUser(user: User) {
  try {
    if (loops) {
      const [firstName, ...lastName] = user.name.split(' ')

      await loops.updateContact({
        email: user.email,
        userId: user.id,
        properties: {
          name: user.name,
          firstName,
          lastName: lastName.join(' '),
        },
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

/**
 * Plugin to prevent setting the "set-cookie" header in responses.
 * We use it to prevent the cookie from being set in the desktop app because it uses bearer token instead of cookies.
 */
function noSetCookiePlugin() {
  return {
    id: 'no-set-cookie',
    hooks: {
      after: [
        {
          matcher: ctx => !!ctx.request?.headers.get('x-desktop'),
          handler: createAuthMiddleware(async (ctx) => {
            const headers = ctx.context.responseHeaders

            if (headers instanceof Headers) {
              const setCookies = headers.get('set-cookie')

              if (!setCookies)
                return

              headers.delete('set-cookie')
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin
}

export const auth = betterAuth({
  appName: 'Conar',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.API_URL,
  basePath: '/auth',
  plugins: [
    bearer(),
    twoFactor(),
    // organization({
    //   schema: {
    //     organization: {
    //       modelName: 'workspaces',
    //     },
    //   },
    // }),
    emailHarmony(),
    noSetCookiePlugin(),
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
  trustedOrigins: [env.WEB_URL, ...(Bun.env.NODE_ENV === 'production' ? [] : ['http://localhost:3002'])],
  advanced: {
    cookiePrefix: 'conar',
    database: {
      generateId: false,
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    }),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    }),
  },
})
