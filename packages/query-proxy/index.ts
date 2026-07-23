import type { BuilderWithMiddlewares, RouterClient } from '@orpc/server'
import { type } from '@orpc/server'
import type { QueryExecutor } from '@tamery/connection/queries'
import * as clickhouse from '@tamery/connection/queries/dialects/clickhouse'
import * as mssql from '@tamery/connection/queries/dialects/mssql'
import * as mysql from '@tamery/connection/queries/dialects/mysql'
import * as pg from '@tamery/connection/queries/dialects/pg'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { AnyFunction, Prettify } from '@tamery/shared/utils/helpers'

// oxlint-disable-next-line ts/no-explicit-any
export type AnyBuilder = BuilderWithMiddlewares<any, any, any, any, any, any>

type Params<T extends AnyFunction, P extends Parameters<T>[0] = Parameters<T>[0]> = Prettify<
  P extends { connectionString: string }
    ? // oxlint-disable-next-line style/indent-binary-ops
      Omit<P, 'connectionString'> & {
        connectionString?: string
        connectionId?: string
        resourceId?: string
      } & ({ resourceId: string } | { connectionString: string } | { connectionId: string })
    : P
>

interface ConnectionInput {
  connectionString?: string
  connectionId?: string
  resourceId?: string
}

function createQueryDialect<T extends AnyBuilder>(
  dialect: QueryExecutor,
  orpc: T,
  resolveConnectionString: (
    input: ConnectionInput,
    context: Parameters<Parameters<T['handler']>[0]>[0]['context'],
  ) => string | Promise<string>,
) {
  return {
    execute: orpc
      .input(type<Params<typeof dialect.execute>>())
      .handler(async ({ input, context }) =>
        dialect.execute({
          ...input,
          connectionString: await resolveConnectionString(input, context),
        }),
      ),
    beginTransaction: orpc
      .input(type<Params<typeof dialect.beginTransaction>>())
      .handler(async ({ input, context }) =>
        dialect.beginTransaction({
          ...input,
          connectionString: await resolveConnectionString(input, context),
        }),
      ),
    executeTransaction: orpc
      .input(type<Params<typeof dialect.executeTransaction>>())
      .handler(({ input }) => dialect.executeTransaction(input)),
    commitTransaction: orpc
      .input(type<Params<typeof dialect.commitTransaction>>())
      .handler(({ input }) => dialect.commitTransaction(input)),
    rollbackTransaction: orpc
      .input(type<Params<typeof dialect.rollbackTransaction>>())
      .handler(({ input }) => dialect.rollbackTransaction(input)),
  } satisfies Record<keyof QueryExecutor, unknown>
}

export function createQueryRouter<T extends AnyBuilder>(
  orpc: T,
  resolveConnectionString: (
    input: ConnectionInput,
    context: Parameters<Parameters<T['handler']>[0]>[0]['context'],
  ) => string | Promise<string>,
) {
  return {
    postgres: createQueryDialect(pg.query, orpc, resolveConnectionString),
    mysql: createQueryDialect(mysql.query, orpc, resolveConnectionString),
    clickhouse: createQueryDialect(clickhouse.query, orpc, resolveConnectionString),
    mssql: createQueryDialect(mssql.query, orpc, resolveConnectionString),
  } satisfies Record<ConnectionType, Record<keyof QueryExecutor, unknown>>
}

export type ORPCRouter = RouterClient<ReturnType<typeof createQueryRouter>>
