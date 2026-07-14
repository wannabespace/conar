import { connectionsResourcesSelectSchema } from '@tamery/db/schema'

import { createEventsEndpoint, createSyncOutputSchema, createSyncPublisher } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(connectionsResourcesSelectSchema)

export const publisher = createSyncPublisher(output, 'orpc:publisher:connections-resources:')
export const events = createEventsEndpoint(output, publisher)
