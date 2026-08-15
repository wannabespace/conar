import { workspacesSelectSchema } from '@tamery/db/schema'

import {
  createEventsEndpoint,
  createSyncOutputSchema,
  createSyncPublisher,
} from '~/orpc/lib/sync'

const output = createSyncOutputSchema(workspacesSelectSchema)

export const publisher = createSyncPublisher(
  output,
  'orpc:publisher:workspaces:'
)
export const events = createEventsEndpoint(output, publisher)
