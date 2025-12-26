import type { databases } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { v7 } from 'uuid'

export function cloneConnectionForDatabase(
  originalDatabase: typeof databases.$inferSelect,
  newDatabaseName: string,
) {
  const url = new SafeURL(originalDatabase.connectionString)
  url.pathname = newDatabaseName

  return {
    ...originalDatabase,
    id: v7(),
    name: newDatabaseName,
    connectionString: url.toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } satisfies typeof databases.$inferSelect
}
