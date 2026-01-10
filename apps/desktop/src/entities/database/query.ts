import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { Type } from 'arktype'
import type { databases } from '~/drizzle'
import { dialects } from './dialects'

export function createQuery<P = undefined, T extends Type = Type<unknown>>(options: {
  type?: T
  query: (params: P) => ({
    [D in DatabaseType]: (dialect: ReturnType<typeof dialects[D]>) => Promise<
      T extends Type ? T['inferIn'] : unknown
    >
  })
}) {
  return async (...p: [database: typeof databases.$inferSelect, ...(P extends undefined ? [] : [P])]): Promise<T extends Type ? T['inferOut'] : unknown> => {
    const [database, params] = p
    // eslint-disable-next-line ts/no-explicit-any
    const result = await options.query(params)[database.type](dialects[database.type](database) as any)

    try {
      return options.type
        ? options.type.assert(result) as T extends Type ? T['inferOut'] : unknown
        : result
    }
    catch (error) {
      console.warn(result)
      throw error
    }
  }
}
