import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Type } from 'arktype'
import type { connections } from '~/drizzle'
import { dialects } from './dialects'

export function createQuery<P = undefined, T extends Type = Type<unknown>>(options: {
  type?: T
  /**
   * In case of connection error, the query will not show a toast notification.
   *
   * @default false
   */
  silent?: boolean
  query: (params: P) => ({
    [D in ConnectionType]: (dialect: ReturnType<typeof dialects[D]>) => Promise<
      T extends Type ? T['inferIn'] : unknown
    >
  })
}) {
  return async (...p: [database: typeof connections.$inferSelect, ...(P extends undefined ? [] : [P])]): Promise<T extends Type ? T['inferOut'] : unknown> => {
    const [database, params] = p

    const result = await options.query(params)[database.type](dialects[database.type](database, {
      silent: options.silent,
    // eslint-disable-next-line ts/no-explicit-any
    }) as any)

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
