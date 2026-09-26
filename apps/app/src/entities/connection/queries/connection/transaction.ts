import { silently } from '@tamery/shared/utils'
import type { Type } from 'arktype'
import type { AccessMode, IsolationLevel, Kysely } from 'kysely'
import { CompiledQuery } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { ResultSet } from './custom'
import { resultSetsType } from './custom'

export const transactionQuery = (
  {
    accessMode,
    commit,
    isolationLevel,
    statements,
  }: {
    accessMode?: AccessMode
    commit: boolean
    isolationLevel?: IsolationLevel
    statements: string[]
  },
  signal: AbortSignal
) => {
  const compiled = statements.map((statement) => CompiledQuery.raw(statement))

  const run = async <DB>(db: Kysely<DB>) => {
    let begin = db.startTransaction()
    if (accessMode) {
      begin = begin.setAccessMode(accessMode)
    }
    if (isolationLevel) {
      begin = begin.setIsolationLevel(isolationLevel)
    }
    const trx = await begin.execute()
    try {
      const sets: ResultSet[] = []
      for (const query of compiled) {
        // A Stop can land between statements, where there is nothing to cancel: never reach COMMIT after it.
        signal.throwIfAborted()
        // Sequential by design: the statements run in order inside one transaction.
        // oxlint-disable-next-line no-await-in-loop
        sets.push(...resultSetsType.assert(await trx.executeQuery(query)))
      }
      signal.throwIfAborted()
      await (commit ? trx.commit() : trx.rollback()).execute()
      return sets
    } catch (error) {
      await silently(() => trx.rollback().execute())
      throw error
    }
  }

  return {
    ...createQuery<Type<ResultSet[]>>({
      query: {
        clickhouse: run,
        mssql: run,
        mysql: run,
        postgres: run,
      },
    }),
    queryIds: compiled.map((query) => query.queryId.queryId),
  }
}
