import { connections, connectionsSelectSchema } from '@tamery/db/schema'
import { omit } from '@tamery/shared/utils'
import { getColumns } from 'drizzle-orm'

import {
  createEventsEndpoint,
  createSyncOutputSchema,
  createSyncPublisher,
} from '~/orpc/lib/sync'

/** A device persists synced rows as-is, so the string reaches it only through `resolve`. */
export const syncedColumns = omit(getColumns(connections), ['connectionString'])

export const output = createSyncOutputSchema(
  connectionsSelectSchema.omit('connectionString')
)

export const publisher = createSyncPublisher(
  output,
  'orpc:publisher:connections:'
)
export const events = createEventsEndpoint(output, publisher)
