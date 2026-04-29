import { randomUUID } from 'node:crypto'

export interface TxHandle {
  execute: (query: string, values: unknown[]) => Promise<{ result: unknown, duration: number }>
  commit: () => Promise<void>
  rollback: () => Promise<void>
  release: () => Promise<void>
}

const ORPHAN_TX_TIMEOUT_MS = 5 * 60 * 1000

const activeTransactions = new Map<string, TxHandle>()

export function registerTransaction(handle: TxHandle) {
  const txId = randomUUID()

  const timeout = setTimeout(() => {
    const current = activeTransactions.get(txId)
    if (!current)
      return
    activeTransactions.delete(txId)
    current.rollback()
      .catch(() => {})
      .finally(() => current.release().catch(() => {}))
  }, ORPHAN_TX_TIMEOUT_MS)

  const wrapped: TxHandle = {
    ...handle,
    release: async () => {
      clearTimeout(timeout)
      await handle.release()
    },
  }

  activeTransactions.set(txId, wrapped)
  return txId
}

export function getTransaction(txId: string) {
  return activeTransactions.get(txId)
}

export function disposeTransaction(txId: string) {
  const handle = activeTransactions.get(txId)
  if (!handle)
    return undefined
  activeTransactions.delete(txId)
  return handle
}
