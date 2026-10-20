import path from 'node:path'

import type { QueryExecutor } from '@tamery/connection/queries'
import type { Dialect } from '@tamery/shared/enums/connection-type'
import type { UtilityProcess } from 'electron'
import { utilityProcess } from 'electron'

import type { QueryProcessReply, QueryProcessRequest } from '../query'
import { confirmHostKey } from './ssh-host-key'

const pending = new Map<number, PromiseWithResolvers<unknown>>()
let nextId = 0
let child: UtilityProcess | null = null

const send = (forked: UtilityProcess, request: QueryProcessRequest) =>
  forked.postMessage(request)

const start = () => {
  const forked = utilityProcess.fork(
    path.join(import.meta.dirname, './query.js'),
    [],
    { serviceName: 'Tamery Databases' }
  )
  forked.on('message', async (reply: QueryProcessReply) => {
    if (reply.type === 'hostKey') {
      const trusted = await confirmHostKey(reply.prompt)
      send(forked, {
        hostKeyId: reply.hostKeyId,
        trusted,
        type: 'hostKey',
      })
      return
    }
    const request = pending.get(reply.id)
    pending.delete(reply.id)
    if (reply.type === 'error') {
      request?.reject(new Error(reply.error))
    } else {
      request?.resolve(reply.result)
    }
  })
  // Without a listener the emitter throws a fatal child error into main.
  forked.on('error', (type, location) => {
    console.error('[Database process]', type, location)
  })
  forked.once('exit', () => {
    child = null
    for (const request of pending.values()) {
      request.reject(new Error('The database process stopped'))
    }
    pending.clear()
  })
  return forked
}

const call = <M extends keyof QueryExecutor>(
  dialect: Dialect,
  method: M,
  args: Parameters<QueryExecutor[M]>[0]
) => {
  child ??= start()
  const id = nextId
  nextId += 1
  const request = Promise.withResolvers<unknown>()
  pending.set(id, request)
  send(child, { args, dialect, id, method, type: 'call' })
  return request.promise as ReturnType<QueryExecutor[M]>
}

export const queryProcess = {
  executor: (dialect: Dialect): QueryExecutor => ({
    beginTransaction: (args) => call(dialect, 'beginTransaction', args),
    cancel: (args) => call(dialect, 'cancel', args),
    commitTransaction: (args) => call(dialect, 'commitTransaction', args),
    execute: (args) => call(dialect, 'execute', args),
    executeTransaction: (args) => call(dialect, 'executeTransaction', args),
    openSession: (args) => call(dialect, 'openSession', args),
    rollbackTransaction: (args) => call(dialect, 'rollbackTransaction', args),
    transactionStatus: (args) => call(dialect, 'transactionStatus', args),
  }),
  resetTransactions: () => {
    if (child) {
      send(child, { type: 'resetTransactions' })
    }
  },
}
