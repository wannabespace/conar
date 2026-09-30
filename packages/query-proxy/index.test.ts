import { expect, test } from 'bun:test'

import { call, os } from '@orpc/server'
import { transactionQueries } from '@tamery/connection/queries/transactions'

import { createQueryRouter } from '.'

const builder = os.$context<{ userId: string }>()
const orpc = builder.use(builder.middleware(({ next }) => next()))
const router = createQueryRouter(orpc, {
  connectionString: () => '',
  owner: (context) => context.userId,
})

test('cloud transactions ignore a forged client owner for execute, commit and rollback', async () => {
  const beginInput = {
    connectionString: 'http://localhost:8123',
    ownerId: 'attacker',
  }
  const { txId } = await call(router.clickhouse.beginTransaction, beginInput, {
    context: { userId: 'owner' },
  })
  const forged = { ownerId: 'owner', query: 'SELECT 1', txId, values: [] }
  const context = { userId: 'attacker' }
  await expect(
    call(router.postgres.executeTransaction, forged, { context })
  ).rejects.toThrow(txId)
  await expect(
    call(router.postgres.commitTransaction, forged, { context })
  ).rejects.toThrow(txId)
  await call(router.postgres.rollbackTransaction, forged, { context })
  await expect(
    transactionQueries.executeTransaction({
      ownerId: 'attacker',
      query: 'SELECT 1',
      txId,
      values: [],
    })
  ).rejects.toThrow(txId)
  await transactionQueries.rollbackTransaction({ ownerId: 'owner', txId })
  await expect(
    call(router.postgres.commitTransaction, forged, {
      context: { userId: 'owner' },
    })
  ).rejects.toThrow(txId)
})
