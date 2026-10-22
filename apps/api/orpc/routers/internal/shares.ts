import { timingSafeEqual } from 'node:crypto'

import { normalizeIP } from '@better-auth/core/utils/ip'
import { RedisRateLimiter } from '@orpc/ratelimit/redis'
import { resourceConnectionString } from '@tamery/connection/utils'
import { db } from '@tamery/db'
import { shares as sharesTable } from '@tamery/db/schema'
import { getDialect } from '@tamery/shared/enums/connection-type'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { shareToken } from '@tamery/shared/share'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'

import { env } from '~/env'
import { redis } from '~/lib/redis'
import { decryptConnectionString, orpc } from '~/orpc'

import { proxySecretMiddleware } from './proxy-secret'

const PASSWORD_WINDOW_MS = 10 * 60 * 1000

const passwordAttempts = {
  byClient: new RedisRateLimiter(redis, {
    maxRequests: 10,
    prefix: 'share-password:client:',
    window: PASSWORD_WINDOW_MS,
  }),
  byShare: new RedisRateLimiter(redis, {
    maxRequests: 1000,
    prefix: 'share-password:share:',
    window: PASSWORD_WINDOW_MS,
  }),
}

export const shares = {
  report: orpc
    .use(proxySecretMiddleware)
    .input(type({ failing: 'boolean', id: 'string.uuid' }))
    .handler(async ({ input }) => {
      await db
        .update(sharesTable)
        .set({ failingSince: input.failing ? new Date() : null })
        .where(eq(sharesTable.id, input.id))
    }),
  resolve: orpc
    .use(proxySecretMiddleware)
    .input(
      type({
        id: 'string.uuid',
        token: shareToken.or('null'),
        unlock: type({ client: 'string', password: 'string > 0' }).or('null'),
      })
    )
    .errors({
      LOCKED: { message: 'This table needs a password.' },
      NOT_FOUND: { message: 'This table is not shared anymore.' },
      TOO_MANY_ATTEMPTS: {
        message: 'Too many wrong passwords. Try again in a few minutes.',
      },
      WRONG_PASSWORD: { message: 'That password is not right.' },
    })
    .handler(async ({ errors, input }) => {
      const share = await db.query.shares.findFirst({
        columns: { connectionResourceId: false, userId: false },
        where: { id: { eq: input.id } },
        with: {
          connectionResource: {
            columns: { name: true },
            with: {
              connection: {
                columns: {
                  connectionString: true,
                  syncType: true,
                  type: true,
                  workspaceId: true,
                },
              },
            },
          },
        },
      })
      const connection = share?.connectionResource.connection

      if (
        !share ||
        !connection?.connectionString ||
        connection.syncType !== SyncType.Cloud ||
        (share.expiresAt && share.expiresAt <= new Date())
      ) {
        throw errors.NOT_FOUND()
      }

      // Signed over the hash, so changing the password turns away every viewer who unlocked with the old one.
      const token = share.passwordHash
        ? new Bun.CryptoHasher('sha256', env.BETTER_AUTH_SECRET)
            .update(`share-unlock:${share.id}:${share.passwordHash}`)
            .digest('hex')
        : null
      const unlocked =
        token === null ||
        (input.token !== null &&
          timingSafeEqual(
            Buffer.from(input.token, 'hex'),
            Buffer.from(token, 'hex')
          ))

      if (!unlocked && share.passwordHash) {
        const { unlock } = input
        if (!unlock) {
          throw errors.LOCKED()
        }
        const byClient = await passwordAttempts.byClient.limit(
          `${share.id}:${normalizeIP(unlock.client)}`
        )
        if (!byClient.success) {
          throw errors.TOO_MANY_ATTEMPTS()
        }
        const byShare = await passwordAttempts.byShare.limit(share.id)
        if (!byShare.success) {
          throw errors.TOO_MANY_ATTEMPTS()
        }
        if (!(await Bun.password.verify(unlock.password, share.passwordHash))) {
          throw errors.WRONG_PASSWORD()
        }
      }

      const { connectionResource, passwordHash: _passwordHash, ...rest } = share

      return {
        ...rest,
        connectionString: resourceConnectionString(
          await decryptConnectionString({
            encryptedText: connection.connectionString,
            workspaceId: connection.workspaceId,
          }),
          connectionResource.name
        ),
        dialect: getDialect(connection.type),
        token,
      }
    }),
}
