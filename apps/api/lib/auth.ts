import type { BetterAuthOptions } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { AUTH_COOKIE_PREFIX, PORTS } from '@conar/shared/constants'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { createAuthMiddleware } from 'better-auth/api'
import { anonymous, bearer, lastLoginMethod, organization, twoFactor } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '~/drizzle'
import { users } from '~/drizzle/schema'
import * as schema from '~/drizzle/schema'
import { env, nodeEnv } from '~/env'
import { resend, sendEmail } from '~/lib/resend'
import { redisMemoize } from './redis'

const webUrl = new URL(env.WEB_URL)

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
    anonymous(),
  ],
  user: {
    additionalFields: {
      secret: {
        type: 'string',
        returned: false,
        input: false,
        defaultValue: () => nanoid(),
      },
      stripeCustomerId: {
        type: 'string',
        returned: false,
        input: false,
        required: false,
        fieldName: 'stripe_customer_id',
      },
      desktopVersion: {
        fieldName: 'desktop_version',
        type: 'string',
        input: false,
        required: false,
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const desktopVersion = ctx.headers?.get('x-desktop-version')

      if (!ctx.context.session) {
        return
      }

      ctx.request?.headers.set('user-id', ctx.context.session.user.id)

      if (desktopVersion) {
        await redisMemoize(async () => {
          await db.update(users).set({
            desktopVersion,
          }).where(eq(users.id, ctx.context.session!.user.id))
        }, `desktop-version:${ctx.context.session.user.id}`)
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (nodeEnv !== 'production' || !resend) {
            return
          }

          const [firstName, ...lastName] = user.name.split(' ')

          await resend.contacts.create({
            email: user.email,
            firstName: firstName!,
            lastName: lastName.join(' '),
            properties: {
              id: user.id,
            },
          })
        },
      },
      update: {
        after: async (user) => {
          if (nodeEnv !== 'production' || !resend) {
            return
          }

          const [firstName, ...lastName] = user.name.split(' ')

          await resend.contacts.update({
            email: user.email,
            firstName: firstName!,
            lastName: lastName.join(' '),
            properties: {
              id: user.id,
            },
          })
        },
      },
    },
  },
  onAPIError: {
    onError: async (error) => {
      if (!env.ALERTS_EMAIL) {
        console.error('ALERTS_EMAIL is not set')
        return
      }

      const text = typeof error === 'object' && error !== null ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : String(error)

      if (text.includes('Invalid email')) {
        return
      }

      await sendEmail({
        to: env.ALERTS_EMAIL,
        subject: 'Alert from Better Auth',
        template: 'Alert',
        props: {
          text,
          service: 'Better Auth',
        },
      })
    },
  },
  trustedOrigins: [
    env.WEB_URL,
    `${webUrl.protocol}//*.${webUrl.host}`,
    'file://',
    ...(nodeEnv === 'development' ? [`http://localhost:${PORTS.DEV.DESKTOP}`, `http://localhost:${PORTS.DEV.APP}`] : []),
    ...(nodeEnv === 'test' ? [`http://localhost:${PORTS.TEST.DESKTOP}`, `http://localhost:${PORTS.TEST.APP}`] : []),
  ],
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
    crossSubDomainCookies: {
      enabled: nodeEnv === 'production',
      domain: webUrl.host,
    },
    database: {
      generateId: 'uuid',
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema,
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
} satisfies BetterAuthOptions as BetterAuthOptions)
