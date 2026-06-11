import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { type } from 'arktype'
import { shapeOptions } from '~/lib/electric'
import { orpc } from '~/lib/orpc'
import { persistence } from '~/lib/sync'

export const queriesSchema = type({
  id: 'string',
  createdAt: 'Date',
  updatedAt: 'Date',
  connectionResourceId: 'string | null',
  name: 'string',
  query: 'string',
})

export type Query = typeof queriesSchema.infer

// @ts-expect-error waiting for https://github.com/TanStack/db/pull/1453
export const queriesCollection = createCollection(persistedCollectionOptions<Query>({
  ...electricCollectionOptions({
    schema: queriesSchema,
    id: 'queries',
    shapeOptions: shapeOptions('queries'),
    getKey: item => item.id,
    onInsert: async ({ transaction, collection }) => {
      const result = await orpc.queries.create.call(transaction.mutations.map(m => m.modified))
      await collection.utils.awaitTxId(result.txid)
    },
    onDelete: async ({ transaction, collection }) => {
      const result = await orpc.queries.remove.call(transaction.mutations.map(m => ({ id: m.key })))
      await collection.utils.awaitTxId(result.txid)
    },
  }),
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  persistence,
  schemaVersion: 1,
}))
