import { randomUUID } from 'node:crypto'

import { silently } from '@tamery/shared/utils'

import type { QueryExecutor } from '.'
import { handleQueryError } from '.'

export interface TxHandle {
  execute: (
    query: string,
    values: unknown[]
  ) => Promise<{ result: unknown; duration: number }>
  commit: () => Promise<void>
  rollback: () => Promise<void>
  release: () => Promise<void>
}

interface OwnedTx {
  handle: TxHandle
  keepAlive: () => void
  ownerId?: string
}

const IDLE_TX_TIMEOUT_MS = 5 * 60 * 1000

const activeTransactions = new Map<string, OwnedTx>()

export const registerTransaction = (handle: TxHandle, ownerId?: string) => {
  const txId = randomUUID()
  let timeout: ReturnType<typeof setTimeout> | undefined

  const keepAlive = () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      void (async () => {
        const current = activeTransactions.get(txId)
        if (!current) {
          return
        }
        activeTransactions.delete(txId)
        await silently(() => current.handle.rollback())
        await silently(() => current.handle.release())
      })()
    }, IDLE_TX_TIMEOUT_MS)
  }

  const wrapped: TxHandle = {
    ...handle,
    release: async () => {
      clearTimeout(timeout)
      await handle.release()
    },
  }

  activeTransactions.set(txId, { handle: wrapped, keepAlive, ownerId })
  keepAlive()

  return txId
}

const owned = (entry: OwnedTx, ownerId?: string) =>
  !entry.ownerId || ownerId === entry.ownerId

const requireTransaction = (txId: string, ownerId?: string) => {
  const entry = activeTransactions.get(txId)
  if (!entry || !owned(entry, ownerId)) {
    throw new Error(`No active transaction found for id: ${txId}`)
  }
  return entry
}

const disposeTransaction = (txId: string, ownerId?: string) => {
  const entry = activeTransactions.get(txId)
  if (!entry || !owned(entry, ownerId)) {
    return
  }
  activeTransactions.delete(txId)
  return entry.handle
}

const settle = async (handle: TxHandle, finish: () => Promise<void>) => {
  try {
    await finish()
  } finally {
    await silently(() => handle.release())
  }
}

export const transactionQueries = {
  commitTransaction: handleQueryError(
    async ({ txId, ownerId }: { txId: string; ownerId?: string }) => {
      const handle = disposeTransaction(txId, ownerId)
      if (!handle) {
        throw new Error(`No active transaction found for id: ${txId}`)
      }
      await settle(handle, () => handle.commit())
    }
  ),
  executeTransaction: handleQueryError(
    async ({
      query,
      txId,
      values,
      ownerId,
    }: {
      txId: string
      query: string
      values: unknown[]
      ownerId?: string
    }) => {
      const entry = requireTransaction(txId, ownerId)
      entry.keepAlive()
      try {
        return await entry.handle.execute(query, values)
      } finally {
        entry.keepAlive()
      }
    }
  ),
  rollbackTransaction: handleQueryError(
    async ({ txId, ownerId }: { txId: string; ownerId?: string }) => {
      const handle = disposeTransaction(txId, ownerId)
      if (!handle) {
        return
      }
      await settle(handle, () => handle.rollback())
    }
  ),
} satisfies Pick<
  QueryExecutor,
  'commitTransaction' | 'executeTransaction' | 'rollbackTransaction'
>

export const resetTransactions = async () => {
  const entries = [...activeTransactions.values()]
  activeTransactions.clear()

  await Promise.all(
    entries.map(async ({ handle }) => {
      await silently(() => handle.rollback())
      await silently(() => handle.release())
    })
  )
}
