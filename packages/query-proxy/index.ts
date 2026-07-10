import type { QueryExecutor } from '@conar/connection/queries'
import * as clickhouse from '@conar/connection/queries/dialects/clickhouse'
import * as mssql from '@conar/connection/queries/dialects/mssql'
import * as mysql from '@conar/connection/queries/dialects/mysql'
import * as pg from '@conar/connection/queries/dialects/pg'
import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { AnyFunction, Prettify } from '@conar/shared/utils/helpers'
import type { BuilderWithMiddlewares, RouterClient } from '@orpc/server'
import { type } from '@orpc/server'

// eslint-disable-next-line typescript/no-explicit-any
export type AnyBuilder = BuilderWithMiddlewares<any, any, any, any, any, any>

type Params<T extends AnyFunction, P extends Parameters<T>[0] = Parameters<T>[0]> = Prettify<
  P extends { connectionString: string }
    ? Omit<P, 'connectionString'> & {
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
