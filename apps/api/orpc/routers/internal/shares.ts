import { timingSafeEqual } from 'node:crypto'

import { resourceConnectionString } from '@tamery/connection/utils'
import { db } from '@tamery/db'
import { shares as sharesTable } from '@tamery/db/schema'
import { decrypt } from '@tamery/shared/crypto-node'
import { getDialect } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'

import { env } from '~/env'
import { redis } from '~/lib/redis'
import { getWorkspaceSecret, orpc } from '~/orpc'

import { proxySecretMiddleware } from './proxy-secret'

const MAX_CLIENT_FAILURES = 10
const MAX_SHARE_FAILURES = 1000
const PASSWORD_LOCKOUT_SECONDS = 10 * 60

const passwordFailures = {
  keys: (shareId: string, client: string) => [
    `share-password-failures:${shareId}:${client}`,
    `share-password-failures:${shareId}`,
  ],
  locked: async (shareId: string, client: string) => {
    const [byClient, byShare] = await redis.mGet(
      passwordFailures.keys(shareId, client)
    )
    return (
      Number(byClient) >= MAX_CLIENT_FAILURES ||
      Number(byShare) >= MAX_SHARE_FAILURES
    )
  },
  record: (shareId: string, client: string) => {
    const multi = redis.multi()
    for (const key of passwordFailures.keys(shareId, client)) {
      multi.incr(key).expire(key, PASSWORD_LOCKOUT_SECONDS, 'NX')
    }
    return multi.exec()
  },
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
        token: 'string.hex == 64 | null',
        unlock: type({ client: 'string', password: 'string > 0' }).or('null'),
      })
    )
    .errors({
      LOCKED: { message: 'This table needs a password.' },
      NOT_FOUND: { message: 'This table is not shared anymore.' },
      TOO_MANY_ATTEMPTS: {
        message: 'Too many wrong passwords. Try again in a few minutes.',
      },
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
                  type: true,
                  workspaceId: true,
                },
              },
            },
          },
        },
      })
      const connection = share?.connectionResource?.connection

      if (
        !share?.connectionResource ||
        !connection?.connectionString ||
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

      // The lockout is checked before verifying, or a guess past it would still be answered.
      if (!unlocked && share.passwordHash) {
        const { unlock } = input
        if (!unlock) {
          throw errors.LOCKED()
        }
        if (await passwordFailures.locked(share.id, unlock.client)) {
          throw errors.TOO_MANY_ATTEMPTS()
        }
        if (!(await Bun.password.verify(unlock.password, share.passwordHash))) {
          await passwordFailures.record(share.id, unlock.client)
          throw errors.LOCKED()
        }
      }

      const { connectionResource, passwordHash: _passwordHash, ...rest } = share

      return {
        ...rest,
        connectionString: resourceConnectionString(
          decrypt({
            encryptedText: connection.connectionString,
            secret: await getWorkspaceSecret(connection.workspaceId),
          }),
          connectionResource.name
        ),
        dialect: getDialect(connection.type),
        token,
      }
    }),
}
