import type { CompiledQuery, Driver, QueryResult } from 'kysely'
import type { databases } from '~/drizzle'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { Store } from '@tanstack/react-store'
import { MysqlDialect, PostgresDialect } from 'kysely'
import { formatSql } from '~/lib/formatter'

export interface QueryLog {
  id: string
  sql: string
  createdAt: Date
  result: unknown | null
  duration: number | null
  values: unknown[]
  error: string | null
}

export const queriesLogStore = new Store<Record<string, Record<string, QueryLog>>>({})

export function logQuery(
  database: typeof databases.$inferSelect,
  {
    sql,
    values,
    promise,
  }: {
    sql: string
    values: unknown[]
    promise: Promise<{ result: unknown, duration: number }>
  },
) {
  const id = crypto.randomUUID()

  queriesLogStore.setState(state => ({
    ...state,
    [database.id]: {
      ...(state[database.id] || {}),
      [id]: {
        id,
        createdAt: new Date(),
        sql: formatSql(sql, database.type)
          .split('\n')
          .filter(str => !str.startsWith('--'))
          .join(' '),
        values,
        result: null,
        duration: null,
        error: null,
      },
    },
  } satisfies typeof state))

  promise
    .then(({ result, duration }) => {
      queriesLogStore.setState(state => ({
        ...state,
        [database.id]: {
          ...state[database.id],
          [id]: {
            ...state[database.id]![id]!,
            result,
            duration,
          },
        },
      } satisfies typeof state))
    })
    .catch((error) => {
      queriesLogStore.setState(state => ({
        ...state,
        [database.id]: {
          ...state[database.id],
          [id]: {
            ...state[database.id]![id]!,
            error: error instanceof Error ? error.message : String(error),
          },
        },
      } satisfies typeof state))
    })
}

class ProxyDriver implements Driver {
  constructor(private readonly database: typeof databases.$inferSelect) {}

  async init() {}

  async acquireConnection() {
    return {
      executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
        const promise = window.electron!.sql[this.database.type]({
          sql: compiledQuery.sql,
          values: compiledQuery.parameters as unknown[],
          connectionString: this.database.connectionString,
        })

        logQuery(this.database, {
          sql: compiledQuery.sql,
          values: compiledQuery.parameters as unknown[],
          promise,
        })

        const { result } = await promise

        return {
          rows: result as R[],
        }
      },
      streamQuery() {
        throw new Error('Not implemented')
      },
    }
  }

  async beginTransaction() {}
  async commitTransaction() {}
  async rollbackTransaction() {}
  async releaseConnection() {}
  async destroy() {}
}

const dialectMap = {
  [DatabaseType.Postgres]: PostgresDialect,
  [DatabaseType.MySQL]: MysqlDialect,
}

export function createDialect<D extends typeof databases.$inferSelect>(database: D) {
  class ProxyDialect extends dialectMap[database.type] {
    constructor(private readonly database: D) {
      // eslint-disable-next-line ts/no-explicit-any
      super({} as any)
    }

    createDriver() {
      return new ProxyDriver(this.database)
    }
  }

  return new ProxyDialect(database) as InstanceType<typeof dialectMap[D['type']]>
}
