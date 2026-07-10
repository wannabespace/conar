import { IORedisPublisher } from '@orpc/experimental-publisher/ioredis'
import { eventIterator } from '@orpc/server'
import type { Type } from 'arktype'
import { type } from 'arktype'

import { redis } from '~/lib/redis'
import { authMiddleware, orpc } from '~/orpc'

export function createSyncOutputSchema<const T>(
  schema: type.validate<T>,
): type.instantiate<{ type: '"insert"'; value: T } | { type: '"update"'; value: T } | { type: '"delete"'; key: 'string.uuid.v7' }>
export function createSyncOutputSchema(schema: Type) {
  return type.or(type({ type: '"insert"', value: schema }), type({ type: '"update"', value: schema }), type({ type: '"delete"', key: 'string.uuid.v7' }))
}

export function createSyncPublisher<T extends Type<{ type: 'insert' | 'update' | 'delete' }>>(output: T, prefix: string) {
  return new IORedisPublisher<Record<string, typeof output.infer>>({
    commander: redis.duplicate(),
    listener: redis.duplicate(),
    prefix,
  })
}

export async function syncDiff<TItem>(opts: {
  input: { id: string; updatedAt: Date }[]
  queries: {
    updated: (inputItems: { id: string; updatedAt: Date }[]) => Promise<TItem[]>
    new: (excludeIds: string[]) => Promise<TItem[]>
    existing: (includeIds: string[]) => Promise<string[]>
  }
}) {
  const inputIds = opts.input.map((i) => i.id)
  const [updatedItems, newItems, existingIds] = await Promise.all([
    inputIds.length > 0 ? opts.queries.updated(opts.input) : ([] as TItem[]),
    opts.queries.new(inputIds),
    opts.queries.existing(inputIds),
  ])
  const missingIds = inputIds.filter((id) => !existingIds.includes(id))
  return { updatedItems, newItems, missingIds }
}

export function createEventsEndpoint<
  O extends Type<{ type: 'insert' | 'update' | 'delete' }>,
  // eslint-disable-next-line typescript/no-explicit-any
  P extends IORedisPublisher<any>,
>(output: O, publisher: P) {
  return orpc
    .use(authMiddleware)
    .output(eventIterator(output))
    .handler(async function* ({ context, signal, lastEventId }) {
      for await (const payload of publisher.subscribe(context.user.id, { signal, lastEventId })) {
        yield payload
      }
    })
}
