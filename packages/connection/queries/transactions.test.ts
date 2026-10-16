import { describe, expect, test } from 'bun:test'

import type { TransactionStatus } from '.'
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
    ).rejects.toThrow('no longer open')
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
    ).rejects.toThrow('no longer open')

    await transactionQueries.executeTransaction({
      ownerId: 'owner-a',
      query: 'SELECT 1',
      txId,
      values: [],
    })

    expect(calls).toEqual(['execute:SELECT 1'])

    await transactionQueries.rollbackTransaction({ ownerId: 'owner-a', txId })
  })

  test('a session whose transaction ended is released without a rollback', async () => {
    const { calls, handle } = spyHandle()
    let status: TransactionStatus = 'failed'
    const txId = registerTransaction(
      { ...handle, status: () => Promise.resolve(status) },
      'owner-a'
    )

    expect(await transactionQueries.transactionStatus({ txId })).toBe('ended')
    expect(
      await transactionQueries.transactionStatus({ ownerId: 'owner-a', txId })
    ).toBe('failed')
    expect(calls).toEqual([])

    status = 'ended'
    expect(
      await transactionQueries.transactionStatus({ ownerId: 'owner-a', txId })
    ).toBe('ended')
    expect(calls).toEqual(['release'])
    await expect(
      transactionQueries.commitTransaction({ ownerId: 'owner-a', txId })
    ).rejects.toThrow('no longer open')
  })
})
