import type { connections } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { v7 } from 'uuid'

export function cloneConnectionForConnection(
  originalConnection: typeof connections.$inferSelect,
  newConnectionName: string,
) {
  const url = new SafeURL(originalConnection.connectionString)
  url.pathname = newConnectionName

  return {
    ...originalConnection,
    id: v7(),
    name: newConnectionName,
    connectionString: url.toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } satisfies typeof connections.$inferSelect
}
