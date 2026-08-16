import { apiKey } from '@better-auth/api-key'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { db } from '@tamery/db'
import { users } from '@tamery/db/schema'
import * as schema from '@tamery/db/schema'
import { infisical } from '@tamery/infisical'
import {
  API_KEY_PERMISSIONS,
  AUTH_COOKIE_PREFIX,
} from '@tamery/shared/constants'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { createAuthMiddleware } from 'better-auth/api'
import {
  anonymous,
  bearer,
  lastLoginMethod,
  organization,
  twoFactor,
} from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { v7 } from 'uuid'

import { INFISICAL_USER_ENCRYPTION_SECRET_NAME } from '~/constants'
import { env, nodeEnv } from '~/env'
import { resend, sendEmail } from '~/lib/resend'

import { redisMemoize } from './redis'
import { getSubscription } from './subscription'
import { ensureDefaultWorkspace } from './workspace'

export const auth = betterAuth({
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
    crossSubDomainCookies: {
      domain: 'tamery.app',
      enabled: true,
    },
    database: {
      generateId: () => v7(),
    },
  },
  appName: 'Tamery',
  basePath: '/auth',
  baseURL: env.API_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
      api_keys: schema.apiKeys,
    },
    usePlural: true,
  }) as ReturnType<typeof drizzleAdapter>,
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          try {
            await ensureDefaultWorkspace(session.userId)
          } catch (error) {
            console.error(
              `Failed to ensure default workspace on session create: ${error instanceof Error ? error.message : error}`
            )
          }

          return { data: session }
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          await infisical.secrets
            .set({
              name: INFISICAL_USER_ENCRYPTION_SECRET_NAME,
              path: ['users', user.id],
              value: nanoid(),
            })
            .catch(async (error) => {
              console.error(
                `Failed to set user secret in Infisical: ${error instanceof Error ? error.message : error}`,
                error instanceof Error && error.cause ? error.cause : undefined
              )
              await db.delete(users).where(eq(users.id, user.id))
              throw error
            })

          if (resend) {
            const [firstName = '', ...lastName] = user.name.split(' ')

            await resend.contacts.create({
              email: user.email,
              firstName,
              lastName: lastName.join(' '),
              properties: {
                id: user.id,
              },
            })
          }
        },
      },
      delete: {
        after: async (user) => {
          await infisical.secrets
            .delete({
              name: INFISICAL_USER_ENCRYPTION_SECRET_NAME,
              path: ['users', user.id],
            })
            .catch((error) => {
              console.error(
                `Failed to delete user secret in Infisical: ${error instanceof Error ? error.message : error}`,
                error instanceof Error && error.cause ? error.cause : undefined
              )
            })
        },
      },
      update: {
        after: async (user) => {
          if (nodeEnv !== 'production' || !resend) {
            return
          }

          const [firstName = '', ...lastName] = user.name.split(' ')

          await resend.contacts.update({
            email: user.email,
            firstName,
            lastName: lastName.join(' '),
            properties: {
              id: user.id,
            },
          })
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    onPasswordReset: async ({ user: { name, email } }) => {
      await sendEmail({
        props: {
          name: name || email,
        },
        subject: 'Your password has been reset',
        template: 'OnPasswordReset',
        to: email,
      })
    },
    requireEmailVerification: false,
    sendResetPassword: async ({ user: { name, email }, url }) => {
      await sendEmail({
        props: {
          name: name || email,
          url,
        },
        subject: 'Reset your password',
        template: 'ResetPassword',
        to: email,
      })
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const desktopVersion = ctx.headers?.get('x-desktop-version')

      if (!ctx.context.session) {
        return
      }

      ctx.request?.headers.set('user-id', ctx.context.session.user.id)

      const { session } = ctx.context.session

      if (desktopVersion) {
        const { userId } = session
        await redisMemoize(async () => {
          await db
            .update(users)
            .set({
              desktopVersion,
            })
            .where(eq(users.id, userId))
        }, `desktop-version:${userId}`)
      }
    }),
  },
  onAPIError: {
    onError: async (error) => {
      const text =
        typeof error === 'object' && error !== null
          ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
          : String(error)

      if (text.includes('Invalid email')) {
        return
      }

      if (env.ALERTS_EMAIL) {
        await sendEmail({
          props: {
            service: 'Better Auth',
            text,
          },
          subject: 'Alert from Better Auth',
          template: 'Alert',
          to: env.ALERTS_EMAIL,
        })
      } else {
        console.error('Alert from Better Auth', { text })
      }
    },
  },
  plugins: [
    bearer(),
    twoFactor(),
    organization({
      allowUserToCreateOrganization: async (user) =>
        !!(await getSubscription(user.id)),
      disableOrganizationDeletion: true,
      schema: {
        invitation: {
          fields: {
            organizationId: 'workspaceId',
          },
        },
        member: {
          fields: {
            organizationId: 'workspaceId',
          },
        },
        organization: {
          modelName: 'workspace',
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
    apiKey({
      defaultPrefix: nodeEnv === 'production' ? 'tmy_' : 'tmy_test_',
      permissions: {
        defaultPermissions: API_KEY_PERMISSIONS,
      },
      requireName: true,
      schema: {
        apikey: {
          modelName: 'api_key',
        },
      },
      startingCharactersConfig: {
        charactersLength: nodeEnv === 'production' ? 20 : 15,
      },
    }),
  ],
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID ?? '',
      clientSecret: env.GITHUB_CLIENT_SECRET ?? '',
      enabled: !!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
      enabled: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
      prompt: 'select_account',
    },
  },
  trustedOrigins: [
    'https://tamery.app',
    'https://*.tamery.app',
    'file://',
    ...(nodeEnv === 'development' ? ['http://localhost:*'] : []),
  ],
  user: {
    additionalFields: {
      desktopVersion: {
        fieldName: 'desktop_version',
        input: false,
        required: false,
        type: 'string',
      },
      stripeCustomerId: {
        fieldName: 'stripe_customer_id',
        input: false,
        required: false,
        returned: false,
        type: 'string',
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
})
