import type { Auth, BetterAuthOptions } from 'better-auth'
import { AUTH_COOKIE_PREFIX, PORTS } from '@conar/shared/constants'
import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { betterAuth } from 'better-auth'
import { emailHarmony } from 'better-auth-harmony'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous, bearer, createAuthMiddleware, lastLoginMethod, organization, twoFactor } from 'better-auth/plugins'
import { and, count, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { chats, connections, db, queries, users } from '~/drizzle'
import { env, nodeEnv } from '~/env'
import { resend, sendEmail } from '~/lib/resend'
import { redisMemoize } from './redis'

async function getUserSecret(id: string) {
  const user = await db.query.users.findFirst({ columns: { secret: true }, where: (t, { eq }) => eq(t.id, id) })
  return user?.secret ?? null
}

async function targetHasUserData(userId: string) {
  const [conns, qs, chatCount] = await Promise.all([
    db.select({ count: count() }).from(connections).where(eq(connections.userId, userId)),
    db.select({ count: count() }).from(queries).where(eq(queries.userId, userId)),
    db.select({ count: count() }).from(chats).where(eq(chats.userId, userId)),
  ])
  const total = Number(conns[0]?.count ?? 0) + Number(qs[0]?.count ?? 0) + Number(chatCount[0]?.count ?? 0)
  return total > 0
}

export async function mergeAnonymousUserData(
  anonymousUserId: string,
  targetUserId: string,
  options?: { trusted?: boolean },
) {
  if (anonymousUserId === targetUserId)
    return

  const trusted = options?.trusted ?? false
  const [anonSecret, targetSecret, hasData] = await Promise.all([
    getUserSecret(anonymousUserId),
    getUserSecret(targetUserId),
    trusted ? false : targetHasUserData(targetUserId),
  ])
  if (!anonSecret || !targetSecret)
    return
  if (hasData)
    return

  const rekey = (encrypted: string) =>
    encrypt({ text: decrypt({ encryptedText: encrypted, secret: anonSecret }), secret: targetSecret })

  await db.transaction(async (tx) => {
    const [anonConnections, anonQueries] = await Promise.all([
      tx.select({ id: connections.id, connectionString: connections.connectionString })
        .from(connections)
        .where(eq(connections.userId, anonymousUserId)),
      tx.select({ id: queries.id, query: queries.query })
        .from(queries)
        .where(eq(queries.userId, anonymousUserId)),
    ])

    await Promise.all([
      ...anonConnections.map(({ id, connectionString }) =>
        tx.update(connections)
          .set({ userId: targetUserId, connectionString: rekey(connectionString) })
          .where(and(eq(connections.id, id), eq(connections.userId, anonymousUserId))),
      ),
      ...anonQueries.map(({ id, query }) =>
        tx.update(queries)
          .set({ userId: targetUserId, query: rekey(query) })
          .where(and(eq(queries.id, id), eq(queries.userId, anonymousUserId))),
      ),
      tx.update(chats).set({ userId: targetUserId }).where(eq(chats.userId, anonymousUserId)),
    ])
  })
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
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await mergeAnonymousUserData(anonymousUser.user.id, newUser.user.id, { trusted: true })
      },
      generateRandomEmail: () => {
        return `guest-${nanoid()}@guest.conar.app`
      },
    }),
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
    'file://',
    ...(nodeEnv === 'development' ? [`http://localhost:${PORTS.DEV.DESKTOP}`] : []),
    ...(nodeEnv === 'test' ? [`http://localhost:${PORTS.TEST.DESKTOP}`] : []),
  ],
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
    crossSubDomainCookies: {
      enabled: nodeEnv === 'production',
      domain: new URL(env.WEB_URL).host,
    },
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
