import path from 'node:path'

import type { QueryExecutor } from '@tamery/connection/queries'
import type { ConfirmHostKey } from '@tamery/connection/ssh/host-key'
import type { Dialect } from '@tamery/shared/enums/connection-type'
import type { UtilityProcess } from 'electron'
import { utilityProcess } from 'electron'

import { confirmHostKey } from './ssh-host-key'

type Method = keyof QueryExecutor

export type QueryProcessRequest =
  | { id: number; dialect: Dialect; method: Method; args: unknown }
  | { hostKeyId: number; trusted: boolean }
  | 'resetTransactions'

export type QueryProcessReply =
  | { id: number; result: unknown }
  | { id: number; error: string }
  | { hostKeyId: number; prompt: Parameters<ConfirmHostKey>[0] }

const pending = new Map<number, PromiseWithResolvers<unknown>>()
let nextId = 0
let child: UtilityProcess | null = null

const start = () => {
  const queryProcess = utilityProcess.fork(
    path.join(import.meta.dirname, './query.js'),
    [],
    { serviceName: 'Tamery Databases' }
  )
  queryProcess.on('message', async (reply: QueryProcessReply) => {
    if ('hostKeyId' in reply) {
      const trusted = await confirmHostKey(reply.prompt)
      queryProcess.postMessage({
        hostKeyId: reply.hostKeyId,
        trusted,
      } satisfies QueryProcessRequest)
      return
    }
    const request = pending.get(reply.id)
    pending.delete(reply.id)
    if ('error' in reply) {
      request?.reject(new Error(reply.error))
    } else {
      request?.resolve(reply.result)
    }
  })
  queryProcess.once('exit', () => {
    child = null
    for (const request of pending.values()) {
      request.reject(new Error('The database process stopped'))
    }
    pending.clear()
  })
  return queryProcess
}

const call = <M extends Method>(
  dialect: Dialect,
  method: M,
  args: Parameters<QueryExecutor[M]>[0]
) => {
  child ??= start()
  const id = nextId
  nextId += 1
  const request = Promise.withResolvers<unknown>()
  pending.set(id, request)
  child.postMessage({ args, dialect, id, method } satisfies QueryProcessRequest)
  return request.promise as ReturnType<QueryExecutor[M]>
}

// A socket close blocks its thread for a second per socket under a macOS network content filter (VPN, endpoint security), so drivers never run in main.
export const queryProcessExecutor = (dialect: Dialect): QueryExecutor => ({
  beginTransaction: (args) => call(dialect, 'beginTransaction', args),
  cancel: (args) => call(dialect, 'cancel', args),
  commitTransaction: (args) => call(dialect, 'commitTransaction', args),
  execute: (args) => call(dialect, 'execute', args),
  executeTransaction: (args) => call(dialect, 'executeTransaction', args),
  openSession: (args) => call(dialect, 'openSession', args),
  rollbackTransaction: (args) => call(dialect, 'rollbackTransaction', args),
  transactionStatus: (args) => call(dialect, 'transactionStatus', args),
})

export const resetQueryTransactions = () => {
  child?.postMessage('resetTransactions' satisfies QueryProcessRequest)
}
