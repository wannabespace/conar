import { connectionsSelectSchema } from '@tamery/db/schema'
import { createEventsEndpoint, createSyncOutputSchema, createSyncPublisher } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(connectionsSelectSchema)

export const publisher = createSyncPublisher(output, 'orpc:publisher:connections:')
export const events = createEventsEndpoint(output, publisher)
