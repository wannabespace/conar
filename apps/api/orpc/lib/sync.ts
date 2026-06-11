import type { Type } from 'arktype'
import { type } from 'arktype'

export function createSyncOutputSchema<const T>(
  schema: type.validate<T>,
): type.instantiate<
  | { type: '"insert"', value: T }
  | { type: '"update"', value: T }
  | { type: '"delete"', key: 'string.uuid.v7' }
>
export function createSyncOutputSchema(schema: Type) {
  return type.or(
    type({ type: '"insert"', value: schema }),
    type({ type: '"update"', value: schema }),
    type({ type: '"delete"', key: 'string.uuid.v7' }),
  )
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
