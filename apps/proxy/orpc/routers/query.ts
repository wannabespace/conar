import type { QueryExecutor } from '@conar/connection/queries'
import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { AnyFunction, Prettify } from '@conar/shared/utils/helpers'
import * as clickhouse from '@conar/connection/queries/dialects/clickhouse'
import * as mssql from '@conar/connection/queries/dialects/mssql'
import * as mysql from '@conar/connection/queries/dialects/mysql'
import * as pg from '@conar/connection/queries/dialects/pg'
import { db } from '@conar/db'
import { SyncType } from '@conar/shared/enums/sync-type'
import { decrypt } from '@conar/shared/utils/encryption'
import { ORPCError, type } from '@orpc/server'
import { authMiddleware, orpc } from '~/orpc'

type Params<T extends AnyFunction, P extends Parameters<T>[0] = Parameters<T>[0]> = Prettify<P extends { connectionString: string }
  ? Omit<P, 'connectionString'> & {
    connectionString?: string
    connectionId?: string
    resourceId?: string
  } & ({ resourceId: string } | { connectionString: string } | { connectionId: string })
  : P>

async function resolveQueryConnectionString(
  input: { connectionString?: string, resourceId?: string, connectionId?: string },
  userId: string,
  getUserSecret: () => Promise<string>,
) {
  let connectionString = input.connectionString

  if (input.resourceId) {
    const [connection, secret] = await Promise.all([
      db.query.connectionsResources.findFirst({
        columns: {},
        where: {
          id: {
            eq: input.resourceId,
          },
        },
        with: {
          connection: {
            columns: {
              connectionString: true,
              syncType: true,
              isPasswordExists: true,
            },
            where: {
              userId: {
                eq: userId,
              },
            },
          },
        },
      }),
      getUserSecret(),
    ])

    if (!connection || !connection.connection) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
    }

    if (connection.connection.syncType === SyncType.CloudWithoutPassword && connection.connection.isPasswordExists) {
      throw new ORPCError('FORBIDDEN', { message: 'This connection is not allowed to be used because it was created as a cloud connection without a password.' })
    }

    connectionString = decrypt({ encryptedText: connection.connection.connectionString, secret })
  }

  if (input.connectionId) {
    const connection = await db.query.connections.findFirst({
      columns: {
        connectionString: true,
        syncType: true,
        isPasswordExists: true,
      },
      where: {
        id: {
          eq: input.connectionId,
        },
        userId: {
          eq: userId,
        },
      },
    })

    if (!connection) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
    }

    if (connection.syncType === SyncType.CloudWithoutPassword && connection.isPasswordExists) {
      throw new ORPCError('FORBIDDEN', { message: 'This connection is not allowed to be used because it was created as a cloud connection without a password.' })
    }

    connectionString = decrypt({ encryptedText: connection.connectionString, secret: await getUserSecret() })
  }

  return connectionString!
}

function createQueryExecutor(dialect: QueryExecutor) {
  return {
    execute: orpc
      .use(authMiddleware)
      .input(type<Params<typeof dialect.execute>>())
      .handler(async ({ input, context }) => dialect.execute({
        ...input,
        connectionString: await resolveQueryConnectionString(input, context.user.id, context.getUserSecret),
      })),
    beginTransaction: orpc
      .use(authMiddleware)
      .input(type<Params<typeof dialect.beginTransaction>>())
      .handler(async ({ input, context }) => dialect.beginTransaction({
        ...input,
        connectionString: await resolveQueryConnectionString(input, context.user.id, context.getUserSecret),
      })),
    executeTransaction: orpc
      .use(authMiddleware)
      .input(type<Params<typeof dialect.executeTransaction>>())
      .handler(({ input }) => dialect.executeTransaction(input)),
    commitTransaction: orpc
      .use(authMiddleware)
      .input(type<Params<typeof dialect.commitTransaction>>())
      .handler(({ input }) => dialect.commitTransaction(input)),
    rollbackTransaction: orpc
      .use(authMiddleware)
      .input(type<Params<typeof dialect.rollbackTransaction>>())
      .handler(({ input }) => dialect.rollbackTransaction(input)),
  } satisfies Record<keyof QueryExecutor, unknown>
}

export const query = {
  postgres: createQueryExecutor(pg.query),
  mysql: createQueryExecutor(mysql.query),
  clickhouse: createQueryExecutor(clickhouse.query),
  mssql: createQueryExecutor(mssql.query),
} satisfies Record<ConnectionType, Record<keyof QueryExecutor, unknown>>
