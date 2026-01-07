import type { Auth, BetterAuthOptions, User } from 'better-auth'
import { PORTS } from '@conar/shared/constants'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous, bearer, lastLoginMethod, organization, twoFactor } from 'better-auth/plugins'
import { consola } from 'consola'
import { nanoid } from 'nanoid'
import { db } from '~/drizzle'
import { env, nodeEnv } from '~/env'
import { sendEmail } from '~/lib/email'
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

export const auth: Auth = betterAuth({
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
        required: true,
      },
      stripe_customer_id: {
        type: 'string',
        returned: false,
        input: false,
        required: false,
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
  trustedOrigins: [
    env.WEB_URL,
    'file://',
    ...(nodeEnv === 'development' ? [`http://localhost:${PORTS.DEV.DESKTOP}`] : []),
    ...(nodeEnv === 'test' ? [`http://localhost:${PORTS.TEST.DESKTOP}`] : []),
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
  // TODO: Remove this in future, it needed only for desktop auth in old versions
  account: {
    skipStateCookieCheck: true,
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
} satisfies BetterAuthOptions)
