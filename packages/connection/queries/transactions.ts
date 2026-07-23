import { randomUUID } from 'node:crypto'

export interface TxHandle {
  execute: (query: string, values: unknown[]) => Promise<{ result: unknown; duration: number }>
  commit: () => Promise<void>
  rollback: () => Promise<void>
  release: () => Promise<void>
}

interface OwnedTx {
  handle: TxHandle
  ownerId?: string
}

const ORPHAN_TX_TIMEOUT_MS = 5 * 60 * 1000

const activeTransactions = new Map<string, OwnedTx>()

export function registerTransaction(handle: TxHandle, ownerId?: string) {
  const txId = randomUUID()

  const timeout = setTimeout(() => {
    const current = activeTransactions.get(txId)
    if (!current) return
    activeTransactions.delete(txId)
    current.handle
      .rollback()
      .catch(() => {})
      .finally(() => current.handle.release().catch(() => {}))
  }, ORPHAN_TX_TIMEOUT_MS)

  const wrapped: TxHandle = {
    ...handle,
    release: async () => {
      clearTimeout(timeout)
      await handle.release()
    },
  }

  activeTransactions.set(txId, { handle: wrapped, ownerId })
  return txId
}

function checkOwner(entry: OwnedTx, ownerId?: string) {
  if (entry.ownerId && ownerId !== entry.ownerId) return false
  return true
}

export function getTransaction(txId: string, ownerId?: string) {
  const entry = activeTransactions.get(txId)
  if (!entry || !checkOwner(entry, ownerId)) return undefined
  return entry.handle
}

export function disposeTransaction(txId: string, ownerId?: string) {
  const entry = activeTransactions.get(txId)
  if (!entry || !checkOwner(entry, ownerId)) return undefined
  activeTransactions.delete(txId)
  return entry.handle
}
