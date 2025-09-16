import type { DatabaseType } from '@conar/shared/enums/database-type'
import { pgProxy, pgTestConnection } from './pg'

export const proxy = {
  databases: {
    postgres: {
      query: pgProxy,
      test: pgTestConnection,
    },
  } satisfies Record<DatabaseType, {
    query: typeof pgProxy
    test: typeof pgTestConnection
  }>,
}
