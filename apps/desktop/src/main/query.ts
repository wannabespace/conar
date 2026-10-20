import '@tamery/shared/arktype-config'
import process from 'node:process'

import type { QueryExecutor } from '@tamery/connection/queries'
import { resetTransactions } from '@tamery/connection/queries/transactions'
import { sshForwarding } from '@tamery/connection/ssh/forwarding'
import { tunnelForwarding } from '@tamery/connection/ssh/tunnel'
import { isConnectionError } from '@tamery/shared/connections'
import type { Dialect } from '@tamery/shared/enums/connection-type'

import type {
  QueryProcessReply,
  QueryProcessRequest,
} from './lib/query-process'

const dialects: Record<Dialect, () => Promise<{ query: QueryExecutor }>> = {
  clickhouse: () => import('@tamery/connection/queries/dialects/clickhouse'),
  mssql: () => import('@tamery/connection/queries/dialects/mssql'),
  mysql: () => import('@tamery/connection/queries/dialects/mysql'),
  postgres: () => import('@tamery/connection/queries/dialects/pg'),
  sqlite: () => import('@tamery/connection/queries/dialects/sqlite'),
}

const reply = (message: QueryProcessReply) =>
  process.parentPort.postMessage(message)

const hostKeyAnswers = new Map<number, (trusted: boolean) => void>()
let nextHostKeyId = 0

sshForwarding.use((connectionString) =>
  tunnelForwarding(connectionString, (prompt) => {
    const hostKeyId = nextHostKeyId
    nextHostKeyId += 1
    const answer = Promise.withResolvers<boolean>()
    hostKeyAnswers.set(hostKeyId, answer.resolve)
    reply({ hostKeyId, prompt })
    return answer.promise
  })
)

process.parentPort.on(
  'message',
  async ({ data }: { data: QueryProcessRequest }) => {
    if (data === 'resetTransactions') {
      await resetTransactions()
      return
    }
    if ('hostKeyId' in data) {
      hostKeyAnswers.get(data.hostKeyId)?.(data.trusted)
      hostKeyAnswers.delete(data.hostKeyId)
      return
    }
    try {
      const { query } = await dialects[data.dialect]()
      const run = query[data.method] as (args: unknown) => Promise<unknown>
      reply({ id: data.id, result: await run(data.args) })
    } catch (error) {
      reply({
        error: error instanceof Error ? error.message : String(error),
        id: data.id,
      })
    }
  }
)

process.on('uncaughtException', (error) => {
  if (isConnectionError(error)) {
    console.error('[Suppressed Connection Error]', error.message)
    return
  }
  throw error
})

process.on('unhandledRejection', (reason) => {
  if (isConnectionError(reason)) {
    console.error(
      '[Suppressed Connection Rejection]',
      reason instanceof Error ? reason.message : reason
    )
    return
  }
  throw reason
})
