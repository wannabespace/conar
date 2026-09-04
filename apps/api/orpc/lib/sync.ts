import { IORedisPublisher } from '@orpc/experimental-publisher/ioredis'
import { eventIterator } from '@orpc/server'
import type { Type } from 'arktype'
import { type } from 'arktype'

import { redis } from '~/lib/redis'
import { authMiddleware, orpc } from '~/orpc'

// Overload signatures require function declarations (func-style exception).
// oxlint-disable-next-line eslint(func-style)
export function createSyncOutputSchema<const T>(
  schema: type.validate<T>
): type.instantiate<
  | { type: '"insert"'; value: T }
  | { type: '"update"'; value: T }
  | { type: '"delete"'; key: 'string.uuid.v7' }
>
// oxlint-disable-next-line eslint(func-style)
export function createSyncOutputSchema(schema: Type) {
  return type.or(
    type({ type: '"insert"', value: schema }),
    type({ type: '"update"', value: schema }),
    type({ key: 'string.uuid.v7', type: '"delete"' })
  )
}

export const createSyncPublisher = <
  T extends Type<{ type: 'insert' | 'update' | 'delete' }>,
>(
  _output: T,
  prefix: string
) =>
  new IORedisPublisher<Record<string, T['inferIn']>>({
    commander: redis.duplicate(),
    listener: redis.duplicate(),
    prefix,
  })

export const syncDiff = async <TItem>(opts: {
  input: { id: string; updatedAt: Date }[]
  queries: {
    updated?: (
      inputItems: { id: string; updatedAt: Date }[]
    ) => Promise<TItem[]>
    new: (excludeIds: string[]) => Promise<TItem[]>
    existing: (includeIds: string[]) => Promise<string[]>
  }
}) => {
  const inputIds = opts.input.map((i) => i.id)
  const [updatedItems, newItems, existingIds] = await Promise.all([
    inputIds.length > 0 && opts.queries.updated
      ? opts.queries.updated(opts.input)
      : ([] as TItem[]),
    opts.queries.new(inputIds),
    opts.queries.existing(inputIds),
  ])
  const missingIds = inputIds.filter((id) => !existingIds.includes(id))
  return { missingIds, newItems, updatedItems }
}

export const createEventsEndpoint = <
  O extends Type<{ type: 'insert' | 'update' | 'delete' }>,
>(
  output: O,
  publisher: ReturnType<typeof createSyncPublisher<O>>
) =>
  orpc
    .use(authMiddleware)
    .output(eventIterator(output))
    .handler(async function* eventsHandler({ context, signal, lastEventId }) {
      for await (const payload of publisher.subscribe(context.user.id, {
        lastEventId,
        signal,
      })) {
        yield payload as O['inferIn'] extends infer TPayload ? TPayload : never
      }
    })
