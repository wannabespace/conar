import type { BetterAuthPlugin, User } from 'better-auth'
import { stripe } from '@better-auth/stripe'
import { PORTS } from '@conar/shared/constants'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous, bearer, createAuthMiddleware, lastLoginMethod, organization, twoFactor } from 'better-auth/plugins'
import { consola } from 'consola'
import { nanoid } from 'nanoid'
import { db } from '~/drizzle'
import { env } from '~/env'
import { sendEmail } from '~/lib/email'
import { loops } from '~/lib/loops'
import { stripe as stripeClient } from './stripe'

async function loopsUpdateUser(user: User) {
  try {
    if (loops) {
      const [firstName, ...lastName] = user.name.split(' ')

      await loops.updateContact({
        email: user.email,
        userId: user.id,
        properties: {
          name: user.name,
          firstName: firstName!,
          lastName: lastName.join(' '),
        },
      })
    }
  }
  catch (error) {
    if (error instanceof Error) {
      consola.error('Failed to update loops contact', error.message)
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

            if (headers) {
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
    organization({
      schema: {
        organization: {
          modelName: 'workspace',
        },
        member: {
          fields: {
            organizationId: 'workspaceId',
          },
        },
        invitation: {
          fields: {
            organizationId: 'workspaceId',
          },
        },
        session: {
          fields: {
            activeOrganizationId: 'activeWorkspaceId',
          },
        },
      },
    }),
    lastLoginMethod(),
    emailHarmony(),
    noSetCookiePlugin(),
    anonymous(),
    ...(stripeClient
      ? [stripe({
          stripeClient,
          subscription: {
            enabled: true,
            plans: [
              {
                name: 'Pro',
                priceId: env.STRIPE_MONTH_PRICE_ID!,
                annualDiscountPriceId: env.STRIPE_ANNUAL_PRICE_ID!,
                freeTrial: {
                  days: 7,
                },
              },
            ],
          },
          stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET!,
          createCustomerOnSignUp: true,
        })]
      : []),
  ],
  user: {
    additionalFields: {
      secret: {
        type: 'string',
        returned: false,
        input: false,
        defaultValue: () => nanoid(),
      },
    },
  },
  account: {
    skipStateCookieCheck: true,
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
  trustedOrigins: [
    env.WEB_URL,
    // Always allow local development origins for desktop testing
    `http://localhost:${PORTS.DEV.DESKTOP}`,
    `http://localhost:${PORTS.TEST.DESKTOP}`,
  ],
  advanced: {
    cookiePrefix: 'conar',
    database: {
      generateId: 'uuid',
    },
  },
  experimental: {
    joins: true,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user: { name, email }, url }) => {
      await sendEmail({
        to: email,
        subject: 'Reset your password',
        template: 'ResetPassword',
        props: {
          name: name || email,
          url,
        },
      })
    },
    onPasswordReset: async ({ user: { name, email } }) => {
      await sendEmail({
        to: email,
        subject: 'Your password has been reset',
        template: 'OnPasswordReset',
        props: {
          name: name || email,
        },
      })
    },
  },
  socialProviders: {
    google: {
      enabled: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
      prompt: 'select_account',
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      enabled: !!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET,
      clientId: env.GITHUB_CLIENT_ID!,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
})
