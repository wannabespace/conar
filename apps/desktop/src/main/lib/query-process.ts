import path from 'node:path'

import type { QueryExecutor } from '@tamery/connection/queries'
import type { Dialect } from '@tamery/shared/enums/connection-type'
import type { UtilityProcess } from 'electron'
import { utilityProcess } from 'electron'

import type { CopyDatabaseRequest } from '../copy-database'
import type { QueryProcessReply, QueryProcessRequest } from '../query'
import { confirmHostKey } from './ssh-host-key'

const pending = new Map<number, PromiseWithResolvers<unknown>>()
const copies = new Map<
  string,
  { done: PromiseWithResolvers<null>; log: (line: string) => void }
>()
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
    if (reply.type === 'copyLog') {
      copies.get(reply.copyId)?.log(reply.line)
      return
    }
    if (reply.type === 'copied') {
      const copy = copies.get(reply.copyId)
      copies.delete(reply.copyId)
      if (reply.error === null) {
        copy?.done.resolve(null)
      } else {
        copy?.done.reject(new Error(reply.error))
      }
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
    for (const copy of copies.values()) {
      copy.done.reject(new Error('The database process stopped'))
    }
    copies.clear()
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
  cancelCopy: (copyId: string) => {
    if (child) {
      send(child, { copyId, type: 'cancelCopy' })
    }
  },
  copyDatabase: (request: CopyDatabaseRequest, log: (line: string) => void) => {
    child ??= start()
    const done = Promise.withResolvers<null>()
    copies.set(request.id, { done, log })
    send(child, { request, type: 'copyDatabase' })
    return done.promise
  },
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
