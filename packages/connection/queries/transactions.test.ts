import { describe, expect, test } from 'bun:test'

import type { TxHandle } from './transactions'
import { registerTransaction, transactionQueries } from './transactions'

const spyHandle = () => {
  const calls: string[] = []
  const record = (call: string) => {
    calls.push(call)
    return Promise.resolve()
  }
  const handle: TxHandle = {
    commit: () => record('commit'),
    execute: (query) =>
      record(`execute:${query}`).then(() => ({ duration: 0, result: [] })),
    release: () => record('release'),
    rollback: () => record('rollback'),
  }
  return { calls, handle }
}

describe('transactionQueries', () => {
  test('commits once and releases', async () => {
    const { calls, handle } = spyHandle()
    const txId = registerTransaction(handle)

    await transactionQueries.commitTransaction({ txId })

    expect(calls).toEqual(['commit', 'release'])
  })

  test('a second commit reports that nothing is active', async () => {
    const { handle } = spyHandle()
    const txId = registerTransaction(handle)

    await transactionQueries.commitTransaction({ txId })

    await expect(
      transactionQueries.commitTransaction({ txId })
    ).rejects.toThrow(txId)
  })

  test('rollback stays idempotent', async () => {
    const { calls, handle } = spyHandle()
    const txId = registerTransaction(handle)

    await transactionQueries.rollbackTransaction({ txId })
    await transactionQueries.rollbackTransaction({ txId })

    expect(calls).toEqual(['rollback', 'release'])
  })

  test('an owned transaction rejects another owner', async () => {
    const { calls, handle } = spyHandle()
    const txId = registerTransaction(handle, 'owner-a')

    await expect(
      transactionQueries.executeTransaction({
        ownerId: 'owner-b',
        query: 'SELECT 1',
        txId,
        values: [],
      })
    ).rejects.toThrow(txId)

    await transactionQueries.executeTransaction({
      ownerId: 'owner-a',
      query: 'SELECT 1',
      txId,
      values: [],
    })

    expect(calls).toEqual(['execute:SELECT 1'])

    await transactionQueries.rollbackTransaction({ ownerId: 'owner-a', txId })
  })
})
