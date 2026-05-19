import type { Type } from 'arktype'
import { IORedisPublisher } from '@orpc/experimental-publisher/ioredis'
import { eventIterator } from '@orpc/server'
import { type } from 'arktype'

import { redis } from '~/lib/redis'
import { authMiddleware, orpc } from '~/orpc'

export function createSyncOutputSchema<const T>(
  schema: type.validate<T>,
): type.instantiate<
  | { type: '"insert"', key?: 'string.uuid.v7', value: T }
  | { type: '"update"', key?: 'string.uuid.v7', value: T }
  | { type: '"delete"', key: 'string.uuid.v7', value?: 'null' }
>
export function createSyncOutputSchema(schema: Type) {
  return type.or(
    type({ type: '"insert"', key: 'string.uuid.v7?', value: schema }),
    type({ type: '"update"', key: 'string.uuid.v7?', value: schema }),
    // TODO: change any to null in future
    type({ type: '"delete"', key: 'string.uuid.v7', value: 'unknown.any?' }),
  )
}

export function createSyncPublisher<T extends Type<{ type: 'insert' | 'update' | 'delete' }>>(
  output: T,
  prefix: string,
) {
  return new IORedisPublisher<{
    event: typeof output.infer & { clientId?: string }
  }>({
    commander: redis.duplicate(),
    listener: redis.duplicate(),
    prefix,
  })
}

export async function syncDiff<TItem>(opts: {
  input: { id: string, updatedAt: Date }[]
  queries: {
    updated: (inputItems: { id: string, updatedAt: Date }[]) => Promise<TItem[]>
    new: (excludeIds: string[]) => Promise<TItem[]>
    existing: (includeIds: string[]) => Promise<string[]>
  }
}) {
  const inputIds = opts.input.map(i => i.id)
  const [updatedItems, newItems, existingIds] = await Promise.all([
    inputIds.length > 0 ? opts.queries.updated(opts.input) : [] as TItem[],
    opts.queries.new(inputIds),
    opts.queries.existing(inputIds),
  ])
  const missingIds = inputIds.filter(id => !existingIds.includes(id))
  return { updatedItems, newItems, missingIds }
}

// eslint-disable-next-line ts/no-explicit-any
export function createEventsEndpoint<O extends Type<{ type: 'insert' | 'update' | 'delete' }>, P extends IORedisPublisher<any>>(output: O, publisher: P) {
  return orpc
    .use(authMiddleware)
    .output(eventIterator(output))
    .handler(async function* ({ context, signal, lastEventId }) {
      for await (const { clientId, ...payload } of publisher.subscribe('event', { signal, lastEventId })) {
        if (clientId && clientId === context.clientId)
          continue
        yield payload
      }
    })
}
