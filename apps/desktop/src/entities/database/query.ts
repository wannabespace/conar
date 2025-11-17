import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { MysqlDatabase, PostgresDatabase } from './schemas'
import type { databases } from '~/drizzle'
import { Store } from '@tanstack/react-store'
import { Kysely } from 'kysely'
import { formatSql } from '~/lib/formatter'
import { DummyMysqlDialect, DummyPostgresDialect } from './dialects'

export interface QueryLog {
  id: string
  sql: string
  createdAt: Date
  result: unknown | null
  duration: number | null
  values: unknown[]
  label: string | null
  error: string | null
}

export const queriesLogStore = new Store<Record<string, Record<string, QueryLog>>>({})

export function logQuery(
  database: typeof databases.$inferSelect,
  {
    sql,
    values,
    promise,
    label,
  }: {
    sql: string
    values: unknown[]
    promise: Promise<{ result: unknown, duration: number }>
    label?: string
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
        label: label || null,
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

export async function executeSql(database: typeof databases.$inferSelect, {
  sql,
  values,
}: {
  sql: string
  values: unknown[]
}) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  try {
    const { result, duration } = await window.electron.sql({ sql, values: values as unknown[], type: database.type, connectionString: database.connectionString })

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(database.type, { sql, values, result })
    }

    return { result, duration }
  }
  catch (error) {
    if (import.meta.env.DEV) {
      console.error(database.type, { sql, values, error })
    }

    throw error
  }
}

export const kysely = {
  postgres: new Kysely<PostgresDatabase>({ dialect: new DummyPostgresDialect() }),
  mysql: new Kysely<MysqlDatabase>({ dialect: new DummyMysqlDialect() }),
} satisfies Record<DatabaseType, unknown>

export async function runSql<T = unknown>(database: typeof databases.$inferSelect, {
  validate,
  query: queryFn,
}: {
  validate?: (result: unknown) => T
  query: {
    [D in DatabaseType]: (params: {
      execute: (params: { sql: string, parameters: readonly unknown[] }) => ReturnType<typeof executeSql>
      log: (params: Omit<Parameters<typeof logQuery>[1], 'values'> & { parameters: readonly unknown[] }) => void
      qb: typeof kysely[D]
    }) => Promise<{ result: T, duration: number }>
  }
}) {
  const { result, duration } = await queryFn[database.type]({
    execute: params => executeSql(database, {
      sql: params.sql,
      values: params.parameters as unknown[],
    }),
    log: params => logQuery(database, {
      ...params,
      values: params.parameters as unknown[],
    }),
    // eslint-disable-next-line ts/no-explicit-any
    qb: kysely[database.type] as any,
  } satisfies Parameters<NonNullable<typeof queryFn>[DatabaseType]>[0])

  return {
    result: validate ? validate(result) : result,
    duration,
  }
}
