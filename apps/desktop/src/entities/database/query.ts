import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { Type } from 'arktype'
import type { MysqlDatabase, PostgresDatabase } from './schemas'
import type { databases } from '~/drizzle'
import { Store } from '@tanstack/react-store'
import { CompiledQuery, Kysely } from 'kysely'
import { formatSql } from '~/lib/formatter'
import { createDialect } from './dialects'

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

const dialects = {
  postgres: database => new Kysely<PostgresDatabase>({ dialect: createDialect(database) }),
  mysql: database => new Kysely<MysqlDatabase>({ dialect: createDialect(database) }),
} satisfies Record<DatabaseType, (database: typeof databases.$inferSelect, label: string) => unknown>

export function executeSql(database: typeof databases.$inferSelect, sql: string, values: unknown[] = []) {
  return dialects[database.type](database).executeQuery(CompiledQuery.raw(sql, values))
}

export function createQuery<P = undefined, T extends Type = Type<unknown>>(options: {
  type?: T
  query: (params: P) => ({
    [D in DatabaseType]: (params: { db: ReturnType<typeof dialects[D]> }) => Promise<
      T extends Type ? T['inferIn'] : unknown
    >
  })
}) {
  return {
    run: async (...p: [database: typeof databases.$inferSelect, ...(P extends undefined ? [] : [P])]): Promise<T extends Type ? T['inferOut'] : unknown> => {
      const [database, params] = p
      const result = await options.query(params)[database.type]({
        // eslint-disable-next-line ts/no-explicit-any
        db: dialects[database.type](database) as any,
      })

      return options.type
        ? options.type.assert(result) as T extends Type ? T['inferOut'] : unknown
        : result
    },
  }
}
