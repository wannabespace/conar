import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { Type } from 'arktype'
import type { MysqlDatabase, PostgresDatabase } from './schemas'
import type { databases } from '~/drizzle'
import { CompiledQuery, Kysely } from 'kysely'
import { createDialect } from './dialects'

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
