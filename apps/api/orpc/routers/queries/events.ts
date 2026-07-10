import { queriesSelectSchema } from '@conar/db/schema'

import { createEventsEndpoint, createSyncOutputSchema, createSyncPublisher } from '~/orpc/lib/sync'

const output = createSyncOutputSchema(queriesSelectSchema)

export const publisher = createSyncPublisher(output, 'orpc:publisher:queries:')
export const events = createEventsEndpoint(output, publisher)
