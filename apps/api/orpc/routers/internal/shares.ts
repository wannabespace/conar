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

const MAX_PASSWORD_FAILURES = 10
const PASSWORD_LOCKOUT_SECONDS = 10 * 60

const passwordFailures = {
  count: async (shareId: string) =>
    Number(await redis.get(passwordFailures.key(shareId))),
  key: (shareId: string) => `share-password-failures:${shareId}`,
  record: (shareId: string) =>
    redis
      .multi()
      .incr(passwordFailures.key(shareId))
      .expire(passwordFailures.key(shareId), PASSWORD_LOCKOUT_SECONDS, 'NX')
      .exec(),
}

// Signed over the hash, so changing the password turns away every viewer who unlocked with the old one.
const getUnlockToken = (shareId: string, passwordHash: string) =>
  new Bun.CryptoHasher('sha256', env.BETTER_AUTH_SECRET)
    .update(`share-unlock:${shareId}:${passwordHash}`)
    .digest('hex')

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
        password: 'string | null',
        token: 'string.hex == 64 | null',
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

      const token = share.passwordHash
        ? getUnlockToken(share.id, share.passwordHash)
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
        if ((await passwordFailures.count(share.id)) >= MAX_PASSWORD_FAILURES) {
          throw errors.TOO_MANY_ATTEMPTS()
        }
        if (
          !input.password ||
          !(await Bun.password.verify(input.password, share.passwordHash))
        ) {
          if (input.password) {
            await passwordFailures.record(share.id)
          }
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
