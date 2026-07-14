import type { AnyFunction } from '@tamery/shared/utils/helpers'
import { handleAggregateError, uppercaseFirst } from '@tamery/shared/utils/helpers'

export interface QueryExecuteResult {
  result: unknown
  duration: number
}

export interface QueryExecutor {
  execute: (args: {
    connectionString: string
    query: string
    values?: unknown[]
  }) => Promise<QueryExecuteResult>
  beginTransaction: (args: {
    connectionString: string
    ownerId?: string
  }) => Promise<{ txId: string }>
  executeTransaction: (args: {
    txId: string
    query: string
    values: unknown[]
    ownerId?: string
  }) => Promise<QueryExecuteResult>
  commitTransaction: (args: { txId: string; ownerId?: string }) => Promise<void>
  rollbackTransaction: (args: { txId: string; ownerId?: string }) => Promise<void>
}

export function replaceErrorPrefix(message: string) {
  return message.toLowerCase().startsWith('error: ') ? message.slice(7) : message
}

export function handleQueryError<T extends AnyFunction>(fn: T): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await handleAggregateError(fn)(...args)
    } catch (error) {
      if (error instanceof Error) {
        throw new TypeError(uppercaseFirst(replaceErrorPrefix(error.message)), { cause: error })
      }

      throw error
    }
  }) as T
}
