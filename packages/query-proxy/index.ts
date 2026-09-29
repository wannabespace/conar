import type { BuilderWithMiddlewares, RouterClient } from '@orpc/server'
import { type } from '@orpc/server'
import type { QueryExecutor } from '@tamery/connection/queries'
import * as clickhouse from '@tamery/connection/queries/dialects/clickhouse'
import * as mssql from '@tamery/connection/queries/dialects/mssql'
import * as mysql from '@tamery/connection/queries/dialects/mysql'
import * as pg from '@tamery/connection/queries/dialects/pg'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { AnyFunction, Prettify } from '@tamery/shared/utils'

// oxlint-disable-next-line ts/no-explicit-any
export type AnyBuilder = BuilderWithMiddlewares<any, any, any, any, any, any>

type Params<
  T extends AnyFunction,
  P extends Parameters<T>[0] = Parameters<T>[0],
> = Prettify<
  P extends { connectionString: string }
    ? // oxlint-disable-next-line style/indent-binary-ops
      Omit<P, 'connectionString'> & {
        connectionString?: string
        connectionId?: string
        resourceId?: string
      } & (
          | { resourceId: string }
          | { connectionString: string }
          | { connectionId: string }
        )
    : P
>

interface ConnectionInput {
  connectionString?: string
  connectionId?: string
  resourceId?: string
}

type HandlerContext<T extends AnyBuilder> = Parameters<
  Parameters<T['handler']>[0]
>[0]['context']

interface Resolvers<T extends AnyBuilder> {
  connectionString: (
    input: ConnectionInput,
    context: HandlerContext<T>
  ) => string | Promise<string>
  /** Who a transaction belongs to, so a leaked `txId` cannot drive another user's transaction. */
  owner: (context: HandlerContext<T>) => string
}

const createQueryDialect = <T extends AnyBuilder>(
  dialect: QueryExecutor,
  orpc: T,
  resolve: Resolvers<T>
) =>
  ({
    beginTransaction: orpc
      .input(type<Params<typeof dialect.beginTransaction>>())
      .handler(async ({ input, context }) =>
        dialect.beginTransaction({
          ...input,
          connectionString: await resolve.connectionString(input, context),
          ownerId: resolve.owner(context),
        })
      ),
    cancel: orpc
      .input(type<Params<typeof dialect.cancel>>())
      .handler(async ({ input, context }) =>
        dialect.cancel({
          ...input,
          connectionString: await resolve.connectionString(input, context),
        })
      ),
    commitTransaction: orpc
      .input(type<Params<typeof dialect.commitTransaction>>())
      .handler(({ input, context }) =>
        dialect.commitTransaction({ ...input, ownerId: resolve.owner(context) })
      ),
    execute: orpc
      .input(type<Params<typeof dialect.execute>>())
      .handler(async ({ input, context }) =>
        dialect.execute({
          ...input,
          connectionString: await resolve.connectionString(input, context),
        })
      ),
    executeTransaction: orpc
      .input(type<Params<typeof dialect.executeTransaction>>())
      .handler(({ input, context }) =>
        dialect.executeTransaction({
          ...input,
          ownerId: resolve.owner(context),
        })
      ),
    rollbackTransaction: orpc
      .input(type<Params<typeof dialect.rollbackTransaction>>())
      .handler(({ input, context }) =>
        dialect.rollbackTransaction({
          ...input,
          ownerId: resolve.owner(context),
        })
      ),
  }) satisfies Record<keyof QueryExecutor, unknown>

export const createQueryRouter = <T extends AnyBuilder>(
  orpc: T,
  resolve: Resolvers<T>
) =>
  ({
    clickhouse: createQueryDialect(clickhouse.query, orpc, resolve),
    mssql: createQueryDialect(mssql.query, orpc, resolve),
    mysql: createQueryDialect(mysql.query, orpc, resolve),
    postgres: createQueryDialect(pg.query, orpc, resolve),
  }) satisfies Record<ConnectionType, Record<keyof QueryExecutor, unknown>>

export type ORPCRouter = RouterClient<ReturnType<typeof createQueryRouter>>
