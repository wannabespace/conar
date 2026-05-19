import type { Type } from 'arktype'
import { IORedisPublisher } from '@orpc/experimental-publisher/ioredis'
import { type } from 'arktype'
import { redis } from '~/lib/redis'

export function createSyncOutputSchema<const T>(
  schema: type.validate<T>,
): type.instantiate<
  | { type: '"insert"', value: T }
  | { type: '"update"', value: T }
  | { type: '"delete"', value: 'string.uuid.v7' }
  | { type: '"synced"' }
>
export function createSyncOutputSchema(schema: Type) {
  return type.or(
    type({ type: '"insert"', value: schema }),
    type({ type: '"update"', value: schema }),
    type({ type: '"delete"', value: 'string.uuid.v7' }),
    type({ type: '"synced"' }),
  )
}

export function createSyncPublisher<T extends Type>(
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
    inputIds.length > 0 ? opts.queries.updated(opts.input) : [],
    opts.queries.new(inputIds),
    opts.queries.existing(inputIds),
  ])
  const missingIds = inputIds.filter(id => !existingIds.includes(id))
  return { updatedItems, newItems, missingIds }
}
